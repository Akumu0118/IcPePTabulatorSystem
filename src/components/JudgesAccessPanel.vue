<template>
  <div class="bg-slate-900/80 rounded-xl border border-slate-800 p-5 shadow-lg space-y-4">
    <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
      <div>
        <h3 class="text-sm font-bold text-white flex items-center space-x-2">
          <span class="text-blue-400">🔑</span>
          <span>Judges & Access</span>
        </h3>
        <p class="text-[11px] text-slate-400 mt-0.5">
          Give each judge their PIN. They sign in on their phone at
          <span class="font-mono text-emerald-400">{{ primaryUrl || 'the Network address shown in the terminal' }}</span>
        </p>
      </div>
      <button
        @click="showPins = !showPins"
        class="px-2.5 py-1 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition-all"
      >
        {{ showPins ? 'Hide PINs' : 'Show PINs' }}
      </button>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
      <div
        v-for="j in judges"
        :key="j.id"
        class="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 space-y-2.5"
      >
        <div class="flex items-center justify-between">
          <span class="flex items-center gap-1.5 text-[10px] font-semibold" :class="j.online ? 'text-emerald-400' : 'text-slate-500'">
            <span class="w-2 h-2 rounded-full" :class="j.online ? 'bg-emerald-400' : 'bg-slate-600'"></span>
            {{ j.online ? (j.online > 1 ? `Online · ${j.online} devices` : 'Online') : 'Not signed in' }}
          </span>
          <span class="text-[10px] font-mono text-slate-600">{{ j.id }}</span>
        </div>

        <input
          :value="j.name"
          @keydown.enter="$event.target.blur()"
          @blur="rename(j, $event.target)"
          maxlength="60"
          class="w-full px-2 py-1 bg-slate-900 border border-slate-800 rounded text-xs font-bold text-white focus:border-pink-500 focus:outline-none"
          title="Click to rename"
        />

        <div class="flex items-center justify-between gap-2">
          <span class="font-mono text-base font-black tracking-widest" :class="showPins ? 'text-pink-400' : 'text-slate-600'">
            {{ showPins ? j.pin : '••••' }}
          </span>
          <button
            @click="$emit('regenerate-pin', j.id)"
            class="px-2 py-0.5 text-[10px] font-semibold text-slate-400 hover:text-rose-300 bg-slate-800 hover:bg-rose-500/10 border border-slate-700 rounded transition-all"
          >
            New PIN
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  judges: { type: Array, required: true },
  serverAddresses: { type: Array, default: () => [] }
})

const emit = defineEmits(['rename-judge', 'regenerate-pin'])

// PINs are hidden by default in case the admin screen is projected.
const showPins = ref(false)

// Prefer a Wi-Fi/Ethernet adapter over virtual ones (WSL, VirtualBox, VMware…)
const primaryUrl = computed(() => {
  const virtual = /vethernet|virtualbox|vmware|wsl|docker|hyper-v|loopback|vbox|tailscale|zerotier/i
  const real = props.serverAddresses.filter(a => !virtual.test(a.name))
  return (real[0] || props.serverAddresses[0])?.url || ''
})

const rename = (judge, input) => {
  const name = input.value.trim()
  if (!name) { input.value = judge.name; return }
  if (name !== judge.name) emit('rename-judge', judge.id, name)
}
</script>
