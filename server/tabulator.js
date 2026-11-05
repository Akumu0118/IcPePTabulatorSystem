// ICPEP Tabulator server
// ---------------------------------------------------------------------------
// Holds the single source of truth for the event (contestants, categories,
// judges, scores) and shares it with every connected device over Socket.IO.
//
// - Attached to Vite's own HTTP server (see vite.config.js), so `npm run dev`
//   and `npm start` serve the app AND the scoring server on the same port.
// - Everything is saved to data/tabulator-data.json after every change, so a
//   restart or a crashed laptop does not lose scores.
// - Every action is checked here, on the server: judges can only submit their
//   own scores, only for unlocked categories, and only complete, in-range
//   scores. Admin-only actions require the admin PIN session.
// ---------------------------------------------------------------------------

import { Server } from 'socket.io'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import crypto from 'node:crypto'

const JUDGE_COUNT = 5
const MAX_LOGIN_FAILURES = 5
const LOGIN_COOLDOWN_MS = 30_000

class UserError extends Error {}

// ---------- defaults --------------------------------------------------------

function defaultCategories() {
  return [
    {
      id: 'cat_1',
      name: 'Production Number & Casual Wear',
      locked: false,
      criteria: [
        { id: 'crit_1', name: 'Poise & Bearing', maxScore: 40 },
        { id: 'crit_2', name: 'Stage Presence', maxScore: 30 },
        { id: 'crit_3', name: 'Overall Impact', maxScore: 30 }
      ]
    },
    {
      id: 'cat_2',
      name: 'Formal Wear / Evening Gown',
      locked: false,
      criteria: [
        { id: 'crit_4', name: 'Elegance & Carriage', maxScore: 40 },
        { id: 'crit_5', name: 'Fit & Design', maxScore: 30 },
        { id: 'crit_6', name: 'Poise & Confidence', maxScore: 30 }
      ]
    },
    {
      id: 'cat_3',
      name: 'Question & Answer (Q&A)',
      locked: false,
      criteria: [
        { id: 'crit_7', name: 'Intelligence & Substance', maxScore: 50 },
        { id: 'crit_8', name: 'Delivery & Diction', maxScore: 30 },
        { id: 'crit_9', name: 'Stage Presence', maxScore: 20 }
      ]
    }
  ]
}

function defaultContestants() {
  return [
    { id: 'c1', number: 1, name: 'Candidate 01', location: 'College of Engineering' },
    { id: 'c2', number: 2, name: 'Candidate 02', location: 'College of Architecture' },
    { id: 'c3', number: 3, name: 'Candidate 03', location: 'College of Computer Studies' },
    { id: 'c4', number: 4, name: 'Candidate 04', location: 'College of Arts & Sciences' },
    { id: 'c5', number: 5, name: 'Candidate 05', location: 'College of Business' }
  ]
}

// ---------- helpers ---------------------------------------------------------

const randomPin = () => String(crypto.randomInt(0, 10000)).padStart(4, '0')
const randomToken = () => crypto.randomBytes(24).toString('hex')
const randomId = (prefix) => `${prefix}_${crypto.randomBytes(5).toString('hex')}`

function cleanText(value, label, maxLength = 120) {
  const text = typeof value === 'string' ? value.trim() : ''
  if (!text) throw new UserError(`${label} is required.`)
  if (text.length > maxLength) throw new UserError(`${label} is too long (max ${maxLength} characters).`)
  return text
}

function lanAddresses(port) {
  const out = []
  for (const [name, addrs] of Object.entries(os.networkInterfaces())) {
    for (const a of addrs || []) {
      const isV4 = a.family === 'IPv4' || a.family === 4
      if (isV4 && !a.internal) out.push({ name, url: `http://${a.address}:${port}` })
    }
  }
  return out
}

// ---------- persistent store ------------------------------------------------

function createStore(dataDir) {
  const file = path.join(dataDir, 'tabulator-data.json')
  let data

  const usedPins = () => new Set([data.adminPin, ...data.judges.map((j) => j.pin)])
  const uniquePin = (taken) => {
    let pin
    do pin = randomPin()
    while (taken.has(pin))
    taken.add(pin)
    return pin
  }

  function fresh() {
    const taken = new Set()
    const adminPin = process.env.ADMIN_PIN && /^\d{4,8}$/.test(process.env.ADMIN_PIN)
      ? process.env.ADMIN_PIN
      : uniquePin(taken)
    taken.add(adminPin)
    const categories = defaultCategories()
    return {
      version: 1,
      adminPin,
      judges: Array.from({ length: JUDGE_COUNT }, (_, i) => ({
        id: `judge${i + 1}`,
        name: `Judge ${i + 1}`,
        pin: uniquePin(taken)
      })),
      categories,
      contestants: defaultContestants(),
      scores: {},
      activeCategory: categories[0].id,
      sessions: {}
    }
  }

  function load() {
    if (fs.existsSync(file)) {
      try {
        data = JSON.parse(fs.readFileSync(file, 'utf8'))
        // fill in anything missing from older files
        const base = fresh()
        for (const key of Object.keys(base)) if (data[key] === undefined) data[key] = base[key]
        return
      } catch (err) {
        const broken = `${file}.broken-${Date.now()}`
        fs.copyFileSync(file, broken)
        console.error(`[tabulator] Could not read ${file} (${err.message}). A copy was saved to ${broken}; starting fresh.`)
      }
    }
    data = fresh()
    save()
  }

  function save() {
    fs.mkdirSync(dataDir, { recursive: true })
    const tmp = `${file}.tmp`
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2))
    fs.renameSync(tmp, file)
  }

  function backup(label) {
    fs.mkdirSync(dataDir, { recursive: true })
    const stamp = new Date().toISOString().replace(/[:.]/g, '-')
    const target = path.join(dataDir, `backup-${label}-${stamp}.json`)
    fs.writeFileSync(target, JSON.stringify(data, null, 2))
    return target
  }

  load()
  return {
    file,
    get data() { return data },
    save,
    backup,
    newJudgePin: () => uniquePin(usedPins())
  }
}

// ---------- server ----------------------------------------------------------

export function attachTabulator(httpServer, { dataDir = path.resolve('data') } = {}) {
  const store = createStore(dataDir)
  const io = new Server(httpServer, {
    // keep Vite's own hot-reload websocket working on the same port
    destroyUpgrade: false
  })

  const loginFailures = new Map() // ip -> { count, until }

  // ----- views (what each kind of device is allowed to see) -----

  const sockets = () => io.of('/').sockets
  const onlineCount = (judgeId) => {
    let n = 0
    for (const [, s] of sockets()) if (s.data.session?.judgeId === judgeId) n++
    return n
  }

  const publicInfo = () => ({
    judges: store.data.judges.map(({ id, name }) => ({ id, name }))
  })

  const adminView = () => {
    const d = store.data
    const port = httpServer.address()?.port
    return {
      categories: d.categories,
      contestants: d.contestants,
      activeCategory: d.activeCategory,
      scores: d.scores,
      judges: d.judges.map((j) => ({ id: j.id, name: j.name, pin: j.pin, online: onlineCount(j.id) })),
      serverAddresses: port ? lanAddresses(port) : []
    }
  }

  // judges only ever receive their own scores
  const judgeView = (judgeId) => {
    const d = store.data
    const scores = {}
    for (const [catId, byContestant] of Object.entries(d.scores)) {
      for (const [cId, byJudge] of Object.entries(byContestant)) {
        if (byJudge[judgeId]) {
          scores[catId] ??= {}
          scores[catId][cId] = { [judgeId]: byJudge[judgeId] }
        }
      }
    }
    return {
      categories: d.categories,
      contestants: d.contestants,
      activeCategory: d.activeCategory,
      scores,
      judges: publicInfo().judges,
      serverAddresses: []
    }
  }

  const sendStateTo = (socket) => {
    const s = socket.data.session
    if (!s) return
    socket.emit('state', s.role === 'admin' ? adminView() : judgeView(s.judgeId))
  }

  const broadcast = () => {
    io.to('admins').emit('state', adminView())
    for (const j of store.data.judges) io.to(`judge:${j.id}`).emit('state', judgeView(j.id))
  }

  const commit = () => {
    store.save()
    broadcast()
  }

  // ----- sessions -----

  const sessionInfo = (session) => {
    if (session.role === 'admin') return { role: 'admin', name: 'Admin Tabulator' }
    const judge = store.data.judges.find((j) => j.id === session.judgeId)
    return { role: 'judge', judgeId: session.judgeId, name: judge?.name || session.judgeId }
  }

  const bind = (socket, token, session) => {
    unbind(socket)
    socket.data.session = { ...session, token }
    socket.join(session.role === 'admin' ? 'admins' : `judge:${session.judgeId}`)
    sendStateTo(socket)
    io.to('admins').emit('state', adminView()) // online status changed
  }

  function unbind(socket) {
    const s = socket.data.session
    if (!s) return
    socket.leave(s.role === 'admin' ? 'admins' : `judge:${s.judgeId}`)
    socket.data.session = null
  }

  const signOutJudgeEverywhere = (judgeId, reason) => {
    for (const [token, s] of Object.entries(store.data.sessions)) {
      if (s.judgeId === judgeId) delete store.data.sessions[token]
    }
    for (const [, s] of sockets()) {
      if (s.data.session?.judgeId === judgeId) {
        unbind(s)
        s.emit('signedOut', { reason })
      }
    }
  }

  // ----- request handling -----

  io.on('connection', (socket) => {
    socket.data.session = null
    socket.emit('publicInfo', publicInfo())
    const ip = socket.handshake.address

    const on = (event, handler, requires) => {
      socket.on(event, (payload, ack) => {
        const reply = typeof ack === 'function' ? ack : () => {}
        try {
          const session = socket.data.session
          if (requires === 'admin' && session?.role !== 'admin') throw new UserError('Admin sign-in required.')
          if (requires === 'judge' && session?.role !== 'judge') throw new UserError('Judge sign-in required.')
          const result = handler(payload && typeof payload === 'object' ? payload : {}, session)
          reply({ ok: true, ...(result || {}) })
        } catch (err) {
          if (!(err instanceof UserError)) console.error('[tabulator]', err)
          reply({ ok: false, error: err instanceof UserError ? err.message : 'Server error. Please try again.' })
        }
      })
    }

    // --- sign in / out ---

    on('login', ({ role, judgeId, pin }) => {
      const now = Date.now()
      const fail = loginFailures.get(ip)
      if (fail?.until > now) {
        throw new UserError(`Too many wrong PINs. Try again in ${Math.ceil((fail.until - now) / 1000)} seconds.`)
      }

      const d = store.data
      const entered = String(pin ?? '').trim()
      let session = null
      if (role === 'admin' && entered === d.adminPin) session = { role: 'admin' }
      if (role === 'judge') {
        const judge = d.judges.find((j) => j.id === judgeId)
        if (judge && entered === judge.pin) session = { role: 'judge', judgeId: judge.id }
      }

      if (!session) {
        const count = (fail?.count || 0) + 1
        loginFailures.set(ip, count >= MAX_LOGIN_FAILURES ? { count: 0, until: now + LOGIN_COOLDOWN_MS } : { count, until: 0 })
        throw new UserError('Incorrect PIN.')
      }

      loginFailures.delete(ip)
      const token = randomToken()
      d.sessions[token] = { ...session, createdAt: new Date().toISOString() }
      store.save()
      bind(socket, token, session)
      return { token, session: sessionInfo(session) }
    })

    on('resume', ({ token }) => {
      const session = typeof token === 'string' ? store.data.sessions[token] : null
      if (!session) throw new UserError('Your session has ended. Please sign in again.')
      bind(socket, token, session)
      return { session: sessionInfo(session) }
    })

    on('logout', () => {
      const s = socket.data.session
      if (s) {
        delete store.data.sessions[s.token]
        store.save()
        unbind(socket)
        io.to('admins').emit('state', adminView())
      }
    })

    // --- judge actions ---

    on('submitScore', ({ categoryId, contestantId, criterionScores }, session) => {
      const d = store.data
      const category = d.categories.find((c) => c.id === categoryId)
      if (!category) throw new UserError('That category no longer exists.')
      if (category.locked) throw new UserError('Scoring for this category is locked by the admin.')
      if (!d.contestants.some((c) => c.id === contestantId)) throw new UserError('That contestant no longer exists.')
      if (!criterionScores || typeof criterionScores !== 'object') throw new UserError('No scores were sent.')

      const clean = {}
      for (const crit of category.criteria) {
        const raw = criterionScores[crit.id]
        if (raw === null || raw === undefined || raw === '') {
          throw new UserError(`Please score "${crit.name}" before submitting.`)
        }
        const value = Number(raw)
        if (!Number.isFinite(value) || value < 0 || value > crit.maxScore) {
          throw new UserError(`"${crit.name}" must be between 0 and ${crit.maxScore}.`)
        }
        clean[crit.id] = Math.round(value * 100) / 100
      }

      d.scores[categoryId] ??= {}
      d.scores[categoryId][contestantId] ??= {}
      d.scores[categoryId][contestantId][session.judgeId] = clean
      commit()
    }, 'judge')

    // --- admin actions ---

    on('setActiveCategory', ({ categoryId }) => {
      if (!store.data.categories.some((c) => c.id === categoryId)) throw new UserError('Unknown category.')
      store.data.activeCategory = categoryId
      commit()
    }, 'admin')

    on('toggleLock', ({ categoryId }) => {
      const category = store.data.categories.find((c) => c.id === categoryId)
      if (!category) throw new UserError('Unknown category.')
      category.locked = !category.locked
      commit()
    }, 'admin')

    on('addContestant', ({ name, location }) => {
      const d = store.data
      const number = d.contestants.reduce((max, c) => Math.max(max, Number(c.number) || 0), 0) + 1
      d.contestants.push({
        id: randomId('c'),
        number,
        name: cleanText(name, 'Candidate name'),
        location: cleanText(location, 'Representation / department')
      })
      commit()
    }, 'admin')

    on('removeContestant', ({ contestantId }) => {
      const d = store.data
      if (!d.contestants.some((c) => c.id === contestantId)) throw new UserError('Unknown contestant.')
      d.contestants = d.contestants.filter((c) => c.id !== contestantId)
      for (const byContestant of Object.values(d.scores)) delete byContestant[contestantId]
      commit()
    }, 'admin')

    on('addCategory', ({ name, criteria }) => {
      const list = Array.isArray(criteria) ? criteria.filter((c) => String(c?.name ?? '').trim()) : []
      if (!list.length) throw new UserError('Add at least one criterion.')
      const category = {
        id: randomId('cat'),
        name: cleanText(name, 'Category title'),
        locked: false,
        criteria: list.map((c) => {
          const maxScore = Number(c.maxScore)
          if (!Number.isFinite(maxScore) || maxScore <= 0 || maxScore > 1000) {
            throw new UserError(`Max score for "${String(c.name).trim()}" must be a number above 0.`)
          }
          return { id: randomId('crit'), name: cleanText(c.name, 'Criterion name'), maxScore }
        })
      }
      store.data.categories.push(category)
      commit()
    }, 'admin')

    on('renameJudge', ({ judgeId, name }) => {
      const judge = store.data.judges.find((j) => j.id === judgeId)
      if (!judge) throw new UserError('Unknown judge.')
      judge.name = cleanText(name, 'Judge name', 60)
      commit()
      io.emit('publicInfo', publicInfo())
    }, 'admin')

    on('regenerateJudgePin', ({ judgeId }) => {
      const judge = store.data.judges.find((j) => j.id === judgeId)
      if (!judge) throw new UserError('Unknown judge.')
      judge.pin = store.newJudgePin()
      signOutJudgeEverywhere(judge.id, 'The admin issued you a new PIN. Please sign in again.')
      commit()
      return { pin: judge.pin }
    }, 'admin')

    on('resetAll', () => {
      const d = store.data
      const backupFile = store.backup('before-reset')
      const categories = defaultCategories()
      d.categories = categories
      d.contestants = defaultContestants()
      d.scores = {}
      d.activeCategory = categories[0].id
      commit()
      return { backupFile }
    }, 'admin')

    socket.on('disconnect', () => {
      if (socket.data.session?.role === 'judge') io.to('admins').emit('state', adminView())
    })
  })

  // ----- startup banner (printed after Vite shows its URLs) -----
  const printBanner = () => {
    const line = '  ' + '─'.repeat(52)
    console.log(`\n${line}`)
    console.log('  ICPEP Tabulator server is running')
    console.log(`  Admin PIN:   ${store.data.adminPin}`)
    console.log('  Judge PINs:  Admin dashboard → Judges & Access')
    console.log(`  Data file:   ${store.file}`)
    console.log(`${line}\n`)
  }
  if (httpServer.listening) printBanner()
  else httpServer.once('listening', () => setTimeout(printBanner, 150))

  return io
}
