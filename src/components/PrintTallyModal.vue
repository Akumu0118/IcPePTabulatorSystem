<template>
  <div class="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
    <div class="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full p-6 space-y-6 shadow-2xl">
      <div class="flex justify-between items-center border-b border-slate-800 pb-4">
        <div>
          <h3 class="text-base font-bold text-white">Official Printable Tally Sheet</h3>
          <p class="text-xs text-slate-400">Category: {{ category?.name }}</p>
        </div>
        <div class="flex space-x-2">
          <button @click="triggerPrint" class="px-4 py-2 text-xs font-bold bg-pink-600 hover:bg-pink-500 text-white rounded-lg">
            🖨️ Print Document
          </button>
          <button @click="$emit('close')" class="px-3 py-2 text-xs text-slate-400 hover:text-white">
            Close
          </button>
        </div>
      </div>

      <!-- Printable Document Area -->
      <div id="printable-sheet" class="bg-white text-slate-900 p-8 rounded-lg space-y-6">
        <!-- Document Header -->
        <div class="text-center border-b-2 border-slate-900 pb-4">
          <h1 class="text-xl font-black uppercase tracking-wider text-slate-900">ICPEP TABULATION SYSTEM</h1>
          <h2 class="text-sm font-bold text-slate-700">OFFICIAL SCORE SUMMARY SHEET</h2>
          <p class="text-xs text-slate-500 mt-1">Category: {{ category?.name }}</p>
        </div>

        <!-- Tally Table -->
        <table class="w-full text-xs text-left border-collapse border border-slate-400">
          <thead>
            <tr class="bg-slate-100 text-slate-900 uppercase font-bold">
              <th class="border border-slate-400 p-2 text-center">Rank</th>
              <th class="border border-slate-400 p-2">Candidate Name</th>
              <th class="border border-slate-400 p-2">Department</th>
              <th v-for="j in judges" :key="j.id" class="border border-slate-400 p-2 text-center capitalize">
                {{ j.name }}
              </th>
              <th class="border border-slate-400 p-2 text-center font-black">Final Ave</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, idx) in sortedData" :key="item.id" class="border-b border-slate-300">
              <td class="border border-slate-400 p-2 text-center font-bold">{{ idx + 1 }}</td>
              <td class="border border-slate-400 p-2 font-bold">#{{ item.number }} {{ item.name }}</td>
              <td class="border border-slate-400 p-2 text-slate-600">{{ item.location }}</td>
              <td v-for="j in judges" :key="j.id" class="border border-slate-400 p-2 text-center font-mono">
                {{ item.judgeScores[j.id] !== undefined ? item.judgeScores[j.id].toFixed(1) : '-' }}
              </td>
              <td class="border border-slate-400 p-2 text-center font-mono font-black text-sm">{{ item.finalAverage.toFixed(2) }}</td>
            </tr>
          </tbody>
        </table>

        <!-- Signatures Footer -->
        <div class="pt-12 grid grid-cols-3 gap-8 text-center text-xs">
          <div>
            <div class="border-b border-slate-900 mb-1"></div>
            <p class="font-bold">Tabulator / Admin</p>
          </div>
          <div>
            <div class="border-b border-slate-900 mb-1"></div>
            <p class="font-bold">Head Judge</p>
          </div>
          <div>
            <div class="border-b border-slate-900 mb-1"></div>
            <p class="font-bold">Chairman of Judges</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  category: { type: Object, required: true },
  contestants: { type: Array, required: true },
  scores: { type: Object, required: true },
  judges: { type: Array, required: true }
})

defineEmits(['close'])


const sortedData = computed(() => {
  if (!props.category) return []
  const catScores = props.scores[props.category.id] || {}

  const list = props.contestants.map(c => {
    const contestantScores = catScores[c.id] || {}
    let totalSum = 0
    let count = 0
    const judgeScores = {}

    props.judges.forEach(j => {
      if (contestantScores[j.id]) {
        let sum = 0
        Object.values(contestantScores[j.id]).forEach(v => sum += Number(v) || 0)
        judgeScores[j.id] = sum
        totalSum += sum
        count++
      }
    })

    return {
      ...c,
      judgeScores,
      finalAverage: count > 0 ? totalSum / count : 0
    }
  })

  return list.sort((a, b) => b.finalAverage - a.finalAverage)
})

const triggerPrint = () => {
  window.print()
}
</script>
