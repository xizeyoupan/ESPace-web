<script setup>
import { computed, reactive, ref } from 'vue'
import { NForm, NFormItem, NInput, NGrid, NGridItem, NInputNumber, NButton, NPopconfirm } from 'naive-ui'
import { useDeviceStore } from '../stores/device.js'
import { storeToRefs } from 'pinia'
const device = useDeviceStore()
const { user_config, wsmgr } = storeToRefs(device)

const reset_config = () => {
  wsmgr.value.instance.reset_config()
}

const save_config = () => {
  wsmgr.value.instance.commit_config()
}

</script>

<template>
  <h2>配置</h2>
  <n-form ref="formRef" label-placement="left" label-width="auto">
    <n-grid x-gap="12" :cols="2" style="justify-items: start;">
      <n-grid-item v-for="item of Object.keys(user_config)" :key="item" style="margin-left: 15px;">
        <n-form-item v-if="user_config[item].display" :label="item">
          <n-input-number v-if="typeof (user_config[item].data) === 'number'" v-model:value="user_config[item].data" />
          <n-input v-else v-model:value="user_config[item].data" />
        </n-form-item>
      </n-grid-item>
    </n-grid>

  </n-form>
  <div style="display: flex;justify-content: space-evenly;">

    <n-popconfirm negative-text="取消" positive-text="确认" @positive-click="reset_config">
      <template #trigger>
        <n-button type="info">
          重置
        </n-button>
      </template>
      恢复默认设置？
    </n-popconfirm>

    <n-button type="primary" @click="save_config">
      保存
    </n-button>

  </div>

</template>
