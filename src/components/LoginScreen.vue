<template>
  <div class="flex-1 flex items-center justify-center p-4 sm:p-8">
    <div class="w-full max-w-md bg-slate-900/80 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6">
      <div class="text-center space-y-1">
        <div class="mx-auto w-14 h-14 rounded-xl bg-gradient-to-tr from-blue-600 via-pink-500 to-rose-400 p-[2px] shadow-lg shadow-pink-500/20">
          <div class="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
            <span class="text-xs font-black tracking-tighter text-pink-400">ICPEP</span>
          </div>
        </div>
        <h1 class="pt-2 text-lg font-bold tracking-wide bg-gradient-to-r from-blue-400 via-pink-300 to-pink-500 bg-clip-text text-transparent">
          ICPEP TABULATOR SYSTEM
        </h1>
        <p class="text-xs text-slate-400">Sign in with the PIN the tabulator gave you</p>
      </div>

      <div v-if="conn.notice" class="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200">
        {{ conn.notice }}
      </div>

      <form class="space-y-5" @submit.prevent="submit">
        <div class="space-y-2">
          <label class="block text-xs font-semibold text-slate-400">I am…</label>
          <div class="grid grid-cols-2 gap-2">
            <button
              v-for="opt in options"
              :key="opt.key"
              type="button"
              @click="choose(opt.key)"
              :class="[
                selected === opt.key
                  ? 'bg-pink-600 text-white border-pink-400 shadow-lg shadow-pink-600/30'
                  : 'bg-slate-950/70 text-slate-300 border-slate-800 hover:border-slate-600',
                opt.wide ? 'col-span-2' : ''
              ]"
              class="px-3 py-3 rounded-xl border text-sm font-bold transition-all truncate"
            >
              {{ opt.label }}
            </button>
          </div>
        </div>

        <div class="space-y-2">
          <label for="pin" class="block text-xs font-semibold text-slate-400">PIN</label>
          <input
            id="pin"
            ref="pinInput"
            v-model="pin"
            type="password"
            inputmode="numeric"
            autocomplete="off"
            maxlength="8"
            placeholder="••••"
            class="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-center text-2xl tracking-[0.5em] font-mono text-white focus:border-pink-500 focus:outline-none"
          />
        </div>

        <p v-if="error" class="text-xs font-semibold text-rose-400 text-center">{{ error }}</p>

        <button
          type="submit"
          :disabled="!selected || !pin || busy || !conn.connected"
          class="w-full py-3.5 bg-gradient-to-r from-blue-600 via-pink-600 to-rose-600 text-white font-extrabold text-sm rounded-xl shadow-xl shadow-pink-600/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {{ busy ? 'Signing in…' : !conn.connected ? 'Reconnecting…' : 'Sign In' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import { conn, login } from '../composables/useTabulator.js'

const selected = ref('')
const pin = ref('')
const error = ref('')
const busy = ref(false)
const pinInput = ref(null)

const options = computed(() => {
  const judges = conn.publicJudges.length
    ? conn.publicJudges
    : [1, 2, 3, 4, 5].map(i => ({ id: `judge${i}`, name: `Judge ${i}` }))
  return [
    // an odd last judge spans the row so the grid stays even
    ...judges.map((j, i) => ({ key: j.id, label: j.name, wide: judges.length % 2 === 1 && i === judges.length - 1 })),
    { key: 'admin', label: '👑 Admin / Tabulator', wide: true }
  ]
})

const choose = async (key) => {
  selected.value = key
  error.value = ''
  await nextTick()
  pinInput.value?.focus()
}

const submit = async () => {
  if (!selected.value || !pin.value) return
  busy.value = true
  error.value = ''
  const isAdmin = selected.value === 'admin'
  const res = await login(isAdmin ? 'admin' : 'judge', isAdmin ? undefined : selected.value, pin.value)
  busy.value = false
  if (!res.ok) {
    error.value = res.error
    pin.value = ''
  }
}
</script>
