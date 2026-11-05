<template>
  <div class="bg-slate-900/80 rounded-xl border border-slate-800 p-5 shadow-lg space-y-4">
    <div class="flex items-center justify-between border-b border-slate-800 pb-3">
      <h3 class="text-sm font-bold text-white flex items-center space-x-2">
        <span class="text-blue-400">⚙️</span>
        <span>Round & Criteria Manager</span>
      </h3>
      <button 
        @click="showAddModal = true"
        class="px-2.5 py-1 text-xs font-semibold bg-pink-600 hover:bg-pink-500 text-white rounded-lg transition-all"
      >
        + New Category
      </button>
    </div>

    <div class="space-y-3">
      <div 
        v-for="cat in categories" 
        :key="cat.id" 
        class="p-3.5 rounded-lg border transition-all"
        :class="cat.id === activeCategory ? 'bg-blue-950/40 border-blue-500/40' : 'bg-slate-950/60 border-slate-800/80'"
      >
        <div class="flex justify-between items-center mb-2">
          <span class="text-xs font-bold text-slate-200">{{ cat.name }}</span>
          <span class="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-400">
            {{ cat.criteria.length }} Criteria
          </span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div 
            v-for="crit in cat.criteria" 
            :key="crit.id"
            class="flex items-center justify-between text-xs px-2.5 py-1.5 rounded bg-slate-900 border border-slate-800/60"
          >
            <span class="text-slate-300 truncate">{{ crit.name }}</span>
            <span class="font-mono text-pink-400 font-bold ml-2">{{ crit.maxScore }} pts</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Inline Add Modal -->
    <div v-if="showAddModal" class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div class="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full space-y-4 shadow-2xl">
        <h4 class="text-base font-bold text-white">Add New Contest Category</h4>
        <div>
          <label class="block text-xs font-semibold text-slate-400 mb-1">Category Title</label>
          <input 
            v-model="newCatName" 
            placeholder="e.g., Swimwear Competition"
            class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:border-pink-500 focus:outline-none"
          />
        </div>

        <div class="space-y-2">
          <div class="flex justify-between items-center">
            <label class="text-xs font-semibold text-slate-400">Criteria Items</label>
            <button @click="addCriterionInput" class="text-xs text-pink-400 hover:text-pink-300">+ Add Item</button>
          </div>

          <div v-for="(item, idx) in newCriteria" :key="idx" class="flex items-center space-x-2">
            <input 
              v-model="item.name" 
              placeholder="Criterion name"
              class="flex-1 px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded text-xs text-white"
            />
            <input 
              v-model.number="item.maxScore" 
              type="number" 
              placeholder="Max"
              class="w-20 px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded text-xs text-white font-mono"
            />
          </div>
        </div>

        <div class="flex justify-end space-x-2 pt-2">
          <button @click="showAddModal = false" class="px-3 py-1.5 text-xs text-slate-400 hover:text-white">Cancel</button>

          <button @click="saveNewCategory" class="px-4 py-1.5 text-xs font-semibold bg-pink-600 text-white rounded-lg hover:bg-pink-500">
            Create Category
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

defineProps({
  categories: { type: Array, required: true },
  activeCategory: { type: String, required: true }
})

const emit = defineEmits(['add-category'])

const showAddModal = ref(false)
const newCatName = ref('')
const newCriteria = ref([
  { name: 'Performance', maxScore: 50 },
  { name: 'Overall Impression', maxScore: 50 }
])

const addCriterionInput = () => {
  newCriteria.value.push({ name: '', maxScore: 50 })
}

const saveNewCategory = () => {
  if (!newCatName.value.trim()) return
  emit('add-category', {
    name: newCatName.value.trim(),
    criteria: newCriteria.value.filter(c => c.name.trim() !== '')
  })
  newCatName.value = ''
  showAddModal.value = false
}
</script>
