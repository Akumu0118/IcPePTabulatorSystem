<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-slate-100 flex flex-col">
    <!-- Lost connection banner -->
    <div
      v-if="conn.ready && conn.session && !conn.connected"
      class="sticky top-0 z-[60] bg-amber-500 text-slate-950 text-xs font-bold text-center px-4 py-2"
    >
      Connection to the tabulator lost — reconnecting… Scores can't be submitted until it's back.
    </div>

    <!-- Waiting for the server -->
    <div v-if="!conn.ready" class="flex-1 flex items-center justify-center p-6">
      <div class="text-center space-y-3 max-w-sm">
        <div class="mx-auto w-10 h-10 rounded-full border-4 border-pink-500/30 border-t-pink-500 animate-spin"></div>
        <p class="text-sm font-semibold text-slate-200">Connecting to the tabulator…</p>
        <p v-if="slowConnect" class="text-xs text-slate-400">
          Taking a while. Make sure the tabulator laptop is running <code class="text-blue-300">npm run dev</code>
          and that this device is on the same Wi-Fi.
        </p>
      </div>
    </div>

    <!-- Sign in -->
    <LoginScreen v-else-if="!conn.session" />

    <!-- Signed in -->
    <template v-else>
      <AppHeader
        :session="conn.session"
        :connected="conn.connected"
        :active-category="state.activeCategory"
        :categories="state.categories"
        @update:category="setCategory"
        @open-setup="showSetupModal = true"
        @logout="logout"
      />

      <main class="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <AdminDashboard
          v-if="isAdmin"
          :categories="state.categories"
          :contestants="state.contestants"
          :judges="state.judges"
          :scores="state.scores"
          :active-category="state.activeCategory"
          :is-locked="isCategoryLocked"
          :server-addresses="state.serverAddresses"
          @add-contestant="(c) => run(api.addContestant(c))"
          @remove-contestant="removeContestant"
          @add-category="(c) => run(api.addCategory(c), 'Category added.')"
          @toggle-lock="(id) => run(api.toggleLock(id))"
          @rename-judge="(id, name) => run(api.renameJudge(id, name), 'Judge name saved.')"
          @regenerate-pin="regeneratePin"
          @reset-all="resetSystemData"
        />

        <JudgePortal
          v-else
          :judge-id="conn.session.judgeId"
          :judge-name="conn.session.name"
          :categories="state.categories"
          :contestants="state.contestants"
          :scores="state.scores"
          :active-category="state.activeCategory"
          :is-locked="isCategoryLocked"
          :connected="conn.connected"
          :submit-score="api.submitScore"
        />
      </main>
    </template>

    <AppFooter />

    <SetupModal
      v-if="showSetupModal"
      :addresses="state.serverAddresses"
      @close="showSetupModal = false"
    />

    <!-- Toast -->
    <transition name="fade">
      <div
        v-if="toast.text"
        class="fixed bottom-4 left-1/2 -translate-x-1/2 z-[70] max-w-[calc(100%-2rem)] px-4 py-2.5 rounded-xl text-xs font-semibold shadow-2xl border"
        :class="toast.type === 'error'
          ? 'bg-rose-950 text-rose-200 border-rose-500/40'
          : 'bg-emerald-950 text-emerald-200 border-emerald-500/40'"
      >
        {{ toast.text }}
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import AppHeader from './components/AppHeader.vue'
import AppFooter from './components/AppFooter.vue'
import AdminDashboard from './components/AdminDashboard.vue'
import JudgePortal from './components/JudgePortal.vue'
import SetupModal from './components/SetupModal.vue'
import LoginScreen from './components/LoginScreen.vue'
import { conn, state, api, logout, toast, showToast } from './composables/useTabulator.js'

const showSetupModal = ref(false)
const slowConnect = ref(false)

onMounted(() => {
  setTimeout(() => { slowConnect.value = true }, 4000)
})

const isAdmin = computed(() => conn.session?.role === 'admin')

const isCategoryLocked = computed(() => {
  const cat = state.categories.find(c => c.id === state.activeCategory)
  return cat ? cat.locked : false
})

// Run a server action and report failures to the user.
const run = async (promise, successMessage) => {
  const res = await promise
  if (!res.ok) showToast(res.error, 'error')
  else if (successMessage) showToast(successMessage)
  return res
}

const setCategory = (catId) => run(api.setActiveCategory(catId))

const removeContestant = (id) => {
  const c = state.contestants.find(x => x.id === id)
  if (confirm(`Remove ${c ? `#${c.number} ${c.name}` : 'this contestant'}? Their scores will be deleted too.`)) {
    run(api.removeContestant(id))
  }
}

const regeneratePin = async (judgeId) => {
  const judge = state.judges.find(j => j.id === judgeId)
  if (!confirm(`Give ${judge?.name || judgeId} a new PIN? They will be signed out on every device and must sign in with the new PIN.`)) return
  const res = await run(api.regenerateJudgePin(judgeId))
  if (res.ok) showToast(`New PIN for ${judge?.name || judgeId}: ${res.pin}`)
}

const resetSystemData = async () => {
  if (!confirm('Reset all contestants, categories, and scores back to the defaults? Judges and PINs are kept. A backup file is saved first.')) return
  const res = await run(api.resetAll())
  if (res.ok) showToast('Data reset. A backup was saved in the data folder.')
}
</script>

<style>
.fade-enter-active, .fade-leave-active { transition: opacity .2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
