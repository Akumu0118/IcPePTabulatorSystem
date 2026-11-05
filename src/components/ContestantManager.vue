<template>
  <div class="bg-slate-900/80 rounded-xl border border-slate-800 p-5 shadow-lg space-y-4">
    <div class="flex items-center justify-between border-b border-slate-800 pb-3">
      <h3 class="text-sm font-bold text-white flex items-center space-x-2">
        <span class="text-pink-400">👤</span>
        <span>Contestants Roster</span>
      </h3>
      <span class="text-xs text-slate-400">{{ contestants.length }} Registered Candidates</span>
    </div>

    <!-- Quick Add Form -->
    <form @submit.prevent="handleAdd" class="grid grid-cols-1 sm:grid-cols-3 gap-2">
      <input 
        v-model="name" 
        placeholder="Candidate Name" 
        required 
        class="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:border-pink-500 focus:outline-none"
      />
      <input 
        v-model="location" 
        placeholder="Representation / Dept" 
        required 
        class="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:border-pink-500 focus:outline-none"
      />
      <button 
        type="submit" 
        class="px-3 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-all"
      >
        + Add Candidate
      </button>
    </form>

    <!-- Roster List -->
    <div class="max-h-60 overflow-y-auto space-y-2 pr-1">
      <div 
        v-for="c in contestants" 
        :key="c.id"
        class="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-colors"
      >
        <div class="flex items-center space-x-3">
          <span class="font-extrabold text-xs text-pink-400 bg-pink-500/10 px-2 py-0.5 rounded border border-pink-500/20">
            #{{ c.number }}
          </span>
          <div>
            <div class="text-xs font-bold text-white">{{ c.name }}</div>
            <div class="text-[10px] text-slate-400">{{ c.location }}</div>
          </div>
        </div>

        <button 
          @click="$emit('remove-contestant', c.id)"
          class="p-1 text-slate-500 hover:text-rose-400 transition-colors"
          title="Remove candidate"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

defineProps({
  contestants: { type: Array, required: true }
})

const emit = defineEmits(['add-contestant', 'remove-contestant'])

const name = ref('')
const location = ref('')

const handleAdd = () => {
  if (name.value.trim() && location.value.trim()) {
    emit('add-contestant', {
      name: name.value.trim(),
      location: location.value.trim()
    })
    name.value = ''
    location.value = ''
  }
}
</script>
