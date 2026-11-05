<template>
  <div class="min-h-screen min-h-[100dvh] bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-slate-100 flex flex-col overflow-x-hidden antialiased">
    <!-- Header Component -->
    <AppHeader 
      :current-role="currentRole"
      :active-category="activeCategory"
      :categories="categories"
      @update:role="setRole"
      @update:category="setCategory"
      @open-setup="showSetupModal = true"
    />

    <!-- Main Views Container -->
    <main class="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 transition-all duration-300">
      <Transition name="fade-slide" mode="out-in">
        <!-- Admin Tabulator View -->
        <AdminDashboard
          v-if="currentRole === 'admin'"
          :key="'admin-' + activeCategory"
          :categories="categories"
          :contestants="contestants"
          :scores="scores"
          :active-category="activeCategory"
          :is-locked="isCategoryLocked"
          @add-contestant="addContestant"
          @remove-contestant="removeContestant"
          @add-category="addCategory"
          @toggle-lock="toggleCategoryLock"
          @reset-all="resetSystemData"
        />

        <!-- Judge Scoring View -->
        <JudgePortal
          v-else
          :key="currentRole + '-' + activeCategory"
          :judge-id="currentRole"
          :categories="categories"
          :contestants="contestants"
          :scores="scores"
          :active-category="activeCategory"
          :is-locked="isCategoryLocked"
          @submit-score="handleScoreSubmit"
        />
      </Transition>
    </main>

    <!-- Footer Component -->
    <AppFooter />

    <!-- Setup / Local Hosting Guide Modal -->
    <SetupModal 
      v-if="showSetupModal" 
      @close="showSetupModal = false" 
    />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import AppHeader from './components/AppHeader.vue'
import AppFooter from './components/AppFooter.vue'
import AdminDashboard from './components/AdminDashboard.vue'
import JudgePortal from './components/JudgePortal.vue'
import SetupModal from './components/SetupModal.vue'

// Local State
const currentRole = ref('admin') // 'admin', 'judge1', 'judge2', 'judge3', 'judge4', 'judge5'
const activeCategory = ref('cat_1')
const showSetupModal = ref(false)

const categories = ref([
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
])

const contestants = ref([
  { id: 'c1', number: 1, name: 'Candidate 01', location: 'College of Engineering' },
  { id: 'c2', number: 2, name: 'Candidate 02', location: 'College of Architecture' },
  { id: 'c3', number: 3, name: 'Candidate 03', location: 'College of Computer Studies' },
  { id: 'c4', number: 4, name: 'Candidate 04', location: 'College of Arts & Sciences' },
  { id: 'c5', number: 5, name: 'Candidate 05', location: 'College of Business' },
])

// Scores structure: { categoryId: { contestantId: { judgeId: { criterionId: value } } } }
const scores = reactive({})

// Broadcast Channel for live multi-tab & local network sync
let syncChannel = null

const isCategoryLocked = computed(() => {
  const cat = categories.value.find(c => c.id === activeCategory.value)
  return cat ? cat.locked : false
})

// Persistence & Synchronization logic
const saveState = () => {
  const state = {
    categories: categories.value,
    contestants: contestants.value,
    scores: scores,
    activeCategory: activeCategory.value
  }
  localStorage.setItem('icpep_tabulator_state', JSON.stringify(state))
  if (syncChannel) {
    syncChannel.postMessage({ type: 'STATE_UPDATE', payload: state })
  }
}

const loadState = () => {
  const saved = localStorage.getItem('icpep_tabulator_state')
  if (saved) {
    try {
      const parsed = JSON.parse(saved)
      if (parsed.categories) categories.value = parsed.categories
      if (parsed.contestants) contestants.value = parsed.contestants
      if (parsed.scores) Object.assign(scores, parsed.scores)
      if (parsed.activeCategory) activeCategory.value = parsed.activeCategory
    } catch (e) {
      console.error('Failed to parse local storage state:', e)
    }
  }
}

// Handlers
const setRole = (role) => {
  currentRole.value = role
}

const setCategory = (catId) => {
  activeCategory.value = catId
  saveState()
}

const handleScoreSubmit = ({ categoryId, contestantId, judgeId, criterionScores }) => {
  if (!scores[categoryId]) scores[categoryId] = {}
  if (!scores[categoryId][contestantId]) scores[categoryId][contestantId] = {}
  
  scores[categoryId][contestantId][judgeId] = { ...criterionScores }
  saveState()
}

const addContestant = (contestant) => {
  contestants.value.push({
    id: 'c_' + Date.now(),
    number: contestants.value.length + 1,
    ...contestant
  })
  saveState()
}

const removeContestant = (id) => {
  contestants.value = contestants.value.filter(c => c.id !== id)
  saveState()
}

const addCategory = (categoryData) => {
  categories.value.push({
    id: 'cat_' + Date.now(),
    locked: false,
    ...categoryData
  })
  saveState()
}

const toggleCategoryLock = (catId) => {
  const cat = categories.value.find(c => c.id === catId)
  if (cat) {
    cat.locked = !cat.locked
    saveState()
  }
}

const resetSystemData = () => {
  if (confirm('Are you sure you want to reset all contestants, criteria, and scores? This cannot be undone.')) {
    localStorage.removeItem('icpep_tabulator_state')
    window.location.reload()
  }
}

// Lifecycle Hooks
onMounted(() => {
  loadState()

  // Setup BroadcastChannel
  if ('BroadcastChannel' in window) {
    syncChannel = new BroadcastChannel('icpep_tabulator_channel')
    syncChannel.onmessage = (event) => {
      if (event.data && event.data.type === 'STATE_UPDATE') {
        const payload = event.data.payload
        if (payload.categories) categories.value = payload.categories
        if (payload.contestants) contestants.value = payload.contestants
        if (payload.scores) Object.assign(scores, payload.scores)
        if (payload.activeCategory) activeCategory.value = payload.activeCategory
      }
    }
  }

  // Fallback to storage event for cross-window sync
  window.addEventListener('storage', (e) => {
    if (e.key === 'icpep_tabulator_state') {
      loadState()
    }
  })
})

onUnmounted(() => {
  if (syncChannel) syncChannel.close()
})
</script>

<style scoped>
/* Smooth view switching transitions */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(6px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>