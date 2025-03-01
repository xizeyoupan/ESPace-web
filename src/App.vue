<script setup>
import { ref, onMounted, watchEffect, nextTick } from 'vue'
import { storeToRefs } from 'pinia'
import { useMessage, NModal, NSwitch, NInput, NFlex, NButton, NPopover, NScrollbar } from "naive-ui"
import { connect_device } from './util.js'
import { useDefaultStore } from './store/device.js'
import { get } from 'idb-keyval'

const message = useMessage()
const device = useDefaultStore()

const { wifi_info, device_info, computed_data, log_text_list, user_config } = storeToRefs(device)
const showModal = ref(false)
const showLogPopover = ref(false)

const config_host = () => {
  showModal.value = true
}

device_info.value.dev_mode = await get("dev_mode")

if (!wifi_info.value.isOnline) {
  connect_device(device, message)
}

const logInst = ref(null)

onMounted(() => {
  watchEffect(() => {
    if (log_text_list.value.length) {
      nextTick(() => {
        logInst.value?.scrollTo({ position: "bottom", silent: true })
      })
    }
  })
})

</script>

<template>
  <div class="header-container">
    <h1>魔棒后台</h1>
    <div
      class="status-container"
      @click="config_host"
    >
      <n-popover
        v-if="wifi_info.isOnline"
        trigger="hover"
      >
        <template #trigger>
          <span style="width: 5rem;">{{ computed_data.used_men_percent }}%
          </span>
        </template>
        已用内存
      </n-popover>

      <span :class="['status-icon', wifi_info.isOnline ? 'online' : 'offline']">
        <i
          v-if="wifi_info.isOnline"
          class="fas fa-circle"
          title="在线"
        />
        <i
          v-else
          class="fas fa-circle-notch"
          title="离线"
        />
      </span>
      <span class="status-text">{{ wifi_info.isOnline ? '在线' : '离线' }}</span>
    </div>
  </div>

  <n-modal
    v-model:show="showModal"
    class="custom-card"
    preset="card"
    title="设置魔杖地址"
    size="huge"
    :bordered="false"
  >
    <n-flex
      vertical
      size="large"
    >
      <n-flex>
        <n-switch
          :value="wifi_info.use_user_host"
          @update:value="(v) => { wifi_info.use_user_host = v }"
        >
          <template #checked>
            已启用自定义
          </template>
          <template #unchecked>
            未启用自定义
          </template>
        </n-switch>
      </n-flex>

      <n-flex>
        <div>魔杖ip：</div>
        <n-input
          v-model:value="wifi_info.user_host"
          type="text"
          :disabled="!wifi_info.use_user_host"
          :placeholder="wifi_info.use_user_host ? `例如 192.168.4.1 或 wand-esp32` : `已使用默认配置`"
        />
      </n-flex>

      <n-button @click="connect_device(device, message)">
        重新连接
      </n-button>
    </n-flex>
  </n-modal>

  <nav>
    <RouterLink
      class="nowrap"
      to="/wifi-info"
    >
      WiFi信息
    </RouterLink>
    <RouterLink
      class="nowrap"
      to="/gesture-detection"
    >
      姿态检测
    </RouterLink>
    <RouterLink
      class="nowrap"
      to="/cnn"
    >
      CNN
    </RouterLink>
    <!-- <RouterLink
      class="nowrap"
      to="/bt-info"
    >
      蓝牙信息
    </RouterLink> -->
    <!-- <RouterLink
      class="nowrap"
      to="/bt-info"
    >
      蓝牙信息
    </RouterLink> -->
    <!-- <RouterLink
      class="nowrap"
      to="/ble-gamepad"
    >
      蓝牙手柄
    </RouterLink> -->
    <!-- <RouterLink
      class="nowrap"
      to="/ir-control"
    >
      红外遥控
    </RouterLink> -->
    <!-- <RouterLink
      class="nowrap"
      to="/music-from-net"
    >
      网络音乐播放
    </RouterLink>
    <RouterLink
      class="nowrap"
      to="/music-to-bt"
    >
      蓝牙音乐播放
    </RouterLink> -->
    <RouterLink
      class="nowrap"
      to="/about"
    >
      本机信息
    </RouterLink>
    <RouterLink
      v-if="device_info.dev_mode"
      class="nowrap"
      to="/config"
    >
      自定义配置
    </RouterLink>
    <RouterLink
      v-if="device_info.dev_mode"
      class="nowrap"
      to="/dev"
    >
      开发者模式
    </RouterLink>
  </nav>

  <main class="scrollable-container">
    <RouterView />
  </main>

  <n-popover
    v-if="user_config.enable_ws_log.data"
    trigger="manual"
    :show="showLogPopover"
    style="max-width: 640px;"
  >
    <template #trigger>
      <div class="log-btn">
        <n-button
          circle
          type="info"
          size="large"
          @click="showLogPopover = !showLogPopover"
        >
          <template #icon>
            <i class="fas fa-file-alt" />
          </template>
        </n-button>
      </div>
    </template>

    <n-scrollbar
      ref="logInst"
      style="max-height: 400px"
    >
      <div
        v-for="item of log_text_list"
        :key="item"
        v-html="item"
      />
    </n-scrollbar>
  </n-popover>
</template>

<style>
* {
  vertical-align: middle;
}

body {
  font-size: 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 0;
}

.scrollable-container {
  max-height: 75vh;
  overflow-y: auto;
}

.log-btn {
  position: fixed;
  bottom: 3rem;
  right: 3rem;
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

.nowrap {
  white-space: nowrap;
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
  max-height: 17vh;
  min-height: 7vh;
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
