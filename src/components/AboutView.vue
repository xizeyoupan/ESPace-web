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
  isOnline, host, use_user_host, user_host, repo_id, latest_tag_name, sha, git_commit_id,
  compile_time, firmware_version, idf_version, package_version, chip_version, cpu_freq,
  package_version_str, chip_version_str, cpu_freq_str, firmware_tree
} = storeToRefs(device)

let latest_tree = ''

const get_latest_version = async () => {
  sha.value = "sha"

  if (sha.value) return

  try {
    let result = await github_api.get("repos/xizeyoupan/magic-wand")
    result = await result.json()
    repo_id.value = result.id

    result = await github_api.get("repos/xizeyoupan/magic-wand/releases/latest")
    result = await result.json()

    latest_tag_name.value ||= result.tag_name

    result = await github_api.get(`repositories/${repo_id.value}/git/ref/tags/${latest_tag_name.value}`)
    result = await result.json()

    sha.value ||= result?.object?.sha?.slice(0, 7)

    latest_tree = `https://github.com/xizeyoupan/magic-wand/tree/${sha.value}`
  } catch (error) {
    console.error(error)
    message.error('获取最新版本失败，检查与github的连接')
  }
}

const load_data = async () => {
  if (check_not_oline(device, message)) return

  let resp = await api.get(host.value + '/info')
  resp = await resp.json()

  chip_version.value = resp.chip_version
  compile_time.value = resp.compile_time
  cpu_freq.value = resp.cpu_freq
  firmware_version.value = resp.firmware_version
  git_commit_id.value = resp.git_commit_id
  idf_version.value = resp.idf_version
  package_version.value = resp.package_version
}



await Promise.race(
  [
    sleep_ms(5000),
    (async () => {
      while (!isOnline.value) {
        await sleep_ms(10)
      }
    })()
  ]
)

try {
  message.loading('正在读取')
  const tasks = [get_latest_version(), load_data()]
  await Promise.allSettled(tasks)

} catch (error) {
  console.error(error)
}



</script>

<template>
  <h2>关于</h2>
  <p>prefixURL：{{ host }}</p>
  <p>
    <span>
      固件版本：{{ firmware_version }}&nbsp;
    </span>
    <a
      target="_blank"
      :href="firmware_tree"
    >
      {{ git_commit_id }}
    </a>
  </p>
  <p>
    <span>
      最新版本：
    </span>
    <a href="https://github.com/xizeyoupan/magic-wand">
      <img src="https://img.shields.io/badge/github-gray">
    </a>
    <!-- <a
      target="_blank"
      :href="latest_tree"
    >
      {{ `${latest_tag_name} ${sha}` }}
    </a> -->
  </p>
  <p>编译时间：{{ compile_time }}</p>
  <p>IDF版本： {{ idf_version }}</p>
  <p>芯片封装： {{ package_version_str }}</p>
  <p>
    芯片版本：
    <a
      target="_blank"
      :href="`https://docs.espressif.com/projects/esp-chip-errata/zh_CN/latest/esp32/_tags/v${chip_version_str.slice(1).replace('.', '-')}.html`"
    >
      {{ chip_version_str }}
    </a>
  </p>
  <p>CPU频率： {{ cpu_freq_str }}</p>
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
