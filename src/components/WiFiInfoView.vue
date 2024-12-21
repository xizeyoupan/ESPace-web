<script setup>
import { ref } from 'vue'
import { useMessage } from "naive-ui"
import { storeToRefs } from 'pinia'
import { useDeviceStore } from '../stores/device.js'
import { api } from '../api.js'
import { connect_device } from '../util.js'

import { NList, NListItem, NButton } from "naive-ui"

const wifi_lsit = ref({})
const message = useMessage()
const device = useDeviceStore()

const { isOnline, host } = storeToRefs(device)

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

const get_wifi_list = async () => {
    if (!isOnline.value) {
        message.loading('正在连接设备')
        await connect_device(device, message)
    }

    if (isOnline.value) {
        let messageReactive
        try {
            if (isOnline.value) {
                messageReactive = message.loading("正在扫描", { duration: 20000 })
                let resp = await api.get(host.value + '/wifi_list', { timeout: 20000 })
                resp = await resp.json()
                wifi_lsit.value = resp.wifi_lsit
            }
        } catch (error) {
            console.error(error)
            await connect_device(device, message)
            message.error('扫描超时，请重试')
        } finally {
            messageReactive.destroy()
            messageReactive = null
        }
    }
}

await get_wifi_list()

</script>

<template>
    <n-list>
        <template #header>
            Wi-Fi 列表
        </template>

        <n-list-item v-for="(wifi, index) in wifi_lsit" :key="index">
            <div class="wifi-info">
                <div><span class="label">SSID:</span>{{ wifi.SSID }}</div>
                <div><span class="label">RSSI:</span>{{ wifi.RSSI }} dBm</div>
                <div><span class="label">Channel:</span>{{ wifi.channel }}</div>
                <div><span class="label">Auth Mode:</span>{{ wifiAuthModes[wifi.authmode] }}</div>
                <div><span class="label">Country Code:</span>{{ wifi.country }}</div>
            </div>
            <template #suffix>
                <n-button>连接</n-button>
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
</style>