<script setup>
import { NMessageProvider, NModalProvider } from "naive-ui"
import App from './App.vue'
</script>

<template>
  <Suspense>
    <n-modal-provider>
      <n-message-provider>
        <app />
      </n-message-provider>
    </n-modal-provider>
  </Suspense>
</template>
