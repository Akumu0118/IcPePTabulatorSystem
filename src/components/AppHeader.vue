<template>
  <header class="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row items-center justify-between gap-4">

      <!-- Logo Frame & System Title -->
      <div class="flex items-center space-x-3.5 w-full md:w-auto">
        <!-- Customizable Logo Frame (admin can click to upload) -->
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
          <input
            v-if="isAdmin"
            type="file"
            accept="image/*"
            @change="handleLogoUpload"
            class="absolute inset-0 opacity-0 cursor-pointer text-[0px]"
            title="Click to upload custom logo"
          />
        </div>

        <div class="min-w-0">
          <div class="flex items-center space-x-2">
            <h1 class="text-lg font-bold tracking-wide bg-gradient-to-r from-blue-400 via-pink-300 to-pink-500 bg-clip-text text-transparent">
              ICPEP TABULATOR SYSTEM
            </h1>
            <span
              class="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-full border"
              :class="connected
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/30'"
            >
              <span class="w-1.5 h-1.5 rounded-full" :class="connected ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'"></span>
              {{ connected ? 'Live' : 'Reconnecting' }}
            </span>
          </div>
          <p class="text-xs text-slate-400">Official Pageant Scoring & Real-time Tabulation</p>
        </div>
      </div>

      <!-- Category & Session Controls -->
      <div class="flex flex-wrap items-center justify-end gap-3 w-full md:w-auto">
        <!-- Active Category: admin chooses, judges follow -->
        <div class="flex items-center space-x-2 bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-800 max-w-full">
          <span class="text-xs text-slate-400 font-medium">Category:</span>
          <select
            v-if="isAdmin"
            :value="activeCategory"
            @change="$emit('update:category', $event.target.value)"
            class="bg-transparent text-xs text-blue-300 font-semibold focus:outline-none cursor-pointer max-w-[14rem] truncate"
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
          <span v-else class="text-xs text-blue-300 font-semibold truncate">{{ activeCategoryName }}</span>
        </div>

        <!-- Signed-in user -->
        <div class="flex items-center space-x-2 bg-slate-950/80 pl-3 pr-1 py-1 rounded-lg border border-slate-800">
          <span class="text-xs font-semibold truncate max-w-[10rem]" :class="isAdmin ? 'text-pink-400' : 'text-blue-300'">
            {{ isAdmin ? '👑 Admin' : session.name }}
          </span>
          <button
            @click="confirmLogout"
            class="px-2 py-1 text-[11px] font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md transition-all"
          >
            Sign out
          </button>
        </div>

        <!-- Host Guide Button -->
        <button
          v-if="isAdmin"
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
import { ref, computed } from 'vue'

const props = defineProps({
  session: { type: Object, required: true },
  connected: { type: Boolean, required: true },
  activeCategory: { type: String, required: true },
  categories: { type: Array, required: true }
})

const emit = defineEmits(['update:category', 'open-setup', 'logout'])

const isAdmin = computed(() => props.session.role === 'admin')
const activeCategoryName = computed(() =>
  props.categories.find(c => c.id === props.activeCategory)?.name || '—'
)

const confirmLogout = () => {
  if (confirm('Sign out of this device?')) emit('logout')
}

let storedLogo = null
try { storedLogo = localStorage.getItem('icpep_logo') } catch { /* ignore */ }
const logoUrl = ref(storedLogo)

const handleLogoUpload = (e) => {
  const file = e.target.files[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (event) => {
      logoUrl.value = event.target.result
      try {
        localStorage.setItem('icpep_logo', event.target.result)
      } catch {
        alert('That image is too large to remember on this device. It will show until you refresh — try a smaller image.')
      }
    }
    reader.readAsDataURL(file)
  }
}
</script>
