<template>
  <Teleport
    v-if="visible"
    to="body"
  >
    <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div class="bg-white p-4 rounded shadow w-80 space-y-4">
        <p class="text-center">
          {{ label }}
        </p>
        <div class="w-full bg-gray-200 rounded h-4 overflow-hidden">
          <div
            class="bg-blue-600 h-4 transition-all duration-300"
            :style="{ width: progress + '%' }"
          />
        </div>
        <p class="text-sm text-center text-gray-500">
          {{ progress }}%
        </p>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref } from 'vue'

const visible = ref(false)
const progress = ref(0)
const label = ref('加载中...')

function show(initial = 0, msg = '加载中...') {
    progress.value = initial
    label.value = msg
    visible.value = true
}

function update(value, msg = null) {
    progress.value = value
    if (msg !== null) label.value = msg
}

function hide() {
    visible.value = false
}

defineExpose({ show, update, hide })
</script>
