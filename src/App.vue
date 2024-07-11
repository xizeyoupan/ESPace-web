<script setup>
const ss = fetch('http://localhost:4000')
</script>

<template>
  <h1>魔棒后台</h1>
  <nav>
    <RouterLink to="/wifi-info">WiFi信息</RouterLink>
    <RouterLink to="/bt-info">蓝牙信息</RouterLink>
    <RouterLink to="/ble-gamepad">蓝牙手柄</RouterLink>
    <RouterLink to="/ir-controller">红外遥控</RouterLink>
    <RouterLink to="/music-from-wifi">网络音乐播放</RouterLink>
    <RouterLink to="/music-from-bt">蓝牙音乐播放</RouterLink>
    <RouterLink to="/gesture-detection">姿态检测</RouterLink>
    <RouterLink to="/about">本机信息</RouterLink>
    <RouterLink to="/dev">开发者模式</RouterLink>
  </nav>
  <main>
    <RouterView />
  </main>
</template>

<style scoped></style>
