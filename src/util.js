import { storeToRefs } from 'pinia'
import ky from 'ky'
import { WAND_CONNECT_DEVICE_TIMEOUT_MS } from './config.js'

const get_host_from_fetch = async (device, resp_promise) => {
    const { isOnline, host } = storeToRefs(device)

    let resp = await resp_promise
    let resp_host = resp.url.slice(0, -7)
    resp = await resp.text()

    if (resp === '0721esp32wand') {
        isOnline.value = true
        host.value = resp_host
    } else {
        throw new Error(`${resp_host} is Not wand`)
    }
}

export const connect_device = async (device, message) => {
    const { isOnline, user_host } = storeToRefs(device)

    const mdns_fetch = ky.get("http://wand-esp32/whoami", { headers: {}, timeout: WAND_CONNECT_DEVICE_TIMEOUT_MS, retry: { limit: 0 } })
    const ipv4_fetch = ky.get("http://192.168.4.1/whoami", { headers: {}, timeout: WAND_CONNECT_DEVICE_TIMEOUT_MS, retry: { limit: 0 } })
    const user_config_fetch = ky.get(user_host.value ? `http://${user_host.value}/whoami` : 'http://localhost', { headers: {}, timeout: WAND_CONNECT_DEVICE_TIMEOUT_MS, retry: { limit: 0 } })
    try {
        await Promise.any([
            get_host_from_fetch(device, mdns_fetch),
            get_host_from_fetch(device, ipv4_fetch),
            get_host_from_fetch(device, user_config_fetch),
        ])
        message.success("连接成功")
    } catch (error) {
        isOnline.value = false
        message.error("连接失败，点击右上角的状态图标重试")
        console.warn(error)
    }
}
