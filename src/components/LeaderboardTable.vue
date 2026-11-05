<template>
  <div class="bg-slate-900/80 rounded-xl border border-slate-800 overflow-hidden shadow-xl">
    <div class="p-4 bg-slate-900/90 border-b border-slate-800 flex justify-between items-center">
      <h3 class="text-sm font-bold text-white flex items-center space-x-2">
        <span class="text-pink-400">🏆</span>
        <span>Live Tabulated Rankings: {{ activeCategoryObj?.name }}</span>
      </h3>
      <span class="text-xs text-slate-400 font-mono">Auto-Calculating Scores</span>
    </div>

    <div class="overflow-x-auto">
      <table class="w-full text-left text-sm">
        <thead class="bg-slate-950 text-slate-400 text-xs uppercase font-semibold border-b border-slate-800">
          <tr>
            <th class="py-3 px-4 text-center w-16">Rank</th>
            <th class="py-3 px-4">Candidate</th>
            <th class="py-3 px-4">Department / Representation</th>
            <th v-for="j in judges" :key="j" class="py-3 px-3 text-center capitalize text-slate-300">
              {{ j.replace('judge', 'Judge ') }}
            </th>
            <th class="py-3 px-4 text-center font-bold text-pink-400 bg-pink-500/5">Total Score</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-800/60 font-medium">
          <tr 
            v-for="(item, index) in rankedContestants" 
            :key="item.id"
            :class="index === 0 ? 'bg-amber-500/5 hover:bg-amber-500/10' : 'hover:bg-slate-800/40'"
            class="transition-colors"
          >
            <!-- Rank Badge -->
            <td class="py-3 px-4 text-center">
              <span 
                :class="{
                  'bg-amber-400 text-slate-950 font-black shadow-md shadow-amber-400/20': index === 0,
                  'bg-slate-300 text-slate-950 font-extrabold': index === 1,
                  'bg-amber-700/80 text-amber-100 font-bold': index === 2,
                  'bg-slate-800 text-slate-400': index > 2
                }"
                class="inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs"
              >
                {{ index + 1 }}
              </span>
            </td>

            <!-- Candidate Info -->
            <td class="py-3 px-4">
              <div class="flex items-center space-x-3">
                <span class="font-extrabold text-pink-400 bg-pink-500/10 px-2 py-0.5 rounded border border-pink-500/20">
                  #{{ item.number }}
                </span>
                <span class="text-white font-bold">{{ item.name }}</span>
              </div>
            </td>

            <td class="py-3 px-4 text-slate-400 text-xs">{{ item.location }}</td>

            <!-- Individual Judge Scores -->
            <td v-for="j in judges" :key="j" class="py-3 px-3 text-center text-xs font-mono">
              <span v-if="item.judgeScores[j] !== undefined" class="text-blue-300 font-semibold">
                {{ item.judgeScores[j].toFixed(1) }}
              </span>
              <span v-else class="text-slate-600">-</span>
            </td>

            <!-- Final Average / Total Score -->
            <td class="py-3 px-4 text-center font-mono font-black text-base text-pink-400 bg-pink-500/5">
              {{ item.finalAverage.toFixed(2) }}
            </td>
          </tr>

          <tr v-if="rankedContestants.length === 0">
            <td :colspan="4 + judges.length" class="py-8 text-center text-slate-500 text-xs">
              No contestants added yet. Add contestants in the management panel below.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  activeCategoryObj: { type: Object, required: true },
  contestants: { type: Array, required: true },
  scores: { type: Object, required: true },
  judges: { type: Array, required: true }
})

const rankedContestants = computed(() => {
  if (!props.activeCategoryObj) return []

  const catId = props.activeCategoryObj.id
  const categoryScores = props.scores[catId] || {}

  const computedList = props.contestants.map(c => {
    const contestantScores = categoryScores[c.id] || {}
    let totalSum = 0
    let judgesCount = 0
    const judgeScores = {}

    props.judges.forEach(j => {
      const judgeObj = contestantScores[j]
      if (judgeObj) {
        // Sum score for all criteria
        let sumCriteria = 0
        Object.values(judgeObj).forEach(val => {
          sumCriteria += Number(val) || 0
        })
        judgeScores[j] = sumCriteria
        totalSum += sumCriteria
        judgesCount++
      }
    })

    const finalAverage = judgesCount > 0 ? (totalSum / judgesCount) : 0

    return {
      ...c,
      judgeScores,
      finalAverage
    }
  })

  // Sort by highest final average
  return computedList.sort((a, b) => b.finalAverage - a.finalAverage)
})
</script>
