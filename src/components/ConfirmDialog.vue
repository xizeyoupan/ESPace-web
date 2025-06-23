<!-- components/ConfirmDialog.vue -->
<template>
  <Teleport
    v-if="visible"
    to="body"
  >
    <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div class="bg-white p-4 rounded shadow space-y-8 w-64">
        <p class="text-center">
          {{ message }}
        </p>
        <div class="flex justify-evenly space-x-2">
          <button
            class="px-3 py-1 bg-blue-600 text-white rounded"
            @click="confirm"
          >
            {{ t('confirm_dialog.confirm') }}
          </button>
          <button
            class="px-3 py-1 bg-gray-300 rounded"
            @click="cancel"
          >
            {{ t('confirm_dialog.cancel') }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref } from 'vue'
import { i18n } from '../i18n.js'

const t = i18n.global.t

const visible = ref(false)
const message = ref('')
let _resolve

const show = (msg) => {
    message.value = msg
    visible.value = true
    return new Promise((resolve) => {
        _resolve = resolve
    })
}

const confirm = () => {
    visible.value = false
    _resolve(true)
}

const cancel = () => {
    visible.value = false
    _resolve(false)
}

defineExpose({ show })
</script>
