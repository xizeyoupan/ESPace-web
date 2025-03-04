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

let easter_egg_cnt = 8
const trigger_egg = async () => {
  if (easter_egg_cnt == 5) {
    if (default_store.device_info.dev_mode) {
      message.info('已处于开发者模式')
      return
    }
    message.info('5步后进入开发者模式')
  } else if (easter_egg_cnt == 4) {
    message.info('4步后进入开发者模式')
  } else if (easter_egg_cnt == 3) {
    message.info('3步后进入开发者模式')
  } else if (easter_egg_cnt == 2) {
    message.info('2步后进入开发者模式')
  } else if (easter_egg_cnt == 1) {
    message.info('1步后进入开发者模式')
  } else if (easter_egg_cnt == 0) {
    message.info('已处于开发者模式')
    await set("dev_mode", true)
    default_store.device_info.dev_mode = true
  }

  easter_egg_cnt--
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
  <h2>关于</h2>
  <p>prefixURL：{{ default_store.wifi_info.host }}</p>
  <p>
    <span
      style="user-select: none;"
      @click="trigger_egg"
    >
      固件版本：{{ default_store.device_info.firmware_version }}&nbsp;
    </span>
    <a
      target="_blank"
      :href="default_store.computed_data.firmware_tree"
    >
      {{ default_store.device_info.git_commit_id }}
    </a>
  </p>
  <p>
    <span>
      最新版本：
    </span>
    <a
      target="_blank"
      href="https://github.com/xizeyoupan/magic-wand"
    >
      <img src="https://img.shields.io/badge/xizeyoupan-magic--wand-brightgreen">
    </a>
  </p>
  <p>编译时间：{{ default_store.device_info.compile_time }}</p>
  <p>IDF版本： {{ default_store.device_info.idf_version }}</p>
  <p>芯片封装： {{ default_store.computed_data.package_version_str }}</p>
  <p>
    芯片版本：
    <a
      target="_blank"
      :href="`https://docs.espressif.com/projects/esp-chip-errata/zh_CN/latest/esp32/_tags/v${default_store.computed_data.chip_version_str.slice(1).replace('.', '-')}.html`"
    >
      {{ default_store.computed_data.chip_version_str }}
    </a>
  </p>
  <p>CPU频率： {{ default_store.computed_data.cpu_freq_str }}</p>
  <p>
    web版本：
    <a
      target="_blank"
      :href="`https://github.com/xizeyoupan/magic-wand-web/tree/${web_version}`"
    >
      {{ web_version }}
    </a>
  </p>
</template>
