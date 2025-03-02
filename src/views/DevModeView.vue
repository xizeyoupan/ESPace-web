<script setup>
import { ref, h, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useMessage, NDataTable } from "naive-ui"
import { useDefaultStore } from '../store/defaultStore.js'

const message = useMessage()
const default_store = useDefaultStore()

const state_to_str = [
  'eRunning',
  'eReady',
  'eBlocked',
  'eSuspended',
  'eDeleted'
]

const column1 = {
  title: '任务id',
  key: 'task_number',
  sorter: false,
  sortOrder: false
}

const column2 = {
  title: '任务名称',
  key: 'task_name',
  sorter: false,
  sortOrder: false,
}

const column3 = {
  title: '任务状态',
  key: 'task_state',
  render(row, index) {
    return h('span', [state_to_str[row.task_state]])
  },
  sorter: false,
  sortOrder: false,
  filter: false,
  filterOptionValues: [],
  filterOptions: [
    {
      label: state_to_str[0],
      value: 0
    },
    {
      label: state_to_str[1],
      value: 1
    },
    {
      label: state_to_str[2],
      value: 2
    },
    {
      label: state_to_str[3],
      value: 3
    },
    {
      label: state_to_str[4],
      value: 4
    },
  ]
}

const column4 = {
  title: '最小可用栈',
  key: 'stack_water_mark',
  sorter: false,
  sortOrder: false,
}

const columns = [
  column1,
  column2,
  column3,
  column4
]

const rowKey = (row) => row.task_number

</script>

<template>
  <div>
    <h2>
      <span>内存统计</span>
    </h2>
    <div>
      <span class="label">已用内存：</span>
      <span class="label">{{ default_store.stat_data.total_allocated_bytes }}</span>
      <span>{{ default_store.computed_data.used_men_percent }}%</span>
    </div>
    <div>
      <span class="label">剩余内存：</span>
      <span class="label">{{ default_store.stat_data.total_free_bytes }}</span>
      <span>{{ default_store.computed_data.free_men_percent }}%</span>
    </div>
    <div><span class="label">最大剩余块：</span>{{ default_store.stat_data.largest_free_block }}</div>
    <div><span class="label">迄今最小剩余内存：</span>{{ default_store.stat_data.minimum_free_bytes }}</div>
    <!-- <div><span class="label">ws buffer 剩余容量：</span>{{ stat_data.ws_bytes_available }}</div> -->

    <h2>
      <span>任务信息</span>
    </h2>
    <n-data-table ref="stat-table" size="small" :columns="columns" :data="default_store.stat_data.task_list"
      :row-key="rowKey" />
  </div>
</template>

<style scoped>
.label {
  width: 15rem;
  display: inline-block;
  font-weight: normal;
}
</style>