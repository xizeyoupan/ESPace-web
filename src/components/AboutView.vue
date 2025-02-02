<script setup>

import { ref, } from 'vue'
import { storeToRefs } from 'pinia'
import { useMessage } from "naive-ui"
import { check_not_oline, sleep_ms } from '../util.js'
import { useDeviceStore } from '../stores/device.js'
import { api, github_api } from '../api.js'

const web_version = GIT_VERSION
const message = useMessage()
const device = useDeviceStore()
const {
  wifi_info,
  device_info,
  computed_data
} = storeToRefs(device)

const load_data = async () => {

  if (check_not_oline(device, message)) return
  let resp

  try {
    resp = await api.get(wifi_info.value.host + '/info')
    resp = await resp.json()
  } catch (err) {
    message.error(err)
    console.error(err)
  }

  device_info.value.chip_version = resp.chip_version
  device_info.value.compile_time = resp.compile_time
  device_info.value.cpu_freq = resp.cpu_freq
  device_info.value.firmware_version = resp.firmware_version
  device_info.value.git_commit_id = resp.git_commit_id
  device_info.value.idf_version = resp.idf_version
  device_info.value.package_version = resp.package_version
}

await Promise.race(
  [
    sleep_ms(1500),
    (async () => {
      while (!wifi_info.value.isOnline) {
        await sleep_ms(10)
      }
    })()
  ]
)

try {
  message.loading('正在读取')
  const tasks = [load_data()]
  await Promise.allSettled(tasks)

} catch (error) {
  console.error(error)
}

</script>

<template>
  <h2>关于</h2>
  <p>prefixURL：{{ wifi_info.host }}</p>
  <p>
    <span>
      固件版本：{{ device_info.firmware_version }}&nbsp;
    </span>
    <a
      target="_blank"
      :href="computed_data.firmware_tree"
    >
      {{ device_info.git_commit_id }}
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
      <img src="https://img.shields.io/badge/github-gray">
    </a>
  </p>
  <p>编译时间：{{ device_info.compile_time }}</p>
  <p>IDF版本： {{ device_info.idf_version }}</p>
  <p>芯片封装： {{ computed_data.package_version_str }}</p>
  <p>
    芯片版本：
    <a
      target="_blank"
      :href="`https://docs.espressif.com/projects/esp-chip-errata/zh_CN/latest/esp32/_tags/v${computed_data.chip_version_str.slice(1).replace('.', '-')}.html`"
    >
      {{ computed_data.chip_version_str }}
    </a>
  </p>
  <p>CPU频率： {{ computed_data.cpu_freq_str }}</p>
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
