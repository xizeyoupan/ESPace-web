import { toast } from './toast.js'
import { useDefaultStore } from '../store/defaultStore.js'
import { i18n } from '../i18n.js'
import pinia from '../store/index.js'
import { get_ws_username, get_ws_password, set_ws_username, set_ws_password, set_mdns_host_name, get_ledc_data, check_not_online } from '../util.js'

const default_store = useDefaultStore(pinia)
const t = i18n.global.t

class WebSocketManager {

    constructor() {
        this.url = ''
        this.pendingRequests = new Map()
        this.messageHandlers = new Map()
        this.requestCounter = 0
        this.ws = null
        this.reconnectLock = false
        this.reconnectTimer = null
        this.init_timeIntervalObj = null
        this.heartCheck = {
            timeout: 10000,
            timeoutObj: null,
            serverTimeoutObj: null,
            reset: () => {
                clearTimeout(this.heartCheck.timeoutObj)
                clearTimeout(this.heartCheck.serverTimeoutObj)
                this.heartCheck.start()
            },
            start: () => {
                this.heartCheck.timeoutObj = setTimeout(() => {
                    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                        this.sendRequest('ping')
                        this.heartCheck.serverTimeoutObj = setTimeout(() => {
                            this.ws.close()
                        }, this.heartCheck.timeout)
                    }
                }, this.heartCheck.timeout)
            }
        }
    }

    async init(url) {
        this.url = url
        await this.connect()
    }

    async connect() {
        this.del()

        const ws_username = await get_ws_username()
        const ws_password = await get_ws_password()
        this.ws = new WebSocket(this.url + `?token=${ws_username}:${ws_password}`)
        this.ws.binaryType = "arraybuffer"

        toast(t('toast.loading'), 'info')
        default_store.device_info.cpu_freq = 0

        this.init_timeIntervalObj = setInterval(() => {
            if (default_store.device_info.cpu_freq && default_store.user_config.username) {
                clearInterval(this.init_timeIntervalObj)
                this.init_timeIntervalObj = null
                return
            }

            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.get_device_info()
                this.get_user_config()
            }
        }, 2000)

        this.ws.onopen = () => {
            console.log("WebSocket 连接成功")
            default_store.wifi_info.isOnline = true
            this.heartCheck.start()
        }

        this.ws.onmessage = (event) => {
            default_store.wifi_info.isOnline = true
            this.heartCheck.reset()

            try {
                const msg = JSON.parse(event.data)
                const { type, requestId, payload, error } = msg

                if (requestId && this.pendingRequests.has(requestId)) {
                    const { resolve, reject, timeout } = this.pendingRequests.get(requestId)
                    clearTimeout(timeout)
                    this.pendingRequests.delete(requestId)
                    error ? reject(error) : resolve(payload)
                } else if (type && this.messageHandlers.has(type)) {
                    this.messageHandlers.get(type)(payload)
                } else {
                    console.warn("未处理的消息：", msg)
                }
            } catch (e) {
                console.error("消息解析失败：", e)
            }
        }

        this.ws.onclose = () => {
            default_store.wifi_info.isOnline = false
            console.log("WebSocket 连接关闭，尝试重连...")
            this.reconnect()
        }

        this.ws.onerror = (error) => {
            default_store.wifi_info.isOnline = false
            console.error("WebSocket 发生错误:", error)
            this.reconnect()
        }
    }

    reconnect() {
        if (this.reconnectLock) return
        this.reconnectLock = true

        this.reconnectTimer = setTimeout(() => {
            this.reconnectLock = false
            console.log("正在重连...")
            this.connect()
        }, 3000)
    }

    sendMessage(message) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(message)
            console.log("WebSocket 发送消息:", JSON.parse(message))
        } else {
            console.error("WebSocket 连接未打开，消息发送失败")
        }
    }

    close() {
        if (this.ws) {
            this.ws.close()
        }
    }

    del() {
        console.log("WebSocketManager 正在清理资源...")

        if (this.ws) {
            this.ws.onopen = null
            this.ws.onmessage = null
            this.ws.onclose = null
            this.ws.onerror = null
            this.ws.close()
            this.ws = null
        }

        clearTimeout(this.heartCheck.timeoutObj)
        clearTimeout(this.heartCheck.serverTimeoutObj)

        if (this.init_timeIntervalObj) {
            clearInterval(this.init_timeIntervalObj)
            this.init_timeIntervalObj = null
        }

        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer)
            this.reconnectTimer = null
        }

        console.log("WebSocketManager 资源清理完毕")
    }

    async quest_reboot() {
        this.sendRequest("reboot")
    }

    async update_user_config() {
        let payload = await this.sendRequest("update_user_config", { data: default_store.user_config })
        console.log("更新用户配置成功", payload)
        Object.assign(default_store.user_config, payload.data)
        set_ws_username(default_store.user_config.username)
        set_ws_password(default_store.user_config.password)
        set_mdns_host_name(default_store.user_config.mdns_host_name)
    }

    async reset_user_config() {
        let payload = await this.sendRequest("reset_user_config")
        console.log("重置用户配置成功", payload)
        Object.assign(default_store.user_config, payload.data)
        set_ws_username(default_store.user_config.username)
        set_ws_password(default_store.user_config.password)
        set_mdns_host_name(default_store.user_config.mdns_host_name)
    }

    async connect_wifi() {
        this.sendRequest('connect_wifi',
            {
                data:
                {
                    ssid: default_store.wifi_info.input_ssid,
                    password: default_store.wifi_info.input_password
                }
            })
    }

    async get_device_info() {
        let payload = await this.sendRequest('get_device_info')
        console.log("获取设备信息成功", payload)
        Object.assign(default_store.device_info, payload.data)
    }

    async get_user_config() {
        let payload = await this.sendRequest('get_user_config')
        console.log("获取用户配置成功", payload)
        Object.assign(default_store.user_config, payload.data)
        set_ws_username(default_store.user_config.username)
        set_ws_password(default_store.user_config.password)
        set_mdns_host_name(default_store.user_config.mdns_host_name)
    }

    async get_wifi_info() {
        let payload = await this.sendRequest('get_wifi_info')
        console.log("获取WiFi信息成功", payload)
        Object.assign(default_store.wifi_info, payload.data)
    }

    async get_wifi_list() {
        let payload = await this.sendRequest('get_wifi_list', {}, 10000)
        console.log("获取WiFi列表成功", payload)
        default_store.wifi_list = payload.data
    }

    async get_state_info() {
        let payload = await this.sendRequest('get_state_info')
        console.log("获取状态信息成功", payload)
        default_store.stat_data.task_list = payload.data.task_list.sort((a, b) => a.xTaskNumber - b.xTaskNumber)
        Object.assign(default_store.stat_data, payload.data)
    }

    async get_imu_data() {
        let payload = await this.sendRequest('get_imu_data')
        console.log("获取IMU数据成功", payload)
        Object.assign(default_store.imu_data, payload.data)
    }

    async reset_imu() {
        let payload = await this.sendRequest('reset_imu')
        console.log("重置IMU成功", payload)
    }

    _generateRequestId() {
        return `req_${Date.now()}_${this.requestCounter++}`
    }

    sendRequest(type, payload = {}, timeoutMs = 2000) {
        if (!default_store.wifi_info.isOnline) {
            return Promise.reject("设备离线")
        }
        const requestId = this._generateRequestId()
        const msg = { type, requestId, payload }

        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                this.pendingRequests.delete(requestId)
                reject("请求超时")
            }, timeoutMs)

            this.pendingRequests.set(requestId, { resolve, reject, timeout })

            try {
                this.ws.send(JSON.stringify(msg))
            } catch (e) {
                clearTimeout(timeout)
                this.pendingRequests.delete(requestId)
                reject("发送失败：" + e.message)
            }
        })
    }

    onMessage(type, handler) {
        this.messageHandlers.set(type, handler)
    }

}

export let wsmgr = new WebSocketManager()


const WsPlugin = {
    install(app) {
        app.config.globalProperties.$wsmgr = wsmgr
    }
}

export default WsPlugin
