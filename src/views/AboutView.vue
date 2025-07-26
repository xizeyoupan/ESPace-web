<script setup>

import { ref, } from 'vue'
import { storeToRefs } from 'pinia'
import { check_not_online, sleep_ms } from '../util.js'
import { useInfoStore } from '../store/infoStore.js'
import { api, github_api } from '../api.js'
import { get, set } from 'idb-keyval'
import { toast } from '../plugins/toast.js'
import { i18n } from '../i18n.js'
import { wsmgr } from '../plugins/ws.js'

const t = i18n.global.t

const web_version = GIT_VERSION
const info_store = useInfoStore()

let dev_click_cnt = 8
const enable_dev_mode = async () => {
    if (dev_click_cnt < 6) {
        if (info_store.device_info.dev_mode) {
            toast(t('toast.dev_mode_already_activated'), 'info')
            return
        }
        if (dev_click_cnt == 0) {
            toast(t('toast.dev_mode_activated'), 'info')
            await set("dev_mode", true)
            info_store.device_info.dev_mode = true
        } else {
            toast(t('toast.after_cnt_click', { cnt: dev_click_cnt }), 'info')
        }
    }

    dev_click_cnt--
}

</script>

<template>
  <div class="p-4 space-y-4 text-gray-800 max-w-3xl mx-auto">
    <h2 class="text-2xl font-bold">
      {{ $t('nav.about') }}
    </h2>

    <div class="flex flex-wrap items-center">
      <span class="font-semibold mr-2 w-40">{{ $t('about.prefixURL') }}:</span>
      <span class="break-all">{{ info_store.wifi_info.host }}</span>
    </div>

    <div
      class="flex flex-wrap items-center cursor-pointer select-none"
      @click="enable_dev_mode"
    >
      <span class="font-semibold mr-2 w-40">
        {{ $t('about.firmware_version') }}:
      </span>
      <span>{{ info_store.device_info.firmware_version }}</span>
      <a
        target="_blank"
        :href="info_store.computed_data.firmware_tree"
        class="ml-2 text-blue-600 hover:underline break-all"
      >
        {{ info_store.device_info.git_commit_id }}
      </a>
    </div>

    <div class="flex flex-wrap items-center">
      <span class="font-semibold mr-2 w-40">{{ $t('about.latest_version') }}:
      </span>
      <a
        target="_blank"
        href="https://github.com/xizeyoupan/esp-light"
        class="inline-flex items-center space-x-2"
      >
        <img
          src="https://img.shields.io/badge/xizeyoupan-esp--light-brightgreen"
          alt="GitHub Repo"
        >
      </a>
    </div>

    <div class="flex flex-wrap items-center">
      <span class="font-semibold mr-2 w-40">{{ $t('about.compile_time') }}:

      </span>
      <span>{{ info_store.device_info.compile_time }}</span>
    </div>

    <div class="flex flex-wrap items-center">
      <span class="font-semibold mr-2 w-40">{{ $t('about.idf_version') }}:
      </span>
      <span>{{ info_store.device_info.idf_version }}</span>
    </div>

    <div class="flex flex-wrap items-center">
      <span class="font-semibold mr-2 w-40">{{ $t('about.chip_package') }}:
      </span>
      <span>{{ info_store.computed_data.package_version_str }}</span>
    </div>

    <div class="flex flex-wrap items-center">
      <span class="font-semibold mr-2 w-40">{{ $t('about.chip_version') }}:

      </span>
      <a
        target="_blank"
        :href="`https://docs.espressif.com/projects/esp-chip-errata/en/latest/esp32/_tags/v${info_store.computed_data.chip_version_str.slice(1).replace('.', '-')}.html`"
        class="text-blue-600 hover:underline break-all"
      >
        {{ info_store.computed_data.chip_version_str }}
      </a>
    </div>

    <div class="flex flex-wrap items-center">
      <span class="font-semibold mr-2 w-40">{{ $t('about.cpu_freq') }}:

      </span>
      <span>{{ info_store.computed_data.cpu_freq_str }}</span>
    </div>

    <div class="flex flex-wrap items-center">
      <span class="font-semibold mr-2 w-40">{{ $t('about.web_version') }}:
      </span>
      <a
        target="_blank"
        :href="`https://github.com/xizeyoupan/esp-light-web/tree/${web_version}`"
        class="text-blue-600 hover:underline break-all"
      >
        {{ web_version }}
      </a>
    </div>
  </div>
</template>
