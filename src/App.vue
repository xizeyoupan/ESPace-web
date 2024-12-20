<script setup>
import { ref, onMounted, } from 'vue'
import { useMessage, NModal, NSwitch, NInput, NFlex, NButton } from "naive-ui"
import ky from 'ky'
import { WAND_CONNECT_DEVICE_TIMEOUT_MS } from './config.js'

const isOnline = ref(false)
const host = ref("")
const showModal = ref(false)
const use_user_host = ref(false)
const user_host = ref("")

const message = useMessage()
const not_connect_device_error = () => {
  message.error("未成功连接设备，点击右上角的状态图标重试。")
}

const connect_device = async () => {
  const mdns_host = ky.get("http://wand-esp32/whoami", { headers: {}, timeout: WAND_CONNECT_DEVICE_TIMEOUT_MS, retry: { limit: 0 } })
  const ipv4_host = ky.get("http://192.168.4.1/whoami", { headers: {}, timeout: WAND_CONNECT_DEVICE_TIMEOUT_MS, retry: { limit: 0 } })
  const user_config_host = ky.get(user_host.value ? `http://${user_host.value}/whoami` : 'http://localhost', { headers: {}, timeout: WAND_CONNECT_DEVICE_TIMEOUT_MS, retry: { limit: 0 } })
  try {
    let resp = await Promise.any([mdns_host, ipv4_host, user_config_host])

    host.value = resp.url.slice(0, -7)
    resp = await resp.text()

    if (resp === '0721esp32wand') {
      isOnline.value = true
      message.success("连接成功")
    } else {
      message.error("并非esp32")
      throw new Error("Not wand")
    }

  } catch (error) {
    isOnline.value = false
    not_connect_device_error()
    console.warn(error)
  }
}

const config_host = () => {
  showModal.value = true
}

onMounted(() => {
  connect_device()
})


</script>

<template>

  <div class="header-container">
    <h1>魔棒后台</h1>
    <div class="status-container" @click="config_host">
      <span :class="['status-icon', isOnline ? 'online' : 'offline']">
        <i v-if="isOnline" class="fas fa-circle" title="在线"></i>
        <i v-else class="fas fa-circle-notch" title="离线"></i>
      </span>
      <span class="status-text">{{ isOnline ? '在线' : '离线' }}</span>
    </div>
  </div>

  <n-modal v-model:show="showModal" class="custom-card" preset="card" title="设置魔杖地址" size="huge" :bordered="false">

    <n-flex vertical size="large">
      <n-flex>
        <n-switch :value="use_user_host" @update:value="(v) => { use_user_host = v }">
          <template #checked>
            已启用自定义
          </template>
          <template #unchecked>
            未启用自定义
          </template>
        </n-switch> </n-flex>

      <n-flex>
        <div>魔杖ip：</div>
        <n-input v-model:value="user_host" type="text" :disabled="!use_user_host"
          :placeholder="use_user_host ? `例如 192.168.4.1 或 wand-esp32` : `已使用默认配置`" />
      </n-flex>

      <n-button @click="connect_device">重新连接</n-button>

    </n-flex>

  </n-modal>

  <nav>
    <RouterLink to="/wifi-info">WiFi信息</RouterLink>
    <RouterLink to="/bt-info">蓝牙信息</RouterLink>
    <RouterLink to="/ble-gamepad">蓝牙手柄</RouterLink>
    <RouterLink to="/ir-control">红外遥控</RouterLink>
    <RouterLink to="/music-from-net">网络音乐播放</RouterLink>
    <RouterLink to="/music-to-bt">蓝牙音乐播放</RouterLink>
    <RouterLink to="/gesture-detection">姿态检测</RouterLink>
    <RouterLink to="/about">本机信息</RouterLink>
    <RouterLink to="/dev">开发者模式</RouterLink>
    <a target="_blank" href="swagger.yaml">swagger</a>
    <a target="_blank" href="https://petstore.swagger.io">swagger ui</a>
  </nav>

  <main>
    <RouterView />
  </main>

</template>

<style>
body {
  margin: 0;
  font-size: 1rem;
}

nav,
main {
  border: 2px solid #000;
  margin-bottom: 10px;
  padding: 10px;
}

nav>a+a {
  margin-left: 10px;
}

h2 {
  border-bottom: 1px solid #ccc;
  margin: 0 0 20px;
}


#app {
  margin: 20px;
}

.custom-card {
  max-width: 400px;
  min-width: 20%;
}

a {
  text-decoration: none;
}

a:hover,
a:active,
a:focus {
  text-decoration: none;
}

.header-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-left: 10px;
  padding-right: 10px;
}

.status-container {
  display: flex;
  align-items: center;
}

.status-icon {
  font-size: 1.5rem;
  margin-right: 8px;
}

.status-text {
  font-size: 1rem;
  color: #333;
}

.status-icon.online {
  color: green;
}

.status-icon.offline {
  color: red;
}
</style>
