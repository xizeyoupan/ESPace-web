<script setup>
import { ref, reactive } from 'vue'
import { useMessage } from "naive-ui"
import { storeToRefs } from 'pinia'
import { useDeviceStore } from '../stores/device.js'
import { api } from '../api.js'
import { check_not_oline } from '../util.js'
import { get, set } from 'idb-keyval'

import { NList, NListItem, NButton, NFlex, NPopover, NModal, NInput, NDivider } from "naive-ui"

const wifi_lsit = ref([])
const message = useMessage()
const device = useDeviceStore()
let wifi_info = reactive({})

const { host, } = storeToRefs(device)
let { manuf } = storeToRefs(device)

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
  "WIFI_MODE_NULL",  // null mode
  "WIFI_MODE_STA",   // WiFi station mode
  "WIFI_MODE_AP",    // WiFi soft-AP mode
  "WIFI_MODE_APSTA", // WiFi station + soft-AP mode
  "WIFI_MODE_NAN",   // WiFi NAN mode
  "WIFI_MODE_MAX"    // Max value (not used as a mode)
]

const showModal = ref(false)
const selected_ssid = ref('')
const selected_password = ref('')

const get_wifi_list = async () => {
  if (check_not_oline(device, message)) return

  let messageReactive
  try {
    messageReactive = message.loading("正在扫描", { duration: 20000 })
    let resp = await api.get(host.value + '/wifi_list', { timeout: 20000 })
    resp = await resp.json()
    wifi_lsit.value = resp.wifi_lsit
  } catch (error) {
    console.error(error)
    message.error('扫描超时，请重试')
  } finally {
    messageReactive.destroy()
    messageReactive = null
  }
}


const bssid2manf = (bssid, o) => {
  let result = o.data ? o.data[bssid.split('-').join('').slice(0, 6).toLowerCase()] : ''
  return result || ''
}

const connect_ap = async () => {
  if (!selected_ssid.value) {
    message.error('WiFi名称不能为空')
  }
  const data = new URLSearchParams({
    ssid: selected_ssid.value,
    password: selected_password.value
  })

  try {
    let resp = await api.post(host.value + '/connect_ap', { timeout: 5000, body: data })
    message.info("正在连接，请重新连接WiFi并观察指示灯颜色", { duration: 10000 })
  } catch (error) {
    console.error(error)
    message.error(error)
  }
}

const get_wifi_info = async () => {
  let messageReactive

  try {
    messageReactive = message.loading("正在刷新", { duration: 2000 })
    let resp = await api.get(host.value + '/wifi_info')
    resp = await resp.json()
    Object.assign(wifi_info, resp)
  } catch (error) {
    console.error(error)
  } finally {
    if (messageReactive) messageReactive.destroy()
    messageReactive = null
  }
}

manuf.value.data = await get('manuf')

if (!manuf.value.data) {
  api.get('https://www.wireshark.org/assets/json/manuf.json', { timeout: 20000 })
    .then(res => res.json())
    .then(res => {
      manuf.value.data = res.data
      set('manuf', res.data)
    })
    .catch(err => {
      console.error(err)
      message.error('获取厂商数据失败')
    })
}

await get_wifi_info()

</script>

<template>
  <n-flex justify="space-between">
    <h2>当前连接信息</h2>
    <n-button
      strong
      secondary
      type="primary"
      @click="get_wifi_info"
    >
      刷新
    </n-button>
  </n-flex>

  <div><span class="label">WiFi模式:</span>{{ `${wifiModes[wifi_info.WiFi_mode]}` }}</div>
  <div v-if="wifi_info.WiFi_mode === 1">
    <span class="label">SSID:</span>{{ wifi_info.SSID }}
  </div>
  <div v-if="wifi_info.WiFi_mode === 1">
    <span class="label">RSSI:</span>{{ wifi_info.RSSI }}
  </div>
  <div v-if="wifi_info.WiFi_mode === 1">
    <span class="label">Channel:</span>{{ wifi_info.channel }}
  </div>
  <div v-if="wifi_info.WiFi_mode === 1">
    <span class="label">本机ip:</span>{{ wifi_info.ip }}
  </div>
  <div v-if="wifi_info.WiFi_mode === 1">
    <span class="label">网关ip:</span>{{ wifi_info.gw }}
  </div>
  <div v-if="wifi_info.WiFi_mode === 1">
    <span class="label">子网掩码:</span>{{ wifi_info.netmask }}
  </div>

  <n-divider />
  <h2>WiFi列表</h2>

  <n-modal
    v-model:show="showModal"
    class="custom-card"
    preset="card"
    title="连接WiFi"
    size="huge"
    :bordered="true"
  >
    <n-flex
      vertical
      size="large"
    >
      <n-flex>
        <div>SSID：</div>
        <n-input
          v-model:value="selected_ssid"
          type="text"
          placeholder="输入WiFi名称"
        />
        <div>PASSWORD：</div>
        <n-input
          v-model:value="selected_password"
          type="text"
          placeholder="输入WiFi密码"
        />
      </n-flex>

      <n-popover
        trigger="hover"
        placement="bottom"
      >
        <template #trigger>
          <n-button @click="connect_ap">
            连接
          </n-button>
        </template>
        指示灯颜色：绿色：连接成功；洋红色：正在连接；青色：连接失败，退回AP模式
      </n-popover>
    </n-flex>
  </n-modal>

  <n-list>
    <template #header>
      <n-flex justify="space-between">
        <div>数量：{{ wifi_lsit.length }}</div>
        <n-button
          strong
          secondary
          type="primary"
          @click="get_wifi_list"
        >
          刷新
        </n-button>
      </n-flex>
    </template>

    <n-list-item
      v-for="(wifi, index) in wifi_lsit"
      :key="index"
    >
      <div class="wifi-info">
        <div><span class="label">SSID:</span>{{ wifi.SSID || `隐藏的WiFi` }}</div>
        <div><span class="label">RSSI:</span>{{ wifi.RSSI }} dBm</div>
        <div><span class="label">Channel:</span>{{ wifi.channel }}</div>
        <div><span class="label">Auth Mode:</span>{{ wifiAuthModes[wifi.authmode] }}</div>
        <div><span class="label">Country Code:</span>{{ wifi.country }}</div>
        <div>
          <span class="label">MAC:</span>
          <span class="mac_label">{{ `${wifi.BSSID}` }}</span>
          <n-popover trigger="hover">
            <template #trigger>
              <span class="manuf_label">{{ `${bssid2manf(wifi.BSSID, manuf)}` }}</span>
            </template>
            数据来自https://www.wireshark.org/tools/oui-lookup.html
          </n-popover>
        </div>
      </div>
      <template #suffix>
        <n-button
          @click="() => {
            showModal = true
            selected_ssid = wifi.SSID
            selected_password = ''
          }"
        >
          连接
        </n-button>
      </template>
    </n-list-item>
  </n-list>
</template>

<style scoped>
.wifi-info {
  font-family: monospace;
  display: flex;
  flex-direction: column;
}

.label {
  width: 10rem;
  display: inline-block;
  font-weight: bold;
}

.mac_label {
  width: 10rem;
  display: inline-block;
}

.manuf_label {
  font-family: Arial, Helvetica, sans-serif;
}
</style>