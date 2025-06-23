<template>
  <div
    :title="t('device.connected')"
    class="flex items-center space-x-4"
    @click="showModal = true"
  >
    <WifiIcon
      v-if="default_store.wifi_info.isOnline"
      class="mr-2 h-5 w-5"
      aria-hidden="true"
    />

    <NoSymbolIcon
      v-else
      class="mr-2 h-5 w-5"
      aria-hidden="true"
    />
  </div>

  <TransitionRoot
    :show="showModal"
    as="template"
  >
    <Dialog
      as="div"
      class="relative z-10"
      @close="showModal = false"
    >
      <TransitionChild
        as="template"
        enter="duration-300 ease-out"
        enter-from="opacity-0"
        enter-to="opacity-100"
        leave="duration-200 ease-in"
        leave-from="opacity-100"
        leave-to="opacity-0"
      >
        <div class="fixed inset-0 bg-black/25" />
      </TransitionChild>

      <div class="fixed inset-0 overflow-y-auto">
        <div class="flex min-h-full items-center justify-center p-4 text-center">
          <TransitionChild
            as="template"
            enter="duration-300 ease-out"
            enter-from="opacity-0 scale-95"
            enter-to="opacity-100 scale-100"
            leave="duration-200 ease-in"
            leave-from="opacity-100 scale-100"
            leave-to="opacity-0 scale-95"
          >
            <DialogPanel
              class="w-full max-w-md transform overflow-hidden rounded-xl bg-white p-6 text-left align-middle shadow-xl transition-all"
            >
              <DialogTitle
                as="h3"
                class="py-4 text-lg font-semibold leading-6 text-gray-900"
              >
                {{ t('connect_esp_modal.title') }}
              </DialogTitle>

              <div class="max-w-full mx-auto py-4 flex items-center">
                <span class="mr-4 text-base">{{ t('connect_esp_modal.enable_custom_address') }}</span>

                <Switch
                  v-model="default_store.wifi_info.enable_custom_address"
                  :class="default_store.wifi_info.enable_custom_address ? 'bg-green-600' : 'bg-gray-200'"
                  class="relative inline-flex h-[1.5rem] w-[3.7rem] shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-white/75"
                >
                  <span class="sr-only">Use setting</span>
                  <span
                    aria-hidden="true"
                    :class="default_store.wifi_info.enable_custom_address ? 'translate-x-9' : 'translate-x-0'"
                    class="pointer-events-none inline-block h-[1.2rem] w-[1.2rem] transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out"
                  />
                </Switch>
              </div>

              <input
                v-if="default_store.wifi_info.enable_custom_address"
                v-model="default_store.wifi_info.custom_address"
                type="text"
                :disabled="!default_store.wifi_info.enable_custom_address"
                :placeholder="t('connect_esp_modal.custom_address_placeholder', ['192.168.4.1', 'esp32-light'])"
                class="w-full p-2 border border-gray-300 rounded-md"
              >

              <div class="max-w-full mx-auto py-3 flex items-center">
                <span class="mr-4 text-base">{{ t('connect_esp_modal.username') }}</span>
              </div>
              <input
                v-model="default_store.user_config.username"
                type="text"
                class="w-full p-2 border border-gray-300 rounded-md"
              >
              <div class="max-w-full mx-auto py-3 flex items-center">
                <span class="mr-4 text-base">{{ t('connect_esp_modal.password') }}</span>
              </div>
              <input
                v-model="default_store.user_config.password"
                type="password"
                class="w-full p-2 border border-gray-300 rounded-md"
              >

              <div class="mt-4">
                <button
                  type="button"
                  class="inline-flex justify-center rounded-md border border-transparent bg-blue-100 px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                  @click="connect_device"
                >
                  {{ $t('connect_esp_modal.connect') }}
                </button>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>

<script setup>
import { NoSymbolIcon, WifiIcon } from '@heroicons/vue/20/solid'
import { useDefaultStore } from '../store/defaultStore.js'
import { i18n } from '../i18n.js'
import { ref, useTemplateRef } from 'vue'
import { Dialog, Switch, TransitionRoot, DialogOverlay, TransitionChild, DialogPanel, DialogTitle } from '@headlessui/vue'
import { connect_device } from '../util.js'

const t = i18n.global.t
const default_store = useDefaultStore()
const showModal = ref(false)
</script>
