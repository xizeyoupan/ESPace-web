<script setup>

import { ref, } from 'vue'
import { storeToRefs } from 'pinia'
import { useMessage, NModal, NSwitch, NInput, NFlex, NButton } from "naive-ui"
import { connect_device } from '../util.js'
import { useDeviceStore } from '../stores/device.js'
import { WAND_CONNECT_DEVICE_TIMEOUT_MS } from '../config.js'
import { api, github_api } from '../api.js'

const web_version = GIT_VERSION
const message = useMessage()
const device = useDeviceStore()
const { isOnline, host, } = storeToRefs(device)

let latest_tag_name = ''
let sha = ''
let latest_tree = ''

const get_latest_version = async () => {
  let result = await github_api.get("repos/xizeyoupan/magic-wand")
  result = await result.json()
  const repo_id = result.id

  result = await github_api.get("repos/xizeyoupan/magic-wand/releases/latest")
  result = await result.json()

  latest_tag_name ||= result.tag_name

  result = await github_api.get(`repositories/${repo_id}/git/ref/tags/${latest_tag_name}`)
  result = await result.json()

  sha ||= result?.object?.sha?.slice(0, 7)

  latest_tree = `https://github.com/xizeyoupan/magic-wand/tree/${sha}`
}

message.loading('正在读取', { duration: WAND_CONNECT_DEVICE_TIMEOUT_MS - 1000 })

const load_data = async () => {
  if (!isOnline.value) {
    await connect_device(device, message)
  }
  if (isOnline.value) {
  }
}

try {
  const tasks = [get_latest_version(), load_data()]
  await Promise.allSettled(tasks)
} catch (error) {
  console.error(error)
}

</script>

<template>
  <h2>关于</h2>
  <p>prefixURL：{{ host }}</p>
  <p>固件版本：</p>
  <p>
    最新版本：
    <a target="_blank" :href="latest_tree">
      {{ `${latest_tag_name} ${sha}` }}
    </a>
  </p>
  <p>编译时间：</p>
  <p>IDF版本：</p>
  <p>
    web版本：
    <a target="_blank" :href="`https://github.com/xizeyoupan/magic-wand-web/tree/${web_version}`">
      {{ web_version }}
    </a>
  </p>
</template>
