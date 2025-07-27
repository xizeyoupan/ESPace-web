<script setup>
import { ref, onMounted, watchEffect, nextTick } from 'vue'
import { connect_device } from './util.js'
import { useInfoStore } from './store/infoStore.js'
import { get } from 'idb-keyval'
import LanguageSwitcher from './components/LanguageSwitcher.vue'
import ConnectBtn from './components/ConnectBtn.vue'
import PeripNavBtn from './components/PeripNavBtn.vue'
import CNNNavBtn from './components/CNNNavBtn.vue'
import WaveGenNavBtn from './components/WaveGenNavBtn.vue'
import router from './router.js'

const menuIsOpen = ref(false)
const info_store = useInfoStore()
info_store.device_info.dev_mode = await get("dev_mode")

// if (!info_store.wifi_info.isOnline && router.currentRoute.value.path !== '/esptool') {
//     await connect_device()
// }

setInterval(() => {
    if (!info_store.wifi_info.isOnline && router.currentRoute.value.path !== '/esptool') {
        connect_device()
    }
}, 3000)

const mobile_nav_item_css = "block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600"
const desktop_nav_item_css = "text-gray-700 hover:text-blue-600"
</script>

<template>
  <header class="bg-white shadow-md fixed w-full z-50">
    <div class="max-w-full mx-auto px-4 sm:px-8 lg:px-16 flex justify-between items-center h-16">
      <!-- Logo -->
      <div class="flex-shrink-0 text-xl font-bold text-blue-600">
        {{ $t('app_name') }}
      </div>

      <!-- Desktop Menu -->
      <nav class="hide-under-1800 show-at-1800-up space-x-8 items-center flex-wrap">
        <PeripNavBtn />
        <CNNNavBtn />
        <WaveGenNavBtn />

        <RouterLink
          :class="mobile_nav_item_css"
          to="/logic-analyzer"
        >
          {{ $t('nav.logic_analyzer') }}
        </RouterLink>

        <RouterLink
          :class="desktop_nav_item_css"
          to="/wifi-info"
        >
          {{ $t('nav.wifi_info') }}
        </RouterLink>

        <RouterLink
          :class="desktop_nav_item_css"
          to="/mpu"
        >
          {{ $t('nav.mpu') }}
        </RouterLink>

        <RouterLink
          :class="desktop_nav_item_css"
          to="/about"
        >
          {{ $t('nav.about') }}
        </RouterLink>

        <RouterLink
          :class="desktop_nav_item_css"
          to="/config"
        >
          {{ $t('nav.config') }}
        </RouterLink>

        <RouterLink
          v-if="info_store.device_info.dev_mode"
          :class="desktop_nav_item_css"
          to="/stat"
        >
          {{ $t('nav.stat') }}
        </RouterLink>

        <RouterLink
          target="_blank"
          :class="desktop_nav_item_css"
          to="/esptool"
        >
          {{ $t('nav.esptool') }}
        </RouterLink>

        <LanguageSwitcher />

        <ConnectBtn />
      </nav>

      <!-- Mobile Menu Button -->
      <div class="show-under-1800 hide-at-1800-up items-center">
        <ConnectBtn />

        <button
          class="text-gray-700 hover:text-blue-600 focus:outline-none"
          @click="menuIsOpen = !menuIsOpen"
        >
          <svg
            v-if="!menuIsOpen"
            class="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
          <svg
            v-else
            class="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>

    <!-- Mobile Menu -->
    <Transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="opacity-0 -translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-2"
    >
      <div
        v-if="menuIsOpen"
        class="show-under-1800 hide-at-1800-up bg-white shadow-md"
      >
        <nav class="flex flex-col items-start px-2 pt-2 pb-4 space-y-1">
          <PeripNavBtn />
          <CNNNavBtn />
          <WaveGenNavBtn />

          <RouterLink
            :class="mobile_nav_item_css"
            to="/logic-analyzer"
          >
            {{ $t('nav.logic_analyzer') }}
          </RouterLink>

          <RouterLink
            :class="mobile_nav_item_css"
            to="/wifi-info"
          >
            {{ $t('nav.wifi_info') }}
          </RouterLink>

          <RouterLink
            :class="mobile_nav_item_css"
            to="/mpu"
          >
            {{ $t('nav.mpu') }}
          </RouterLink>

          <RouterLink
            :class="mobile_nav_item_css"
            to="/about"
          >
            {{ $t('nav.about') }}
          </RouterLink>

          <RouterLink
            :class="mobile_nav_item_css"
            to="/config"
          >
            {{ $t('nav.config') }}
          </RouterLink>

          <RouterLink
            v-if="info_store.device_info.dev_mode"
            :class="mobile_nav_item_css"
            to="/stat"
          >
            {{ $t('nav.stat') }}
          </RouterLink>

          <RouterLink
            target="_blank"
            :class="mobile_nav_item_css"
            to="/esptool"
          >
            {{ $t('nav.esptool') }}
          </RouterLink>

          <LanguageSwitcher />
        </nav>
      </div>
    </Transition>
  </header>

  <main class="pt-20 max-w-7xl mx-auto px-4 w-full">
    <RouterView />
  </main>
</template>

<style scoped>
@media (min-width: 1800px) {
  .hide-at-1800-up {
    display: none !important;
  }
  .show-at-1800-up {
    display: flex !important;
  }
}

@media (max-width: 1799px) {
  .hide-under-1800 {
    display: none !important;
  }
  .show-under-1800 {
    display: flex !important;
  }
}
</style>
