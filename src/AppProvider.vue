<script setup>
import { NMessageProvider, NModalProvider, NConfigProvider } from "naive-ui"
import App from './App.vue'
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
@media screen and (max-width: 2048px) {
  .wrap {
    width: 1536px;
  }
}

@media screen and (max-width: 1920px) {
  .wrap {
    width: 960px;
  }
}

@media screen and (max-width: 1280px) {
  .wrap {
    width: 840px;
  }
}

@media screen and (max-width: 980px) {
  .wrap {
    width: 760px;
  }
}

@media screen and (max-width: 765px) {
  .wrap {
    width: 500px;
  }
}
</style>