<template>
  <div class="p-6 space-y-8">
    <div>
      <h1 class="text-2xl font-bold mb-4">
        Documentation:
      </h1>
      <a
        href="https://docs.espressif.com/projects/esp-idf/zh_CN/v5.2.5/esp32/api-reference/peripherals/ledc.html"
        class="text-blue-600 hover:underline"
        target="_blank"
      >
        https://docs.espressif.com/projects/esp-idf/zh_CN/v5.2.5/esp32/api-reference/peripherals/ledc.html
      </a>
    </div>
    <!-- 时钟配置 -->
    <section class="bg-white shadow rounded-xl p-4">
      <h2 class="text-lg font-semibold mb-4">
        时钟配置
      </h2>
      <div class="flex flex-wrap gap-4">
        <!-- 序号 -->
        <div class="flex flex-col w-40">
          <label class="text-sm font-medium">时钟序号</label>
          <select
            v-model="ledc_timer.index"
            class="input mt-1"
            @change="get_timer_config"
          >
            <option
              v-for="i in 4"
              :key="i - 1"
              :value="i - 1"
            >
              {{ i - 1 }}
            </option>
          </select>
        </div>

        <!-- 速度 -->
        <!-- <div class="flex flex-col w-40">
          <label class="text-sm font-medium">速度</label>
          <select
            v-model.number="ledc_timer.speed_mode"
            class="input mt-1"
          >
            <option value="1">
              LOW
            </option>
            <option value="0">
              HIGH
            </option>
          </select>
        </div> -->

        <!-- 分辨率 -->
        <div class="flex flex-col w-40">
          <label class="text-sm font-medium">分辨率（位）</label>
          <input
            v-model="ledc_timer.duty_resolution"
            type="number"
            class="input mt-1 disabled:bg-gray-100 disabled:text-gray-400"
            disabled
          >
        </div>

        <!-- 频率 -->
        <div class="flex flex-col w-40">
          <label class="text-sm font-medium">频率</label>
          <input
            v-model="ledc_timer.freq_hz"
            type="number"
            class="input mt-1"
          >
        </div>
      </div>

      <button
        class="mt-2 px-4 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
        @click="set_timer_config"
      >
        配置时钟
      </button>
    </section>

    <!-- 通道配置 -->
    <section class="bg-white shadow rounded-xl p-4">
      <h2 class="text-lg font-semibold mb-4">
        通道配置
      </h2>
      <div class="flex flex-wrap gap-4 mb-4">
        <!-- 序号 -->
        <div class="flex flex-col w-40">
          <label class="text-sm font-medium">通道序号</label>
          <select
            v-model="channel.index"
            class="input mt-1"
            @change="get_channel_config"
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

        <div class="flex flex-col w-40">
          <label class="text-sm font-medium">时钟序号</label>
          <select
            v-model="channel.timer_sel"
            class="input mt-1"
            @change="update_duty_resolution"
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

        <!-- IO序号 -->
        <div class="flex flex-col w-40">
          <label class="text-sm font-medium">IO序号</label>
          <input
            v-model="channel.gpio_num"
            type="number"
            class="input mt-1"
          >
        </div>

        <!-- 占空比 -->
        <div class="flex flex-col w-40">
          <label class="text-sm font-medium">占空比</label>
          <input
            v-model="channel.duty"
            type="number"
            class="input mt-1"
          >
          <label class="text-sm font-medium">{{ (channel.duty / (2 ** channel.duty_resolution) * 100).toFixed(2)
          }}%</label>
        </div>

        <!-- hpoint -->
        <div class="flex flex-col w-40">
          <label class="text-sm font-medium">HPoint</label>
          <input
            v-model="channel.hpoint"
            type="number"
            class="input mt-1"
          >
          <label class="text-sm font-medium">{{ (channel.hpoint / (2 ** channel.duty_resolution) * 100).toFixed(2)
          }}%</label>
        </div>

        <!-- 速度 -->
        <!-- <div class="flex flex-col w-40">
          <label class="text-sm font-medium">速度</label>
          <select
            v-model.number="channel.speed_mode"
            class="input mt-1"
          >
            <option value="1">
              LOW
            </option>
            <option value="0">
              HIGH
            </option>
          </select>
        </div> -->
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

const ledc_timer = reactive({
    index: -1,
    speed_mode: 0,
    duty_resolution: 0,
    freq_hz: 0,
    clk_cfg: 0,
})

const channel = reactive({
    index: -1,
    gpio_num: 0,
    duty: 0,
    hpoint: 0,
    speed_mode: 0,
    timer_sel: -1,
    duty_resolution: 0,
})

const update_duty_resolution = async () => {
    if (channel.index >= 0 && channel.timer_sel >= 0) {
        const result = await wsmgr.get_ledc_timer_config({ index: channel.timer_sel })
        channel.duty_resolution = result.data.duty_resolution
        console.log('更新通道占空比分辨率:', channel.duty_resolution)
    }
}

const get_timer_config = async () => {
    const result = await wsmgr.get_ledc_timer_config({ index: ledc_timer.index })
    console.log('LED控制器时钟配置结果:', result)
    Object.assign(ledc_timer, result.data)
}

const set_timer_config = async () => {
    if (ledc_timer.freq_hz <= 0) {
        toast(t('toast.freq_invalid'), 'error')
        return
    }

    if (ledc_timer.index < 0 || ledc_timer.index > 3) {
        toast(t('toast.index_invalid'), 'error')
        return
    }

    const result = await wsmgr.set_ledc_timer_config(
        {
            index: ledc_timer.index,
            speed_mode: ledc_timer.speed_mode,
            freq_hz: ledc_timer.freq_hz,
        })

    console.log('LED控制器时钟配置设置结果:', result)
    if (result.error) {
        toast(t('toast.error'), 'error')
    } else {
        Object.assign(ledc_timer, result.data)
        await update_duty_resolution()
        toast(t('toast.success'), 'success')
    }

}

const get_channel_config = async () => {
    const result = await wsmgr.get_ledc_channel_config({ index: channel.index })
    console.log('LED控制器通道配置结果:', result)
    Object.assign(channel, result.data)
}

const clear_channel_config = async () => {
    const result = await wsmgr.clear_ledc_channel_config({ index: channel.index })
    console.log('LED控制器通道配置结果:', result)
    Object.assign(channel, result.data)
}

const set_channel_config = async () => {
    const result = await wsmgr.set_ledc_channel_config(
        {
            index: channel.index,
            gpio_num: channel.gpio_num,
            speed_mode: channel.speed_mode,
            timer_sel: channel.timer_sel,
            duty: channel.duty,
            hpoint: channel.hpoint,
        })

    console.log('LED控制器通道配置设置结果:', result)

    if (result.error) {
        toast(t('toast.error'), 'error')
    } else {
        Object.assign(channel, result.data)
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
