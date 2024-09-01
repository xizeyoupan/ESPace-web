<script setup>
import { ref } from 'vue'

const web_version = GIT_VERSION

</script>

<template>
  <h2>关于</h2>
  <p>固件版本：</p>
  <p>最新版本：</p>
  <p>最高水位：</p>
  <p>
    web版本：
    <a target="_blank" href="https://github.com/xizeyoupan/magic-wand-web">
      {{ web_version }}
    </a>
  </p>
</template>
