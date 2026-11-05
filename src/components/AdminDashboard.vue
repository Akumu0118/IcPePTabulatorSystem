<template>
  <div class="space-y-6">
    <!-- Action / Status Toolbar -->
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
      <div class="flex items-center space-x-3">
        <div class="p-2.5 rounded-lg bg-pink-500/10 text-pink-400 border border-pink-500/20">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
        </div>
        <div>
          <h2 class="text-base font-bold text-white">Tabulation & Leaderboard Overview</h2>
          <p class="text-xs text-slate-400">Real-time calculations across all connected judge devices</p>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-2 w-full sm:w-auto">
        <button 
          @click="$emit('toggle-lock', activeCategory)"
          :class="isLocked ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'"
          class="px-3.5 py-1.5 text-xs font-semibold rounded-lg border transition-all flex items-center space-x-1.5"
        >
          <span>{{ isLocked ? '🔒 Score Submission Locked' : '🔓 Scoring Active' }}</span>
        </button>

        <button 
          @click="showPrintModal = true"
          class="px-3.5 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-all shadow-md shadow-blue-600/20 flex items-center space-x-1.5"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H7a2 2 0 00-2 2v4h10z"/></svg>
          <span>Print Tally Sheet</span>
        </button>

        <button 
          @click="$emit('reset-all')"
          class="px-3.5 py-1.5 text-xs font-semibold bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 rounded-lg transition-all"
        >
          Reset All
        </button>
      </div>
    </div>

    <!-- Live Leaderboard Table Component -->
    <LeaderboardTable
      :active-category-obj="currentCategoryObj"
      :contestants="contestants"
      :scores="scores"
      :judges="['judge1', 'judge2', 'judge3', 'judge4', 'judge5']"
    />

    <!-- Admin Management Panels (Grid) -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Criteria & Categories Management -->
      <CriteriaManager
        :categories="categories"
        :active-category="activeCategory"
        @add-category="$emit('add-category', $event)"
      />

      <!-- Contestants Management -->
      <ContestantManager
        :contestants="contestants"
        @add-contestant="$emit('add-contestant', $event)"
        @remove-contestant="$emit('remove-contestant', $event)"
      />
    </div>

    <!-- Printable Modal Component -->
    <PrintTallyModal
      v-if="showPrintModal"
      :category="currentCategoryObj"
      :contestants="contestants"
      :scores="scores"
      @close="showPrintModal = false"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import LeaderboardTable from './LeaderboardTable.vue'
import CriteriaManager from './CriteriaManager.vue'
import ContestantManager from './ContestantManager.vue'
import PrintTallyModal from './PrintTallyModal.vue'

const props = defineProps({
  categories: { type: Array, required: true },
  contestants: { type: Array, required: true },
  scores: { type: Object, required: true },
  activeCategory: { type: String, required: true },
  isLocked: { type: Boolean, required: true }
})

defineEmits(['add-contestant', 'remove-contestant', 'add-category', 'toggle-lock', 'reset-all'])

const showPrintModal = ref(false)

const currentCategoryObj = computed(() => {
  return props.categories.find(c => c.id === props.activeCategory) || props.categories[0]
})
</script>
