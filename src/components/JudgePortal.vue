<template>
  <div class="max-w-3xl mx-auto space-y-6">
    <!-- Active Judge Banner -->
    <div class="p-4 rounded-xl bg-gradient-to-r from-blue-900/60 to-pink-900/40 border border-blue-500/30 flex justify-between items-center gap-4">
      <div class="min-w-0">
        <span class="text-[10px] uppercase font-black tracking-wider text-pink-400">Scoring Portal</span>
        <h2 class="text-lg font-extrabold text-white truncate">{{ judgeName }}</h2>
      </div>

      <div class="text-right min-w-0">
        <span class="text-xs text-slate-300 block">Category</span>
        <span class="text-xs font-bold text-pink-300 block truncate">{{ currentCategoryObj?.name || '—' }}</span>
        <span v-if="contestants.length" class="text-[10px] text-slate-400">
          {{ scoredCount }} of {{ contestants.length }} scored
        </span>
      </div>
    </div>

    <!-- Category Locked Alert -->
    <div v-if="isLocked" class="p-6 rounded-xl bg-amber-500/10 border border-amber-500/30 text-center space-y-2">
      <span class="text-3xl">🔒</span>
      <h3 class="text-sm font-bold text-amber-300">Scoring for this Category is Locked by Admin</h3>
      <p class="text-xs text-amber-200/80">Your submitted scores are saved. Wait for the admin to open the next category.</p>
    </div>

    <div v-else-if="!contestants.length" class="p-6 rounded-xl bg-slate-900/80 border border-slate-800 text-center text-xs text-slate-400">
      No contestants yet. The admin will add them shortly.
    </div>

    <template v-else>
      <!-- All done -->
      <div
        v-if="scoredCount === contestants.length"
        class="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-200 text-center"
      >
        ✓ You've scored all {{ contestants.length }} contestants in this category. You can still revise until the admin locks scoring.
      </div>

      <!-- Candidate Selector Tabs -->
      <div class="flex items-center space-x-2 overflow-x-auto pb-2">
        <button
          v-for="c in contestants"
          :key="c.id"
          @click="selectContestant(c.id)"
          :class="c.id === selectedContestantId
            ? 'bg-pink-600 text-white shadow-lg shadow-pink-600/30 ring-2 ring-pink-400'
            : hasSaved(c.id)
              ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-700/50 hover:bg-emerald-900/50'
              : 'bg-slate-900 text-slate-400 hover:bg-slate-800 border border-slate-800'"
          class="px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center space-x-2 flex-shrink-0"
        >
          <span v-if="hasSaved(c.id)" aria-label="scored">✓</span>
          <span>#{{ c.number }}</span>
          <span>{{ c.name }}</span>
        </button>
      </div>

      <!-- Active Candidate Scoring Sheet -->
      <div v-if="activeContestant" class="bg-slate-900/80 rounded-2xl border border-slate-800 p-6 shadow-2xl space-y-6">
        <div class="flex justify-between items-start border-b border-slate-800 pb-4 gap-4">
          <div class="min-w-0">
            <span class="text-xs font-bold text-pink-400 bg-pink-500/10 px-2.5 py-1 rounded-full border border-pink-500/20">
              Contestant #{{ activeContestant.number }}
            </span>
            <h3 class="text-xl font-black text-white mt-2">{{ activeContestant.name }}</h3>
            <p class="text-xs text-slate-400">{{ activeContestant.location }}</p>
          </div>

          <div class="text-right bg-slate-950 px-4 py-2 rounded-xl border border-slate-800 flex-shrink-0">
            <span class="text-[10px] uppercase font-semibold text-slate-400 block">Total</span>
            <span class="text-2xl font-mono font-black" :class="isComplete ? 'text-pink-400' : 'text-slate-500'">
              {{ isComplete ? totalScoreSum.toFixed(1) : '—' }}
            </span>
            <span class="text-[10px] text-slate-500 block">of {{ maxTotal }}</span>
          </div>
        </div>

        <!-- Criteria Inputs -->
        <div class="space-y-5">
          <div
            v-for="crit in criteria"
            :key="crit.id"
            class="p-4 rounded-xl bg-slate-950/60 border space-y-3 transition-colors"
            :class="form[crit.id] === null ? 'border-amber-500/30' : 'border-slate-800/80'"
          >
            <div class="flex justify-between items-center gap-3">
              <div class="min-w-0">
                <h4 class="text-sm font-bold text-slate-200">{{ crit.name }}</h4>
                <span v-if="form[crit.id] === null" class="text-[10px] font-semibold text-amber-400">Not scored yet</span>
                <span v-else class="text-[10px] text-slate-400">0 – {{ crit.maxScore }} pts</span>
              </div>
              <div class="flex items-center space-x-2 flex-shrink-0">
                <input
                  type="number"
                  inputmode="decimal"
                  :value="form[crit.id] ?? ''"
                  @input="setScore(crit, $event.target.value)"
                  min="0"
                  :max="crit.maxScore"
                  step="0.5"
                  placeholder="—"
                  class="w-20 px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-center font-mono font-extrabold text-pink-400 text-base focus:border-pink-500 focus:outline-none"
                />
                <span class="text-xs text-slate-500">/ {{ crit.maxScore }}</span>
              </div>
            </div>

            <!-- Touch-Friendly Slider -->
            <input
              type="range"
              :value="form[crit.id] ?? 0"
              @input="setScore(crit, $event.target.value)"
              min="0"
              :max="crit.maxScore"
              step="0.5"
              :class="form[crit.id] === null ? 'opacity-30' : ''"
              class="w-full accent-pink-500 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>

        <p v-if="message.text" class="text-xs font-semibold text-center" :class="message.ok ? 'text-emerald-400' : 'text-rose-400'">
          {{ message.text }}
        </p>

        <!-- Submit Button -->
        <button
          @click="submitScores"
          :disabled="!canSubmit"
          class="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 via-pink-600 to-rose-600 hover:from-blue-500 hover:to-rose-500 text-white font-extrabold text-sm rounded-xl transition-all shadow-xl shadow-pink-600/20 active:scale-[0.99] flex items-center justify-center space-x-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
        >
          <svg v-if="canSubmit" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
          <span>{{ submitLabel }}</span>
        </button>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, nextTick } from 'vue'

const props = defineProps({
  judgeId: { type: String, required: true },
  judgeName: { type: String, required: true },
  categories: { type: Array, required: true },
  contestants: { type: Array, required: true },
  scores: { type: Object, required: true },
  activeCategory: { type: String, required: true },
  isLocked: { type: Boolean, required: true },
  connected: { type: Boolean, required: true },
  submitScore: { type: Function, required: true }
})

const selectedContestantId = ref('')
const form = reactive({})          // criterionId -> number | null (null = not scored yet)
const saving = ref(false)
const message = reactive({ text: '', ok: true })

const currentCategoryObj = computed(() => props.categories.find(c => c.id === props.activeCategory) || null)
const criteria = computed(() => currentCategoryObj.value?.criteria || [])
const maxTotal = computed(() => criteria.value.reduce((s, c) => s + Number(c.maxScore), 0))

const activeContestant = computed(() => props.contestants.find(c => c.id === selectedContestantId.value) || null)

const savedFor = (contestantId) => props.scores[props.activeCategory]?.[contestantId]?.[props.judgeId] || null
const hasSaved = (contestantId) => !!savedFor(contestantId)
const scoredCount = computed(() => props.contestants.filter(c => hasSaved(c.id)).length)

const firstUnscoredAfter = (index) => {
  const list = props.contestants
  for (let step = 1; step <= list.length; step++) {
    const c = list[(index + step) % list.length]
    if (!hasSaved(c.id)) return c.id
  }
  return null
}

// Keep a valid contestant selected (start with the first one this judge hasn't scored).
watch(
  [() => props.contestants.map(c => c.id).join(), () => props.activeCategory],
  ([, category], [, previousCategory] = []) => {
    const stillThere = props.contestants.some(c => c.id === selectedContestantId.value)
    if (!stillThere || category !== previousCategory) {
      selectedContestantId.value = firstUnscoredAfter(-1) || props.contestants[0]?.id || ''
      message.text = ''
    }
  },
  { immediate: true }
)

// Load the form only when the contestant, category, or criteria change — never
// while a judge is mid-entry because someone else's update arrived.
const loadForm = () => {
  for (const key of Object.keys(form)) delete form[key]
  const saved = activeContestant.value ? savedFor(activeContestant.value.id) : null
  for (const crit of criteria.value) {
    form[crit.id] = saved && saved[crit.id] !== undefined ? saved[crit.id] : null
  }
}
watch(
  [selectedContestantId, () => props.activeCategory, () => criteria.value.map(c => c.id).join()],
  loadForm,
  { immediate: true }
)

const selectContestant = (id) => {
  selectedContestantId.value = id
  message.text = ''
}

const setScore = (crit, raw) => {
  if (raw === '' || raw === null) { form[crit.id] = null; return }
  const value = Number(raw)
  if (!Number.isFinite(value)) { form[crit.id] = null; return }
  const clamped = Math.min(Number(crit.maxScore), Math.max(0, value))
  form[crit.id] = Math.round(clamped * 100) / 100
  message.text = ''
}

const filledCount = computed(() => criteria.value.filter(c => form[c.id] !== null && form[c.id] !== undefined).length)
const isComplete = computed(() => criteria.value.length > 0 && filledCount.value === criteria.value.length)
const totalScoreSum = computed(() => criteria.value.reduce((s, c) => s + (Number(form[c.id]) || 0), 0))

const canSubmit = computed(() => isComplete.value && props.connected && !saving.value && !props.isLocked && !!activeContestant.value)

const submitLabel = computed(() => {
  if (saving.value) return 'Saving…'
  if (!props.connected) return 'Offline — reconnecting…'
  if (!isComplete.value) return `Score every criterion first (${filledCount.value}/${criteria.value.length})`
  return activeContestant.value && hasSaved(activeContestant.value.id) ? 'Update Scores' : 'Submit Scores'
})

const submitScores = async () => {
  if (!canSubmit.value) return
  const contestant = activeContestant.value
  const index = props.contestants.findIndex(c => c.id === contestant.id)

  saving.value = true
  const res = await props.submitScore({
    categoryId: props.activeCategory,
    contestantId: contestant.id,
    criterionScores: { ...form }
  })
  saving.value = false

  if (!res.ok) {
    message.ok = false
    message.text = res.error
    return
  }

  // Move on to the next contestant this judge hasn't scored yet.
  await nextTick() // let the updated scores from the server arrive first
  const next = firstUnscoredAfter(index)
  if (next) selectedContestantId.value = next
  message.ok = true
  message.text = `✓ Saved scores for #${contestant.number} ${contestant.name}.`
}
</script>
