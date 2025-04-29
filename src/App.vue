<script setup>
import { ref, onMounted, watchEffect, nextTick } from 'vue'
import { connect_device } from './util.js'
import { useDefaultStore } from './store/defaultStore.js'
import { get } from 'idb-keyval'
import LanguageSwitcher from './components/LanguageSwitcher.vue'
import InfoDisplay from './components/ConnectBtn.vue'

const menuIsOpen = ref(false)
const default_store = useDefaultStore()
default_store.device_info.dev_mode = await get("dev_mode")

if (!default_store.wifi_info.isOnline) {
    connect_device()
}

</script>

<template>
  <header class="bg-white shadow-md fixed w-full z-50">
    <div class="max-w-full mx-auto px-4 sm:px-8 lg:px-16 flex justify-between items-center h-16">
      <!-- Logo -->
      <div class="flex-shrink-0 text-xl font-bold text-blue-600">
        {{ $t('app_name') }}
      </div>

      <!-- Desktop Menu -->
      <nav class="hidden md:flex space-x-8 items-center flex-wrap">
        <RouterLink
          class="text-gray-700 hover:text-blue-600"
          to="/wifi-info"
        >
          {{ $t('nav.wifi_info') }}
        </RouterLink>
        <RouterLink
          class="text-gray-700 hover:text-blue-600"
          to="/gesture-detection"
        >
          {{ $t('nav.gesture') }}
        </RouterLink>
        <RouterLink
          class="text-gray-700 hover:text-blue-600"
          to="/cnn"
        >
          {{ $t('nav.CNN') }}
        </RouterLink>

        <RouterLink
          class="text-gray-700 hover:text-blue-600"
          to="/about"
        >
          {{ $t('nav.about') }}
        </RouterLink>
        <RouterLink
          v-if="default_store.device_info.dev_mode"
          class="text-gray-700 hover:text-blue-600"
          to="/config"
        >
          自定义配置
        </RouterLink>
        <RouterLink
          v-if="default_store.device_info.dev_mode"
          class="text-gray-700 hover:text-blue-600"
          to="/dev"
        >
          开发者模式
        </RouterLink>

        <LanguageSwitcher />

        <InfoDisplay />
      </nav>

      <!-- Mobile Menu Button -->
      <div class="md:hidden flex items-center">
        <InfoDisplay />

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
        class="md:hidden bg-white shadow-md"
      >
        <nav class="px-2 pt-2 pb-4 space-y-1">
          <RouterLink
            class="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600"
            to="/wifi-info"
          >
            {{ $t('nav.wifi_info') }}
          </RouterLink>
          <RouterLink
            class="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600"
            to="/gesture-detection"
          >
            {{ $t('nav.gesture') }}
          </RouterLink>
          <RouterLink
            class="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600"
            to="/cnn"
          >
            {{ $t('nav.CNN') }}
          </RouterLink>

          <RouterLink
            class="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600"
            to="/about"
          >
            {{ $t('nav.about') }}
          </RouterLink>
          <RouterLink
            v-if="default_store.device_info.dev_mode"
            class="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600"
            to="/config"
          >
            自定义配置
          </RouterLink>
          <RouterLink
            v-if="default_store.device_info.dev_mode"
            class="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600"
            to="/dev"
          >
            开发者模式
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
</style>
