<script setup>

import { ref, } from 'vue'
import { storeToRefs } from 'pinia'
import { useMessage } from "naive-ui"
import { check_not_oline, sleep_ms } from '../util.js'
import { useDefaultStore } from '../store/defaultStore.js'
import { api, github_api } from '../api.js'
import { get, set } from 'idb-keyval'

const web_version = GIT_VERSION
const message = useMessage()
const default_store = useDefaultStore()

const load_data = async () => {

    if (check_not_oline(message)) return
    let resp

    try {
        resp = await api.get(default_store.wifi_info.host + '/info')
        resp = await resp.json()
    } catch (err) {
        message.error(err.toString())
        console.error(err)
    }

    default_store.device_info.chip_version = resp.chip_version
    default_store.device_info.compile_time = resp.compile_time
    default_store.device_info.cpu_freq = resp.cpu_freq
    default_store.device_info.firmware_version = resp.firmware_version
    default_store.device_info.git_commit_id = resp.git_commit_id
    default_store.device_info.idf_version = resp.idf_version
    default_store.device_info.package_version = resp.package_version
}

let dev_click_cnt = 8
const enable_dev_mode = async () => {
    if (dev_click_cnt == 5) {
        if (default_store.device_info.dev_mode) {
            message.info('已处于开发者模式')
            return
        }
        message.info('5步后进入开发者模式')
    } else if (dev_click_cnt == 4) {
        message.info('4步后进入开发者模式')
    } else if (dev_click_cnt == 3) {
        message.info('3步后进入开发者模式')
    } else if (dev_click_cnt == 2) {
        message.info('2步后进入开发者模式')
    } else if (dev_click_cnt == 1) {
        message.info('1步后进入开发者模式')
    } else if (dev_click_cnt == 0) {
        message.info('已处于开发者模式')
        await set("dev_mode", true)
        default_store.device_info.dev_mode = true
    }

    dev_click_cnt--
}

await Promise.race(
    [
        sleep_ms(500),
        (async () => {
            while (!default_store.wifi_info.isOnline) {
                await sleep_ms(10)
            }
        })()
    ]
)

try {
    message.loading('正在读取', { duration: 1000 })
    const tasks = [load_data()]
    await Promise.allSettled(tasks)

} catch (error) {
    console.error(error)
}

</script>

<template>
  <div class="p-4 space-y-4 text-gray-800 max-w-3xl mx-auto">
    <h2 class="text-2xl font-bold">
      关于
    </h2>

    <div class="flex flex-wrap items-center">
      <span class="font-semibold mr-2">prefixURL：</span>
      <span class="break-all">{{ default_store.wifi_info.host }}</span>
    </div>

    <div
      class="flex flex-wrap items-center"
      @click="enable_dev_mode"
    >
      <span
        class="font-semibold mr-2 cursor-pointer select-none"
      >
        固件版本：
      </span>
      <span>{{ default_store.device_info.firmware_version }}</span>
      <a
        target="_blank"
        :href="default_store.computed_data.firmware_tree"
        class="ml-2 text-blue-600 hover:underline break-all"
      >
        {{ default_store.device_info.git_commit_id }}
      </a>
    </div>

    <div class="flex flex-wrap items-center">
      <span class="font-semibold mr-2">最新版本：</span>
      <a
        target="_blank"
        href="https://github.com/xizeyoupan/magic-wand"
        class="inline-flex items-center space-x-2"
      >
        <img
          src="https://img.shields.io/badge/xizeyoupan-magic--wand-brightgreen"
          alt="GitHub Repo"
        >
      </a>
    </div>

    <div class="flex flex-wrap items-center">
      <span class="font-semibold mr-2">编译时间：</span>
      <span>{{ default_store.device_info.compile_time }}</span>
    </div>

    <div class="flex flex-wrap items-center">
      <span class="font-semibold mr-2">IDF版本：</span>
      <span>{{ default_store.device_info.idf_version }}</span>
    </div>

    <div class="flex flex-wrap items-center">
      <span class="font-semibold mr-2">芯片封装：</span>
      <span>{{ default_store.computed_data.package_version_str }}</span>
    </div>

    <div class="flex flex-wrap items-center">
      <span class="font-semibold mr-2">芯片版本：</span>
      <a
        target="_blank"
        :href="`https://docs.espressif.com/projects/esp-chip-errata/zh_CN/latest/esp32/_tags/v${default_store.computed_data.chip_version_str.slice(1).replace('.', '-')}.html`"
        class="text-blue-600 hover:underline break-all"
      >
        {{ default_store.computed_data.chip_version_str }}
      </a>
    </div>

    <div class="flex flex-wrap items-center">
      <span class="font-semibold mr-2">CPU频率：</span>
      <span>{{ default_store.computed_data.cpu_freq_str }}</span>
    </div>

    <div class="flex flex-wrap items-center">
      <span class="font-semibold mr-2">web版本：</span>
      <a
        target="_blank"
        :href="`https://github.com/xizeyoupan/magic-wand-web/tree/${web_version}`"
        class="text-blue-600 hover:underline break-all"
      >
        {{ web_version }}
      </a>
    </div>
  </div>
</template>
