import { storeToRefs } from 'pinia'
import { api } from './api.js'
import { resolveComponent } from 'vue'

class WebSocketManager {
  constructor(url, device) {
    this.url = url
    this.isOnline = storeToRefs(device).isOnline
    this.ws = null
    this.heartCheck = {
      timeout: 10000, // 10秒
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
    this.ws = new WebSocket(this.url)

    this.ws.onopen = () => {
      console.log("WebSocket 连接成功")
      this.isOnline.value = true
      this.heartCheck.start()
    }

    this.ws.onmessage = (event) => {
      this.isOnline.value = true
      console.log("收到消息:", event.data)
      this.heartCheck.reset()
    }

    this.ws.onclose = () => {
      this.isOnline.value = false
      console.log("WebSocket 连接关闭，尝试重连...")
      this.reconnect()
    }

    this.ws.onerror = (error) => {
      this.isOnline.value = false
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
  const { isOnline, host } = storeToRefs(device)

  let resp = await resp_promise
  let resp_host = resp.url.slice(0, -7)
  resp = await resp.text()

  if (resp === '0721esp32wand') {
    host.value = resp_host
  } else {
    throw new Error(`${resp_host} is Not wand`)
  }
}

export const connect_device = async (device, message) => {
  const { isOnline, user_host, host, wsmgr } = storeToRefs(device)

  const mdns_fetch = api.get("http://wand-esp32/whoami")
  const ipv4_fetch = api.get("http://192.168.4.1/whoami")
  const user_config_fetch = api.get(user_host.value ? `http://${user_host.value}/whoami` : 'http://localhost',)
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
    wsmgr.value.instance = new WebSocketManager(`ws://${host.value.slice(7)}/ws`, device)
    message.success("连接成功")
  } catch (error) {
    console.warn(error)
  }
}

export const check_not_oline = (device, message) => {
  const { isOnline } = storeToRefs(device)
  if (!isOnline.value) {
    message.error('设备不在线，请重新连接')
    console.log('设备不在线，请重新连接')
    return true
  }

  return false
}

export const sleep_ms = async (ms) => {
  await new Promise(resolve => setTimeout(resolve, ms))
}