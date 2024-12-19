<script setup>
import { ref } from 'vue';

const isOnline = ref(true);
const hots = ref("");

const mdns_host = fetch("http://wand-esp32/whoami",)
const ipv4_host = fetch("http://wand-esp32/whoami")

Promise.any([mdns_host, ipv4_host]).then((value) => {
  console.log(value);
});

</script>

<template>
  <div class="header-container">
    <h1>魔棒后台</h1>
    <div class="status-container">
      <span :class="['status-icon', isOnline ? 'online' : 'offline']">
        <i v-if="isOnline" class="fas fa-circle" title="在线"></i>
        <i v-else class="fas fa-circle-notch" title="离线"></i>
      </span>
      <span class="status-text">{{ isOnline ? '在线' : '离线' }}</span>
    </div>
  </div>

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

<style scoped>
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
