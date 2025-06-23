import { storeToRefs } from 'pinia'
import { useDefaultStore } from './store/defaultStore.js'
import { reactive, ref, toRef, toRefs, toRaw } from 'vue'
import { api } from './api.js'
import pinia from './store/index.js'
import { toast } from './plugins/toast.js'
import { i18n } from './i18n.js'
import { wsmgr } from './plugins/ws.js'
import { get, set } from 'idb-keyval'

const t = i18n.global.t
const default_store = useDefaultStore(pinia)

const get_host = async (url) => {
    let resp = await api.get(url, { timeout: 2000 })
    let resp_host = resp.url.slice(0, -7)
    resp = await resp.text()

    if (resp === '0721ESPace') {
        default_store.wifi_info.host = resp_host
    } else {
        throw new Error(`${resp_host} is not target device`)
    }
}

export const connect_device = async () => {
    let fetch_pool = []
    const default_mdns_host_name = await get_mdns_host_name()
    if (default_store.wifi_info.enable_custom_address) {
        fetch_pool.push(get_host(`http://${default_store.wifi_info.custom_address}/whoami`))
    } else {
        fetch_pool.push(get_host(`http://${default_mdns_host_name}/whoami`))
        fetch_pool.push(get_host(`http://${default_mdns_host_name}.local/whoami`))
        fetch_pool.push(get_host("http://192.168.4.1/whoami"))
    }
    try {
        await Promise.any(fetch_pool)
        if (wsmgr.url) wsmgr.del()
        wsmgr.init(`ws://${default_store.wifi_info.host.slice(7)}/esp-ws`)
    } catch (error) {
        console.warn(error)
    } finally {
        // if (default_store.wifi_info.isOnline) {
        //     toast(t("toast.connect_success"), "success")
        // } else {
        //     toast(t("toast.connect_failed"), "error")
        // }
    }
}

export const check_not_online = () => {
    if (!default_store.wifi_info.isOnline) {
        // toast(t("toast.device_offline"), "error")
        console.error(t("toast.device_offline"))
        return true
    }
    return false
}

export const sleep_ms = async (ms) => {
    await new Promise(resolve => setTimeout(resolve, ms))
}

export const get_mdns_host_name = async () => {
    const host = await get('mdns_host_name')
    return host || default_store.user_config.mdns_host_name || 'espace'
}

export const set_mdns_host_name = async (host_name) => {
    await set('mdns_host_name', host_name)
}

export const get_ws_username = async () => {
    const username = await get('username')
    return username || default_store.user_config.username || 'murasame'
}

export const set_ws_username = async (username) => {
    await set('username', username)
}

export const get_ws_password = async () => {
    const pass = await get('password')
    return pass || default_store.user_config.password || '0d00'
}

export const set_ws_password = async (password) => {
    await set('password', password)
}

export const get_ledc_data = () => {
    return {
        brightness_input: default_store.user_config.brightness_input,
        frequency: default_store.user_config.frequency,
        pwm_duty_min: default_store.user_config.pwm_duty_min,
        pwm_duty_max: default_store.user_config.pwm_duty_max,
        boot_action: default_store.user_config.boot_action,
        boot_brightness: default_store.user_config.boot_brightness,
        output_func: default_store.user_config.output_func,
        gamma_value: default_store.user_config.gamma_value,
    }
}