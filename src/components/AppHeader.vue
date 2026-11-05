<template>
  <header class="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row items-center justify-between gap-4">
      
      <!-- Logo Frame & System Title -->
      <div class="flex items-center space-x-3.5 w-full md:w-auto">
        <!-- Customizable Logo Frame -->
        <div class="relative group flex-shrink-0">
          <div class="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 via-pink-500 to-rose-400 p-[2px] shadow-lg shadow-pink-500/20">
            <div class="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center overflow-hidden relative">
              <img 
                v-if="logoUrl" 
                :src="logoUrl" 
                alt="ICPEP Logo" 
                class="w-full h-full object-cover"
              />
              <div v-else class="flex flex-col items-center justify-center text-pink-400">
                <span class="text-xs font-black tracking-tighter">ICPEP</span>
              </div>
            </div>
          </div>
          <!-- Hidden File Input to Upload/Replace Logo -->
          <input 
            type="file" 
            accept="image/*" 
            @change="handleLogoUpload" 
            class="absolute inset-0 opacity-0 cursor-pointer text-[0px]"
            title="Click to upload custom logo"
          />
        </div>

        <div>
          <div class="flex items-center space-x-2">
            <h1 class="text-lg font-bold tracking-wide bg-gradient-to-r from-blue-400 via-pink-300 to-pink-500 bg-clip-text text-transparent">
              ICPEP TABULATOR SYSTEM
            </h1>
            <span class="px-2 py-0.5 text-[10px] font-semibold bg-pink-500/10 text-pink-400 border border-pink-500/20 rounded-full">
              v2.0 Vue
            </span>
          </div>
          <p class="text-xs text-slate-400">Official Pageant Scoring & Real-time Tabulation</p>
        </div>
      </div>

      <!-- Category Selector & Role Switcher Controls -->
      <div class="flex flex-wrap items-center justify-end gap-3 w-full md:w-auto">
        <!-- Active Category Switcher -->
        <div class="flex items-center space-x-2 bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-800">
          <span class="text-xs text-slate-400 font-medium">Category:</span>
          <select 
            :value="activeCategory" 
            @change="$emit('update:category', $event.target.value)"
            class="bg-transparent text-xs text-blue-300 font-semibold focus:outline-none cursor-pointer"
          >
            <option 
              v-for="cat in categories" 
              :key="cat.id" 
              :value="cat.id"
              class="bg-slate-900 text-slate-200"
            >
              {{ cat.name }} {{ cat.locked ? '🔒' : '' }}
            </option>
          </select>
        </div>

        <!-- Role / User Portal Switcher -->
        <div class="flex items-center space-x-2 bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-800">
          <span class="text-xs text-slate-400 font-medium">Portal:</span>
          <select 
            :value="currentRole" 
            @change="$emit('update:role', $event.target.value)"
            class="bg-transparent text-xs font-semibold focus:outline-none cursor-pointer"
            :class="currentRole === 'admin' ? 'text-pink-400' : 'text-blue-400'"
          >
            <option value="admin" class="bg-slate-900 text-pink-400">👑 Admin Tabulator</option>
            <option value="judge1" class="bg-slate-900 text-blue-300">Judge 1 Portal</option>
            <option value="judge2" class="bg-slate-900 text-blue-300">Judge 2 Portal</option>
            <option value="judge3" class="bg-slate-900 text-blue-300">Judge 3 Portal</option>
            <option value="judge4" class="bg-slate-900 text-blue-300">Judge 4 Portal</option>
            <option value="judge5" class="bg-slate-900 text-blue-300">Judge 5 Portal</option>
          </select>
        </div>

        <!-- Host Guide Button -->
        <button 
          @click="$emit('open-setup')"
          class="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-all flex items-center space-x-1"
        >
          <span>🌐</span>
          <span>Wi-Fi Setup</span>
        </button>
      </div>

    </div>
  </header>
</template>

<script setup>
import { ref } from 'vue'

defineProps({
  currentRole: { type: String, required: true },
  activeCategory: { type: String, required: true },
  categories: { type: Array, required: true }
})

defineEmits(['update:role', 'update:category', 'open-setup'])

const logoUrl = ref(localStorage.getItem('icpep_logo') || null)

const handleLogoUpload = (e) => {
  const file = e.target.files[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (event) => {
      logoUrl.value = event.target.result
      localStorage.setItem('icpep_logo', event.target.result)
    }
    reader.readAsDataURL(file)
  }
}
</script>
