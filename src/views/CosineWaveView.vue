<template>
  <div class="p-6 space-y-8">
    <div>
      <h1 class="text-2xl font-bold mb-4">
        Documentation:
      </h1>
      <a
        href="https://docs.espressif.com/projects/esp-idf/zh_CN/v5.2.5/esp32/api-reference/peripherals/dac.html"
        class="text-blue-600 hover:underline"
        target="_blank"
      >
        https://docs.espressif.com/projects/esp-idf/zh_CN/v5.2.5/esp32/api-reference/peripherals/dac.html
      </a>
    </div>

    <!-- 频率和衰减配置 -->
    <section class="bg-white shadow rounded-xl p-4">
      <h2 class="text-lg font-semibold mb-4">
        通道配置
      </h2>
      <div class="flex flex-wrap gap-4 mb-4">
        <!-- 通道序号 -->
        <div class="flex flex-col w-40">
          <label class="text-sm font-medium">通道序号</label>
          <select
            v-model="sine_config.index"
            class="input mt-1"
            @change="get_channel_config"
          >
            <option
              v-for="j in 2"
              :key="j - 1"
              :value="j - 1"
            >
              {{ j - 1 }}
            </option>
          </select>
        </div>

        <!-- 频率 -->
        <div class="flex flex-col w-40">
          <label class="text-sm font-medium">频率 (Hz)</label>
          <input
            v-model="sine_config.freq_hz"
            type="number"
            class="input mt-1"
          >
        </div>

        <!-- 衰减 -->
        <div class="flex flex-col w-40">
          <label class="text-sm font-medium">衰减</label>
          <select
            v-model="sine_config.atten"
            class="input mt-1"
          >
            <option
              v-for="j in 4"
              :key="j - 1"
              :value="j - 1"
            >
              {{ j - 1 }}
            </option>
          </select>
        </div>

        <!-- 相位 -->
        <div class="flex flex-col w-40">
          <label class="text-sm font-medium">相位</label>
          <select
            v-model="sine_config.phase"
            class="input mt-1"
          >
            <option :value="2">
              0
            </option>
            <option :value="3">
              180°
            </option>
          </select>
        </div>

        <!-- 偏移 -->
        <div class="flex flex-col w-40">
          <label class="text-sm font-medium">偏移</label>
          <input
            v-model="sine_config.offset"
            type="number"
            class="input mt-1"
            max="127"
            min="-128"
          >
        </div>
      </div>

      <div class="flex gap-4">
        <button
          class="mt-2 px-4 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
          @click="set_channel_config"
        >
          配置通道
        </button>
        <button
          class="mt-2 px-4 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
          @click="clear_channel_config"
        >
          停止通道
        </button>
      </div>
    </section>
  </div>
</template>

<script setup>
import { reactive } from 'vue'
import { wsmgr } from '../plugins/ws.js'
import { i18n } from '../i18n.js'
import { toast } from '../plugins/toast.js'

const t = i18n.global.t

const sine_config = reactive({
    index: -1,
    freq_hz: 0,
    atten: 0,
    phase: 2,
    offset: 0,
})

const get_channel_config = async () => {
    const result = await wsmgr.get_dac_cosine_config({ index: sine_config.index })
    Object.assign(sine_config, result.data)
}

const clear_channel_config = async () => {
    const result = await wsmgr.clear_dac_cosine_channel({ index: sine_config.index })
    console.log('正弦波控制器通道配置结果:', result)
    Object.assign(sine_config, result.data)
}

const set_channel_config = async () => {
    const result = await wsmgr.set_dac_cosine_channel({
        index: sine_config.index,
        phase: sine_config.phase,
        atten: sine_config.atten,
        freq_hz: sine_config.freq_hz,
        offset: sine_config.offset,
    })

    console.log('正弦波控制器通道配置设置结果:', result)

    if (result.error) {
        toast(t('toast.error'), 'error')
    } else {
        Object.assign(sine_config, result.data)
        toast(t('toast.success'), 'success')
    }
}
</script>

<style scoped>
@reference "tailwindcss";

.input {
  @apply w-full border rounded px-2 py-1 focus:outline-none focus:ring focus:border-blue-400;
}
</style>