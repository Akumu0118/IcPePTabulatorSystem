<template>
  <div class="max-w-3xl mx-auto space-y-6">
    <!-- Active Judge Banner -->
    <div class="p-4 rounded-xl bg-gradient-to-r from-blue-900/60 to-pink-900/40 border border-blue-500/30 flex justify-between items-center">
      <div>
        <span class="text-[10px] uppercase font-black tracking-wider text-pink-400">Scoring Portal Active</span>
        <h2 class="text-lg font-extrabold text-white capitalize">
          Logged in as {{ judgeId.replace('judge', 'Judge ') }}
        </h2>
      </div>

      <div class="text-right">
        <span class="text-xs text-slate-300 block">Category</span>
        <span class="text-xs font-bold text-pink-300">{{ currentCategoryObj?.name }}</span>
      </div>
    </div>

    <!-- Category Locked Alert -->
    <div v-if="isLocked" class="p-6 rounded-xl bg-amber-500/10 border border-amber-500/30 text-center space-y-2">
      <span class="text-3xl">🔒</span>
      <h3 class="text-sm font-bold text-amber-300">Scoring for this Category is Locked by Admin</h3>
      <p class="text-xs text-amber-200/80">You can view candidate profiles, but score modifications are temporarily disabled.</p>
    </div>

    <template v-else>
      <!-- Candidate Selector Carousel Tabs -->
      <div class="flex items-center space-x-2 overflow-x-auto pb-2">
        <button 
          v-for="c in contestants" 
          :key="c.id"
          @click="selectedContestantId = c.id"
          :class="c.id === selectedContestantId ? 'bg-pink-600 text-white shadow-lg shadow-pink-600/30 ring-2 ring-pink-400' : 'bg-slate-900 text-slate-400 hover:bg-slate-800 border border-slate-800'"
          class="px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center space-x-2 flex-shrink-0"
        >
          <span>#{{ c.number }}</span>
          <span>{{ c.name }}</span>
        </button>
      </div>

      <!-- Active Candidate Scoring Sheet -->
      <div v-if="activeContestant" class="bg-slate-900/80 rounded-2xl border border-slate-800 p-6 shadow-2xl space-y-6">
        <div class="flex justify-between items-start border-b border-slate-800 pb-4">
          <div>
            <span class="text-xs font-bold text-pink-400 bg-pink-500/10 px-2.5 py-1 rounded-full border border-pink-500/20">
              Contestant #{{ activeContestant.number }}
            </span>
            <h3 class="text-xl font-black text-white mt-2">{{ activeContestant.name }}</h3>
            <p class="text-xs text-slate-400">{{ activeContestant.location }}</p>
          </div>

          <div class="text-right bg-slate-950 px-4 py-2 rounded-xl border border-slate-800">
            <span class="text-[10px] uppercase font-semibold text-slate-400 block">Total Candidate Score</span>
            <span class="text-2xl font-mono font-black text-pink-400">{{ totalScoreSum.toFixed(1) }}</span>
          </div>
        </div>

        <!-- Criteria Input Sliders -->
        <div class="space-y-5">
          <div 
            v-for="crit in currentCategoryObj?.criteria || []" 
            :key="crit.id"
            class="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-3"
          >
            <div class="flex justify-between items-center">
              <div>
                <h4 class="text-sm font-bold text-slate-200">{{ crit.name }}</h4>
                <span class="text-[10px] text-slate-400">Max allowed score: {{ crit.maxScore }} pts</span>
              </div>
              <div class="flex items-center space-x-2">
                <input 
                  type="number"
                  v-model.number="currentFormScores[crit.id]"
                  :min="0"
                  :max="crit.maxScore"
                  step="0.5"
                  class="w-16 px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-center font-mono font-extrabold text-pink-400 text-sm focus:border-pink-500 focus:outline-none"
                />
                <span class="text-xs text-slate-500">/ {{ crit.maxScore }}</span>
              </div>
            </div>

            <!-- Touch-Friendly Slider -->
            <input 
              type="range" 
              v-model.number="currentFormScores[crit.id]"
              :min="0"
              :max="crit.maxScore"
              step="0.5"
              class="w-full accent-pink-500 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>

        <!-- Submit Button -->
        <button 
          @click="submitScores"
          class="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 via-pink-600 to-rose-600 hover:from-blue-500 hover:to-rose-500 text-white font-extrabold text-sm rounded-xl transition-all shadow-xl shadow-pink-600/20 active:scale-[0.99] flex items-center justify-center space-x-2"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
          <span>Submit & Transmit Scores to Admin</span>
        </button>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'

const props = defineProps({
  judgeId: { type: String, required: true },
  categories: { type: Array, required: true },
  contestants: { type: Array, required: true },
  scores: { type: Object, required: true },
  activeCategory: { type: String, required: true },
  isLocked: { type: Boolean, required: true }
})

const emit = defineEmits(['submit-score'])

const selectedContestantId = ref(props.contestants[0]?.id || '')
const currentFormScores = reactive({})

const currentCategoryObj = computed(() => {
  return props.categories.find(c => c.id === props.activeCategory) || props.categories[0]
})

const activeContestant = computed(() => {
  return props.contestants.find(c => c.id === selectedContestantId.value) || props.contestants[0]
})

// Load existing scores if available
const loadExistingScores = () => {
  if (!activeContestant.value || !currentCategoryObj.value) return
  const catScores = props.scores[currentCategoryObj.value.id] || {}
  const contestantScores = catScores[activeContestant.value.id] || {}
  const judgeScores = contestantScores[props.judgeId] || {}

  currentCategoryObj.value.criteria.forEach(crit => {
    currentFormScores[crit.id] = judgeScores[crit.id] !== undefined ? judgeScores[crit.id] : crit.maxScore
  })
}

watch([selectedContestantId, () => props.activeCategory, () => props.scores], () => {
  loadExistingScores()
}, { immediate: true })

const totalScoreSum = computed(() => {
  let sum = 0
  if (!currentCategoryObj.value) return 0
  currentCategoryObj.value.criteria.forEach(crit => {
    sum += Number(currentFormScores[crit.id]) || 0
  })
  return sum
})

const submitScores = () => {
  emit('submit-score', {
    categoryId: currentCategoryObj.value.id,
    contestantId: activeContestant.value.id,
    judgeId: props.judgeId,
    criterionScores: { ...currentFormScores }
  })

  // Advance to next contestant automatically
  const idx = props.contestants.findIndex(c => c.id === selectedContestantId.value)
  if (idx !== -1 && idx < props.contestants.length - 1) {
    selectedContestantId.value = props.contestants[idx + 1].id
  }
}
</script>
