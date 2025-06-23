<template>
  <TransitionRoot
    :show="showModal"
    as="template"
  >
    <Dialog
      as="div"
      class="relative z-10"
      @close="$emit('exit')"
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
                class="text-lg font-semibold leading-6 text-gray-900"
              >
                {{ t('connect_wifi_modal.title') }}
              </DialogTitle>

              <div class="max-w-full mx-auto py-3 flex items-center">
                <span class="mr-4 text-base">{{ t('connect_wifi_modal.ssid') }}</span>
              </div>
              <input
                v-model="default_store.wifi_info.input_ssid"
                type="text"
                class="w-full p-2 border border-gray-300 rounded-md"
              >
              <div class="max-w-full mx-auto py-3 flex items-center">
                <span class="mr-4 text-base">{{ t('connect_wifi_modal.password') }}</span>
              </div>
              <input
                v-model="default_store.wifi_info.input_password"
                type="password"
                class="w-full p-2 border border-gray-300 rounded-md"
              >

              <div class="mt-4 relative group flex">
                <button
                  type="button"
                  class="rounded-md border border-transparent bg-blue-100 px-4 py-2 mr-4 text-sm font-medium text-blue-900 hover:bg-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                  @click="() => {
                    if(default_store.wifi_info.input_ssid === '') {
                      toast(t('connect_wifi_modal.ssid_empty'), 'error')
                      return
                    }
                    toast(t('connect_wifi_modal.loading'), 'info')
                    wsmgr.connect_wifi()
                  }"
                >
                  {{ $t('connect_wifi_modal.connect') }}
                </button>
                <div
                  class="bottom-full mb-2 px-2 py-1 bg-gray-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                >
                  {{ t('connect_wifi_modal.connect_tooltip') }}
                </div>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>

<script setup>
import { useDefaultStore } from '../store/defaultStore.js'
import { i18n } from '../i18n.js'
import { Dialog, Switch, TransitionRoot, DialogOverlay, TransitionChild, DialogPanel, DialogTitle } from '@headlessui/vue'
import { wsmgr } from '../plugins/ws.js'
import pinia from '../store/index.js'
import { toast } from '../plugins/toast.js'

const { showModal } = defineProps({showModal: Boolean})
defineEmits(['exit'])

const default_store = useDefaultStore(pinia)
const t = i18n.global.t

</script>
