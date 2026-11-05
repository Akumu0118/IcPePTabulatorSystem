<template>
  <div class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
    <div class="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
      <div class="flex justify-between items-center border-b border-slate-800 pb-3">
        <h3 class="text-base font-bold text-white flex items-center space-x-2">
          <span>🌐</span>
          <span>Connecting Judges' Devices</span>
        </h3>
        <button @click="$emit('close')" class="text-slate-400 hover:text-white text-xs">✕</button>
      </div>

      <div class="space-y-4 text-xs text-slate-300">
        <div class="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
          <h4 class="font-bold text-pink-400">Step 1: Keep this laptop running the tabulator</h4>
          <p class="text-slate-400">Leave the terminal with <code class="text-blue-300">npm run dev</code> (or <code class="text-blue-300">npm start</code>) open for the whole event. Closing it stops scoring.</p>
        </div>

        <div class="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
          <h4 class="font-bold text-pink-400">Step 2: Put every device on the same Wi-Fi</h4>
          <p class="text-slate-400">Judges' phones open one of these addresses in their browser. Use the one for this laptop's Wi-Fi adapter — skip ones named vEthernet, WSL, or VirtualBox.</p>
          <ul v-if="addresses.length" class="space-y-1.5">
            <li
              v-for="a in addresses"
              :key="a.url"
              class="flex items-center justify-between gap-3 bg-slate-900 px-3 py-2 rounded-lg"
              :class="isVirtual(a.name) ? 'opacity-50' : ''"
            >
              <span class="font-mono text-emerald-400 select-all">{{ a.url }}</span>
              <span class="text-[10px] text-slate-500 truncate">{{ a.name }}</span>
            </li>
          </ul>
          <p v-else class="text-slate-500">Use the "Network:" address printed in the terminal.</p>
        </div>

        <div class="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
          <h4 class="font-bold text-pink-400">Step 3: Judges sign in with their PIN</h4>
          <p class="text-slate-400">Find each judge's PIN in <b>Judges & Access</b> on the dashboard. If a PIN leaks, click <b>New PIN</b> — that judge is signed out everywhere.</p>
        </div>

        <div class="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
          <h4 class="font-bold text-pink-400">Phone can't connect?</h4>
          <p class="text-slate-400">On Windows, allow Node.js through the firewall: Windows Security → Firewall & network protection → Allow an app through firewall → tick Node.js for <b>Private</b> networks. Also make sure the Wi-Fi is set to a Private network, not Public.</p>
        </div>
      </div>

      <div class="flex justify-end pt-2">
        <button @click="$emit('close')" class="px-4 py-2 bg-pink-600 hover:bg-pink-500 text-white rounded-lg font-bold text-xs">
          Got It
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  addresses: { type: Array, default: () => [] }
})
defineEmits(['close'])

const isVirtual = (name) => /vethernet|virtualbox|vmware|wsl|docker|hyper-v|vbox/i.test(name)
</script>
