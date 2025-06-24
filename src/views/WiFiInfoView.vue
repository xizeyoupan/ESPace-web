<script setup>
import { ref, reactive, toRaw } from 'vue'
import { storeToRefs } from 'pinia'
import { useDefaultStore } from '../store/defaultStore.js'
import { api } from '../api.js'
import { check_not_online } from '../util.js'
import { get, set } from 'idb-keyval'
import { toast } from '../plugins/toast.js'
import { wsmgr } from '../plugins/ws.js'
import { i18n } from '../i18n.js'
import ConnectWifiModal from '../components/ConnectWifiModal.vue'

const t = i18n.global.t
const default_store = useDefaultStore()

const wifiAuthModes = [
  "OPEN",
  "WEP",
  "WPA_PSK",
  "WPA2_PSK",
  "WPA_WPA2_PSK",
  "ENTERPRISE",
  "WPA3_PSK",
  "WPA2_WPA3_PSK",
  "WAPI_PSK",
  "OWE",
  "WPA3_ENT_192",
  "WPA3_EXT_PSK",
  "WPA3_EXT_PSK_MIXED_MODE",
]

const wifiModes = [
  "WIFI_MODE_NULL", // null mode
  "WIFI_MODE_STA", // WiFi station mode
  "WIFI_MODE_AP", // WiFi soft-AP mode
  "WIFI_MODE_APSTA", // WiFi station + soft-AP mode
  "WIFI_MODE_NAN", // WiFi NAN mode
  "WIFI_MODE_MAX" // Max value (not used as a mode)
]

const showModal = ref(false)

const get_wifi_list = async () => {
  if (check_not_online()) return
  toast(t('toast.loading'), 'info')
  await wsmgr.get_wifi_list()
  toast(t('toast.load_success'), 'success')
}

const bssid2manf = (bssid, data) => {
  let result = data ? data[bssid.split('-').join('').slice(0, 6).toLowerCase()] : ''
  return result || ''
}

const get_wifi_info = async () => {
  if (check_not_online()) return
  toast(t('toast.loading'), 'info')
  await wsmgr.get_wifi_info()
  toast(t('toast.load_success'), 'success')
}

let manuf_data = await get('manuf')
let manuf_data_time_interval_obj
manuf_data_time_interval_obj = setInterval(async () => {

  if (manuf_data) {
    clearInterval(manuf_data_time_interval_obj)
    return
  }

  try {
    const res = await api.get('https://www.wireshark.org/assets/json/manuf.json', { timeout: 20000 })
    const json = await res.json()
    manuf_data = json.data
    await set('manuf', json.data)
    toast(t('toast.get_manuf_success'), 'success')

  } catch (err) {
    console.error(err)
    // toast(t('toast.get_manuf_failed'), 'error')
  }
}, 5000)

get_wifi_info()

</script>

<template>
  <div class="flex justify-between items-center mb-4">
    <h2 class="text-lg font-semibold">
      {{ t('wifi_info_view.title') }}
    </h2>
    <button class="px-4 py-1 bg-blue-600 text-white rounded hover:bg-blue-700" @click="get_wifi_info">
      {{ t('button.fresh') }}
    </button>
  </div>

  <div>
    <span class="font-bold w-40 inline-block"> {{ t('wifi_info_view.mode') }}:</span>{{
      wifiModes[default_store.wifi_info.wifi_mode] }}
  </div>
  <template v-if="default_store.wifi_info.wifi_mode === 1">
    <div>
      <span class="font-bold w-40 inline-block">{{ t('wifi_info_view.SSID') }}:</span>{{ default_store.wifi_info.SSID
      }}
    </div>
    <div>
      <span class="font-bold w-40 inline-block">MAC:</span>{{ default_store.wifi_info.BSSID }}
    </div>
    <div>
      <span class="font-bold w-40 inline-block">{{ t('wifi_info_view.RSSI') }}:</span>{{ default_store.wifi_info.RSSI
      }}
    </div>
    <div>
      <span class="font-bold w-40 inline-block">{{ t('wifi_info_view.channel') }}:</span>{{
        default_store.wifi_info.channel }}
    </div>
    <div>
      <span class="font-bold w-40 inline-block">{{ t('wifi_info_view.ip') }}:</span>{{ default_store.wifi_info.ip }}
    </div>
    <div>
      <span class="font-bold w-40 inline-block">{{ t('wifi_info_view.gw') }}:</span>{{ default_store.wifi_info.gw }}
    </div>
    <div>
      <span class="font-bold w-40 inline-block">{{ t('wifi_info_view.netmask') }}:</span>{{
        default_store.wifi_info.netmask }}
    </div>
  </template>

  <hr class="my-6">

  <h2 class="text-lg font-semibold mb-2">
    {{ t('wifi_info_view.wifi_list') }}
  </h2>

  <div class="flex justify-between items-center mb-2">
    <div>{{ t('wifi_info_view.count') }}: {{ default_store.wifi_list.length }}</div>

    <button class="px-4 py-1 bg-blue-600 text-white rounded hover:bg-blue-700" @click="() => {
      get_wifi_list()
    }
    ">
      {{ t('button.fresh') }}
    </button>
  </div>

  <div v-for="(wifi, index) in default_store.wifi_list" :key="index"
    class="border rounded p-4 mb-4 shadow-sm flex flex-col md:flex-row justify-between">
    <div class="font-mono flex flex-col gap-1">
      <div><span class="font-bold w-40 inline-block">SSID:</span>{{ wifi.SSID || '隐藏的WiFi' }}</div>
      <div><span class="font-bold w-40 inline-block">RSSI:</span>{{ wifi.RSSI }} dBm</div>
      <div><span class="font-bold w-40 inline-block">Channel:</span>{{ wifi.channel }}</div>
      <div><span class="font-bold w-40 inline-block">Auth Mode:</span>{{ wifiAuthModes[wifi.authmode] }}</div>
      <div><span class="font-bold w-40 inline-block">Country Code:</span>{{ wifi.country }}</div>
      <div>
        <span class="font-bold w-40 inline-block">MAC:</span>
        <span class="inline-block w-40">{{ wifi.BSSID }}</span>
        <span class="relative group">
          <span class="underline cursor-help">{{ bssid2manf(wifi.BSSID, manuf_data) }}</span>
          <div
            class="absolute hidden group-hover:block bg-gray-800 text-white text-sm rounded py-1 px-2 mt-1 w-72 z-10">
            数据来自 https://www.wireshark.org/tools/oui-lookup.html
          </div>
        </span>
      </div>
    </div>

    <div class="mt-4 md:mt-0 md:ml-4 flex items-start md:items-center justify-end">
      <button class="px-4 py-1 bg-green-600 text-white rounded hover:bg-green-700" @click="() => {
        showModal = true
        default_store.wifi_info.input_ssid = wifi.SSID
        default_store.wifi_info.input_password = ''
      }">
        {{ t('button.connect') }}
      </button>
    </div>
  </div>


  <ConnectWifiModal :show-modal="showModal" @exit="showModal = false" />
</template>
