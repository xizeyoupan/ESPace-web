<script setup>
import App from './App.vue'
import { NMessageProvider, NModalProvider, NConfigProvider } from "naive-ui"
</script>

<template>
  <Suspense>
    <n-config-provider class="wrap">
      <n-modal-provider>
        <n-message-provider>
          <app />
        </n-message-provider>
      </n-modal-provider>
    </n-config-provider>
  </Suspense>
</template>

<style scoped>
</style>
