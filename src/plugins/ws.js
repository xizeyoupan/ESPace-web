import { toast } from './toast.js'
import { useInfoStore } from '../store/infoStore.js'
import { useCNNStore } from '../store/CNNStore.js'
import { i18n } from '../i18n.js'
import pinia from '../store/index.js'
import { get_ws_username, get_ws_password, set_ws_username, set_ws_password, set_mdns_host_name } from '../util.js'

const info_store = useInfoStore(pinia)
const CNN_store = useCNNStore(pinia)
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
        info_store.device_info.cpu_freq = 0

        this.init_timeIntervalObj = setInterval(() => {
            if (info_store.device_info.cpu_freq && info_store.user_config.username) {
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
            info_store.wifi_info.isOnline = true
            this.heartCheck.start()
        }

        this.ws.onmessage = (event) => {
            info_store.wifi_info.isOnline = true
            this.heartCheck.reset()

            if (event.data instanceof ArrayBuffer) {
                let view = new DataView(event.data)
                const data_type = view.getFloat32(0)

                switch (data_type) {
                case 0:
                    let dataset_size = view.getFloat32(4, true)
                    CNN_store.dataset_data_view = view
                    console.log("dataset_size: ", dataset_size, "total_get: ", event.data.byteLength)
                    break
                default:
                    console.warn("未知数据类型:", data_type)
                    console.log("event.data:", event.data)
                    console.log("size:", event.data.byteLength)
                    break
                }

            } else {
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

        }

        this.ws.onclose = () => {
            info_store.wifi_info.isOnline = false
            console.log("WebSocket 连接关闭，尝试重连...")
            this.reconnect()
        }

        this.ws.onerror = (error) => {
            info_store.wifi_info.isOnline = false
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
        let payload = await this.sendRequest("update_user_config", { data: info_store.user_config })
        console.log("更新用户配置成功", payload)
        Object.assign(info_store.user_config, payload.data)
        set_ws_username(info_store.user_config.username)
        set_ws_password(info_store.user_config.password)
        set_mdns_host_name(info_store.user_config.mdns_host_name)
    }

    async reset_user_config() {
        let payload = await this.sendRequest("reset_user_config")
        console.log("重置用户配置成功", payload)
        Object.assign(info_store.user_config, payload.data)
        set_ws_username(info_store.user_config.username)
        set_ws_password(info_store.user_config.password)
        set_mdns_host_name(info_store.user_config.mdns_host_name)
    }

    async connect_wifi() {
        this.sendRequest('connect_wifi',
            {
                data:
                {
                    ssid: info_store.wifi_info.input_ssid,
                    password: info_store.wifi_info.input_password
                }
            })
    }

    async get_device_info() {
        let payload = await this.sendRequest('get_device_info')
        console.log("获取设备信息成功", payload)
        Object.assign(info_store.device_info, payload.data)
    }

    async get_user_config() {
        let payload = await this.sendRequest('get_user_config')
        console.log("获取用户配置成功", payload)
        Object.assign(info_store.user_config, payload.data)
        set_ws_username(info_store.user_config.username)
        set_ws_password(info_store.user_config.password)
        set_mdns_host_name(info_store.user_config.mdns_host_name)
    }

    async get_wifi_info() {
        let payload = await this.sendRequest('get_wifi_info')
        console.log("获取WiFi信息成功", payload)
        Object.assign(info_store.wifi_info, payload.data)
    }

    async get_wifi_list() {
        let payload = await this.sendRequest('get_wifi_list', {}, 10000)
        console.log("获取WiFi列表成功", payload)
        info_store.wifi_list = payload.data
    }

    async get_state_info() {
        let payload = await this.sendRequest('get_state_info')
        console.log("获取状态信息成功", payload)
        info_store.stat_data.task_list = payload.data.task_list.sort((a, b) => a.xTaskNumber - b.xTaskNumber)
        Object.assign(info_store.stat_data, payload.data)
    }

    async get_imu_data() {
        let payload = await this.sendRequest('get_imu_data')
        console.log("获取IMU数据成功", payload)
        Object.assign(info_store.imu_data, payload.data)
    }

    async reset_imu() {
        let payload = await this.sendRequest('reset_imu')
        console.log("重置IMU成功", payload)
    }

    async get_mpu_data_row(data) {
        let payload = await this.sendRequest('get_mpu_data_row', { data })
        console.log("请求MPU采集成功", payload)
    }

    async get_mpu_data_row_stop() {
        let payload = await this.sendRequest('get_mpu_data_row_stop')
        console.log("停止MPU采集成功", payload)
    }

    async get_file_list() {
        let payload = await this.sendRequest('get_file_list')
        console.log("获得file列表成功", payload)
        return payload
    }

    async get_ledc_timer_config(data) {
        let payload = await this.sendRequest('get_ledc_timer_config', { data })
        console.log("获得LED定时器配置成功", payload)
        return payload
    }

    async set_ledc_timer_config(data) {
        let payload = await this.sendRequest('set_ledc_timer_config', { data })
        console.log("设置LED定时器配置成功", payload)
        return payload
    }

    async get_ledc_channel_config(data) {
        let payload = await this.sendRequest('get_ledc_channel_config', { data })
        console.log("获得LED通道配置成功", payload)
        return payload
    }

    async clear_ledc_channel_config(data) {
        let payload = await this.sendRequest('clear_ledc_channel_config', { data })
        console.log("释放LED通道配置成功", payload)
        return payload
    }

    async set_ledc_channel_config(data) {
        let payload = await this.sendRequest('set_ledc_channel_config', { data })
        console.log("设置LED通道配置成功", payload)
        return payload
    }

    async start_predict(data) {
        let payload = await this.sendRequest('start_predict', { data })
        console.log("start_predict成功", payload)
    }

    async stop_predict(data) {
        let payload = await this.sendRequest('stop_predict', { data })
        console.log("stop_predict成功", payload)
    }

    async modify_model(data) {
        let payload = await this.sendRequest('modify_model', { data })
        console.log("modify_model成功", payload)
    }

    async get_dac_cosine_config(data) {
        let payload = await this.sendRequest('get_dac_cosine_config', { data })
        console.log("获取正弦通道配置成功", payload)
        return payload
    }

    async clear_dac_cosine_channel(data) {
        let payload = await this.sendRequest('clear_dac_cosine_channel', { data })
        console.log("清除正弦通道配置成功", payload)
        return payload
    }

    async set_dac_cosine_channel(data) {
        let payload = await this.sendRequest('set_dac_cosine_channel', { data })
        console.log("设置正弦通道配置成功", payload)
        return payload
    }

    _generateRequestId() {
        return `req_${Date.now()}_${this.requestCounter++}`
    }

    sendRequest(type, payload = {}, timeoutMs = 2000) {
        if (!info_store.wifi_info.isOnline) {
            return Promise.reject("设备离线")
        } else if (this.ws.readyState !== WebSocket.OPEN) {
            return Promise.reject("WebSocket未连接")
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
