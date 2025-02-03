<script setup>
import { computed, reactive, ref } from 'vue'
import { NForm, NFormItem, NInput, NGrid, NGridItem, NInputNumber } from 'naive-ui'
import { useDeviceStore } from '../stores/device.js'
import { storeToRefs } from 'pinia'
const device = useDeviceStore()
const { user_config } = storeToRefs(device)
</script>

<template>
  <h2>当前配置</h2>
  <n-form
    ref="formRef"
    label-placement="left"
    label-width="auto"
  >
    <n-grid
      x-gap="12"
      :cols="2"
      style="justify-items: start;"
    >
      <n-grid-item
        v-for="item of Object.keys(user_config)"
        :key="item"
        style="margin-left: 15px;"
      >
        <n-form-item :label="item">
          <n-input-number
            v-if="typeof (user_config[item].data) === 'number'"
            v-model:value="user_config[item].data"
          />
          <n-input
            v-else
            v-model:value="user_config[item].data"
          />
        </n-form-item>
      </n-grid-item>
    </n-grid>
  </n-form>
</template>
