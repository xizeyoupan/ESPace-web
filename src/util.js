import { storeToRefs } from 'pinia'
import { ref, toRef, toRefs } from 'vue'
import { api } from './api.js'

class WebSocketManager {
  constructor(url, device) {
    this.url = url
    this.wifi_info = storeToRefs(device.wifi_info)
    this.imu_data = storeToRefs(device.imu_data)
    this.ws = null
    this.heartCheck = {
      timeout: 2000, // 2s
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
            this.ws.send("HeartBeat")
            this.heartCheck.serverTimeoutObj = setTimeout(() => {
              this.ws.close() // 关闭 WebSocket
            }, this.heartCheck.timeout)
          }
        }, this.heartCheck.timeout)
      },
    }
    this.connect()
  }

  connect() {
    this.del()
    this.ws = new WebSocket(this.url)
    this.ws.binaryType = "arraybuffer"

    this.ws.onopen = () => {
      console.log("WebSocket 连接成功")
      this.wifi_info.isOnline.value = true
      this.heartCheck.start()
    }

    this.ws.onmessage = (event) => {
      this.wifi_info.isOnline.value = true
      console.log("收到消息:", event.data)
      this.heartCheck.reset()

      let view = new DataView(event.data)
      let roll = ref(view.getFloat32(1, true))
      let pitch = ref(view.getFloat32(5, true))
      this.imu_data.roll.value = roll
      this.imu_data.pitch.value = pitch
    }

    this.ws.onclose = () => {
      this.wifi_info.isOnline.value = false
      console.log("WebSocket 连接关闭，尝试重连...")
      this.reconnect()
    }

    this.ws.onerror = (error) => {
      this.wifi_info.isOnline.value = false
      console.error("WebSocket 发生错误:", error)
      this.reconnect()
    }
  }

  reconnect() {
    setTimeout(() => {
      console.log("正在重连...")
      this.connect()
    }, 1000) // 1秒后重连
  }

  sendMessage(message) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(message)
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
      this.ws.close() // 关闭 WebSocket
    }

    clearTimeout(this.heartCheck.timeoutObj)
    clearTimeout(this.heartCheck.serverTimeoutObj)
    this.ws = null

    console.log("WebSocketManager 资源清理完毕")
  }
}

const get_host_from_fetch = async (device, resp_promise) => {
  const { wifi_info } = storeToRefs(device)

  let resp = await resp_promise
  let resp_host = resp.url.slice(0, -7)
  resp = await resp.text()

  if (resp === '0721esp32wand') {
    wifi_info.value.host = resp_host
  } else {
    throw new Error(`${resp_host} is Not wand`)
  }
}

export const connect_device = async (device, message) => {
  const { wifi_info, wsmgr } = storeToRefs(device)

  const mdns_fetch = api.get("http://wand-esp32/whoami")
  const ipv4_fetch = api.get("http://192.168.4.1/whoami")
  const user_config_fetch = api.get(wifi_info.value.user_host ? `http://${wifi_info.value.user_host}/whoami` : 'http://localhost',)
  try {
    await Promise.any([
      get_host_from_fetch(device, mdns_fetch),
      get_host_from_fetch(device, ipv4_fetch),
      get_host_from_fetch(device, user_config_fetch),
    ])
    // console.log(host.value.slice(7))
    if (wsmgr.value.instance) {
      wsmgr.value.instance.del()
    }
    wsmgr.value.instance = new WebSocketManager(`ws://${wifi_info.value.host.slice(7)}/ws`, device)
    message.success("连接成功")
  } catch (error) {
    console.warn(error)
  }
}

export const check_not_oline = (device, message) => {
  const { wifi_info } = storeToRefs(device)
  if (!wifi_info.value.isOnline) {
    message.error('设备不在线，请重新连接')
    console.log('设备不在线，请重新连接')
    return true
  }

  return false
}

export const sleep_ms = async (ms) => {
  await new Promise(resolve => setTimeout(resolve, ms))
}