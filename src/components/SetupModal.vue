<template>
  <div class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
    <div class="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl">
      <div class="flex justify-between items-center border-b border-slate-800 pb-3">
        <h3 class="text-base font-bold text-white flex items-center space-x-2">
          <span>🌐</span>
          <span>Local Host & Network Setup Guide</span>
        </h3>
        <button @click="$emit('close')" class="text-slate-400 hover:text-white text-xs">✕</button>
      </div>

      <div class="space-y-4 text-xs text-slate-300">
        <p>To connect judges' tablets or mobile devices to this host machine over local Wi-Fi:</p>

        <div class="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
          <h4 class="font-bold text-pink-400">Step 1: Start Dev Server with Exposed Network Host</h4>
          <code class="block bg-slate-900 p-2 rounded text-blue-300 font-mono">npm run dev -- --host</code>
        </div>

        <div class="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
          <h4 class="font-bold text-pink-400">Step 2: Find Your Local IP Address</h4>
          <p class="text-slate-400">Open Command Prompt / Terminal and type:</p>
          <code class="block bg-slate-900 p-2 rounded text-blue-300 font-mono">ipconfig (Windows) or ifconfig (Mac/Linux)</code>
        </div>

        <div class="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
          <h4 class="font-bold text-pink-400">Step 3: Connect Judges Devices</h4>
          <p class="text-slate-400">Connect judge devices to the same Wi-Fi network and open the browser URL:</p>
          <code class="block bg-slate-900 p-2 rounded text-emerald-400 font-mono">http://192.168.X.X:3000</code>
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
defineEmits(['close'])
</script>
