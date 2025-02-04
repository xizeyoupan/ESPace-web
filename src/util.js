import { storeToRefs } from 'pinia'
import { reactive, ref, toRef, toRefs } from 'vue'
import { api } from './api.js'

class WebSocketManager {
  constructor(url, device) {
    this.url = url
    this.device = device
    this.wifi_info = storeToRefs(device.wifi_info)
    this.imu_data = storeToRefs(device.imu_data)
    this.stat_data = storeToRefs(device.stat_data)
    this.user_config = storeToRefs(device.user_config)
    this.ws = null
    this.heartCheck = {
      timeout: 3000,
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

      this.get_config()
    }

    this.ws.onmessage = (event) => {
      this.wifi_info.isOnline.value = true
      // console.log("收到消息:", event.data)
      this.heartCheck.reset()

      if (event.data instanceof ArrayBuffer) {
        let view = new DataView(event.data)
        const data_type = view.getUint8(0)

        switch (data_type) {
        case 0x00: // User config
          this.user_config.ws2812_gpio_num.value.data = ref(view.getUint32(1, true))
          this.user_config.mpu_sda_gpio_num.value.data = ref(view.getUint32(5, true))
          this.user_config.mpu_scl_gpio_num.value.data = ref(view.getUint32(9, true))
          this.user_config.enable_imu.value.data = ref(view.getUint8(13))
          this.user_config.enable_imu_det.value.data = ref(view.getUint8(14))
          let received_config = Object.assign({}, this.user_config)
          for (let key in received_config) {
            received_config[key] = received_config[key].value.data
          }
          console.log("get config:", received_config)
          break
        case 0x01: // IMU Data
          let roll = ref(view.getFloat32(1, true))
          let pitch = ref(view.getFloat32(5, true))
          this.imu_data.roll.value = roll
          this.imu_data.pitch.value = pitch
          break
        case 0x02: // Stat Info
          // 1 byte: STAT_DATA_PREFIX
          // 1 bytes: task_count

          // 1 byte: task_name_length
          // n bytes: task_name
          // 1 byte: task_number
          // 1 byte: task_state
          // 2 bytes: stack_water_mark

          // 4 bytes: total_free_bytes
          // 4 bytes: total_allocated_bytes
          // 4 bytes: largest_free_block
          // 4 bytes: minimum_free_bytes
          // 2 bytes: ws_bytes_available

          let data_index = 1
          let task_count = view.getUint8(data_index)
          data_index += 1
          // console.log("task_count:", task_count)
          this.stat_data.task_list.value.length = 0
          for (let i = 0; i < task_count; i++) {

            const task_item = reactive({
              task_name: ref(""),
              task_number: ref(0),
              task_state: ref(0),
              stack_water_mark: ref(0)
            })

            let task_name_length = view.getUint8(data_index)
            data_index += 1
            task_item.task_name = new TextDecoder().decode(new Uint8Array(event.data, data_index, task_name_length))
            data_index += task_name_length
            task_item.task_number = view.getUint8(data_index)
            data_index += 1
            task_item.task_state = view.getUint8(data_index)
            data_index += 1
            task_item.stack_water_mark = view.getUint16(data_index, true)
            data_index += 2

            // console.log("task_name:", task_item.task_name, "task_number:", task_item.task_number, "task_state:", task_item.task_state, "stack_water_mark:", task_item.stack_water_mark)

            this.stat_data.task_list.value.push(task_item)
          }

          this.device.sort_task_list()

          this.stat_data.total_free_bytes.value = view.getUint32(data_index, true)
          data_index += 4
          this.stat_data.total_allocated_bytes.value = view.getUint32(data_index, true)
          data_index += 4
          this.stat_data.largest_free_block.value = view.getUint32(data_index, true)
          data_index += 4
          this.stat_data.minimum_free_bytes.value = view.getUint32(data_index, true)
          data_index += 4
          this.stat_data.ws_bytes_available.value = view.getUint16(data_index, true)
          data_index += 2
          // console.log("total_free_bytes:", this.stat_data.total_free_bytes.value, "total_allocated_bytes:", this.stat_data.total_allocated_bytes.value, "largest_free_block:", this.stat_data.largest_free_block.value, "minimum_free_bytes:", this.stat_data.minimum_free_bytes.value, "ws_bytes_available:", this.stat_data.ws_bytes_available.value)
          break
        default:
          console.warn("未知数据类型:", data_type)
          console.log("event.data:", event.data)
          break
        }
      }
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

  commit_config() {
    console.log(this.user_config.ws2812_gpio_num.data)
    let view = new DataView(new ArrayBuffer(15))
    view.setUint8(0, 0x01)
    view.setUint32(1, this.user_config.ws2812_gpio_num.data, true)
    view.setUint32(5, this.user_config.mpu_sda_gpio_num.data, true)
    view.setUint32(9, this.user_config.mpu_scl_gpio_num.data, true)
    view.setUint8(13, this.user_config.enable_imu.data)
    view.setUint8(14, this.user_config.enable_imu_det.data)
    console.log("commit config:", view)
    this.sendMessage(view.buffer)
  }

  get_config() {
    let view = new DataView(new ArrayBuffer(1))
    view.setUint8(0, 0x00)
    this.sendMessage(view.buffer)
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

  const mdns_fetch = api.get("http://wand-esp32/whoami", { timeout: 2000 })
  const ipv4_fetch = api.get("http://192.168.4.1/whoami", { timeout: 2000 })
  const user_config_fetch = api.get(wifi_info.value.user_host ? `http://${wifi_info.value.user_host}/whoami` : 'http://localhost', { timeout: 2000 })
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