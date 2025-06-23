<template>
  <Transition
    appear
    enter-active-class="transition ease-out duration-300"
    enter-from-class="opacity-0 translate-y-2"
    enter-to-class="opacity-100 translate-y-0"
    leave-active-class="transition ease-in duration-200"
    leave-from-class="opacity-100 translate-y-0"
    leave-to-class="opacity-0 translate-y-2"
  >
    <div
      v-if="text"
      class="flex items-center px-4 py-2 bg-white rounded shadow-lg"
    >
      <component
        :is="icon"
        class="h-5 w-5"
        :class="{
          'text-green-500': type === 'success',
          'text-red-500': type === 'error',
          'text-blue-500': type === 'info'
        }"
        aria-hidden="true"
      />
      <span class="text-gray-800 text-sm ml-2">{{ text }}</span>
    </div>
  </Transition>
</template>

<script setup>
import { computed } from 'vue'
import { CheckCircleIcon, XCircleIcon, InformationCircleIcon } from '@heroicons/vue/24/solid'

const props = defineProps({
    text: { type: String, default: '' },
    type: { type: String, default: 'success' },
})

const icon = computed(() => {
    switch (props.type) {
    case 'error':
        return XCircleIcon
    case 'info':
        return InformationCircleIcon
    case 'success':
        return CheckCircleIcon
    default:
        return InformationCircleIcon
    }
})
</script>
