// Connection to the tabulator server (server/tabulator.js).
// Every device — admin laptop and judges' phones — talks to the same server,
// so scores entered anywhere show up on the admin's leaderboard immediately.

import { io } from 'socket.io-client'
import { reactive } from 'vue'

const TOKEN_KEY = 'icpep_session_token'

const readToken = () => { try { return localStorage.getItem(TOKEN_KEY) } catch { return null } }
const writeToken = (t) => {
  try { t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY) } catch { /* private mode */ }
}

const emptyState = () => ({
  categories: [],
  contestants: [],
  judges: [],
  scores: {},
  activeCategory: '',
  serverAddresses: []
})

export const conn = reactive({
  connected: false,
  ready: false,          // first connection made and saved session checked
  session: null,         // { role: 'admin' } | { role: 'judge', judgeId, name }
  publicJudges: [],      // judge names for the sign-in screen
  notice: ''             // why the user was signed out, if they were
})

export const state = reactive(emptyState())

export const toast = reactive({ text: '', type: 'info', id: 0 })
export function showToast(text, type = 'info') {
  const id = ++toast.id
  Object.assign(toast, { text, type })
  setTimeout(() => { if (toast.id === id) toast.text = '' }, type === 'error' ? 6000 : 3000)
}

const socket = io({ reconnectionDelayMax: 3000 })

export async function call(event, payload = {}) {
  if (!socket.connected) {
    return { ok: false, transient: true, error: 'Not connected to the tabulator server. Reconnecting…' }
  }
  try {
    return await socket.timeout(8000).emitWithAck(event, payload)
  } catch {
    return { ok: false, transient: true, error: 'The server did not respond. Check the Wi-Fi and try again.' }
  }
}

function clearSession(notice = '') {
  writeToken(null)
  conn.session = null
  conn.notice = notice
  Object.assign(state, emptyState())
}

async function resume() {
  const token = readToken()
  if (!token) { conn.session = null; return }
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await call('resume', { token })
    if (res.ok) { conn.session = res.session; return }
    if (!res.transient) { clearSession(res.error); return }
    await new Promise((r) => setTimeout(r, 1000))
  }
}

socket.on('connect', async () => {
  conn.connected = true
  await resume()
  conn.ready = true
})
socket.on('disconnect', () => { conn.connected = false })
socket.on('publicInfo', (info) => { conn.publicJudges = info.judges || [] })
socket.on('state', (s) => { Object.assign(state, s) })
socket.on('signedOut', ({ reason }) => clearSession(reason))

export async function login(role, judgeId, pin) {
  const res = await call('login', { role, judgeId, pin })
  if (res.ok) {
    writeToken(res.token)
    conn.session = res.session
    conn.notice = ''
  }
  return res
}

export async function logout() {
  await call('logout')
  clearSession()
}

export const api = {
  submitScore: (payload) => call('submitScore', payload),
  setActiveCategory: (categoryId) => call('setActiveCategory', { categoryId }),
  toggleLock: (categoryId) => call('toggleLock', { categoryId }),
  addContestant: (c) => call('addContestant', c),
  removeContestant: (contestantId) => call('removeContestant', { contestantId }),
  addCategory: (c) => call('addCategory', c),
  renameJudge: (judgeId, name) => call('renameJudge', { judgeId, name }),
  regenerateJudgePin: (judgeId) => call('regenerateJudgePin', { judgeId }),
  resetAll: () => call('resetAll')
}
