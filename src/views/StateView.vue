<script setup>
import { ref, h, computed, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useDefaultStore } from '../store/defaultStore.js'
import { i18n } from '../i18n.js'
import { check_not_online } from '../util.js'
import { wsmgr } from '../plugins/ws.js'

const t = i18n.global.t
const default_store = useDefaultStore()

const state_to_str = [
    'eRunning',
    'eReady',
    'eBlocked',
    'eSuspended',
    'eDeleted'
]

wsmgr.get_state_info()

let time_interval_obj
time_interval_obj = setInterval(() => {
    if (check_not_online()) return
    wsmgr.get_state_info()
}, 3000)

onUnmounted(() => {
    clearInterval(time_interval_obj)
})

</script>

<template>
  <div class="max-w-4xl mx-auto px-4 py-6 space-y-6">
    <h2 class="text-xl font-semibold">
      {{ t('state_view.memory_statistics') }}
    </h2>

    <div class="space-y-1 text-base">
      <div class="flex justify-between">
        <span class="w-60 font-medium text-gray-700">{{ t('state_view.used_memory') }}:</span>
        <span class="text-gray-900">{{ default_store.stat_data.total_allocated_bytes }}</span>
        <span class="text-gray-500">{{ default_store.computed_data.used_men_percent }}%</span>
      </div>
      <div class="flex justify-between">
        <span class="w-60 font-medium text-gray-700">{{ t('state_view.free_memory') }}:</span>
        <span class="text-gray-900">{{ default_store.stat_data.total_free_bytes }}</span>
        <span class="text-gray-500">{{ default_store.computed_data.free_men_percent }}%</span>
      </div>
      <div class="flex justify-between">
        <span class="w-60 font-medium text-gray-700">{{ t('state_view.largest_free_block') }}:</span>
        <span class="text-gray-900">{{ default_store.stat_data.largest_free_block }}</span>
      </div>
      <div class="flex justify-between">
        <span class="w-60 font-medium text-gray-700">{{ t('state_view.minimum_free_memory') }}:</span>
        <span class="text-gray-900">{{ default_store.stat_data.minimum_free_bytes }}</span>
      </div>
    </div>

    <h2 class="text-xl font-semibold">
      {{ t('state_view.task_statistics') }}
    </h2>

    <div class="overflow-auto">
      <table class="min-w-full border border-gray-200 text-sm">
        <thead class="bg-gray-100 text-left">
          <tr>
            <th class="px-4 py-2 border-b">
              {{ t('state_view.task_number') }}
            </th>
            <th class="px-4 py-2 border-b">
              {{ t('state_view.task_name') }}
            </th>
            <th class="px-4 py-2 border-b">
              {{ t('state_view.task_state') }}
            </th>
            <th class="px-4 py-2 border-b">
              {{ t('state_view.task_high_water_mark') }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="task in default_store.stat_data.task_list"
            :key="task.pcTaskName"
            class="hover:bg-gray-50"
          >
            <td class="px-4 py-2 border-b">
              {{ task.xTaskNumber }}
            </td>
            <td class="px-4 py-2 border-b">
              {{ task.pcTaskName }}
            </td>
            <td class="px-4 py-2 border-b">
              {{ state_to_str[task.eCurrentState] }}
            </td>
            <td class="px-4 py-2 border-b">
              {{ task.usStackHighWaterMark }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
