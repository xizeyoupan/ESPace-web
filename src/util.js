import { storeToRefs } from 'pinia'
import { reactive, ref, toRef, toRefs } from 'vue'
import { api } from './api.js'
import { AnsiUp } from 'ansi_up'

const ansi_up = new AnsiUp()

const FETCHED_USER_CONFIG_DATA_PREFIX = 0x00
const FETCHED_WS_IMU_DATA_PREFIX = 0x01
const FETCHED_STAT_DATA_PREFIX = 0x02
const FETCHED_LOG_DATA_PREFIX = 0x03
const FETCHED_DATASET_DATA_PREFIX = 0x04

const COMMIT_GET_USER_CONFIG_DATA_PREFIX = 0x00
const COMMIT_SET_USER_CONFIG_DATA_PREFIX = 0x01
const COMMIT_RESET_USER_CONFIG_DATA_PREFIX = 0x02
const COMMIT_RESET_IMU_PREFIX = 0x03
const COMMIT_READY_TO_SCAN = 0x04

class WebSocketManager {
  constructor(url, device) {
    this.url = url
    this.device = device
    this.wifi_info = storeToRefs(device.wifi_info)
    this.imu_data = storeToRefs(device.imu_data)
    this.stat_data = storeToRefs(device.stat_data)
    this.user_config = storeToRefs(device.user_config)
    this.log_text_list = storeToRefs(device).log_text_list
    this.dataset_data_view = storeToRefs(device).dataset_data_view

    this.ws = null
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
          case FETCHED_USER_CONFIG_DATA_PREFIX: // load user config
            this.user_config.ws2812_gpio_num.value.data = ref(view.getUint32(1, true))
            this.user_config.mpu_sda_gpio_num.value.data = ref(view.getUint32(5, true))
            this.user_config.mpu_scl_gpio_num.value.data = ref(view.getUint32(9, true))
            this.user_config.enable_imu_det.value.data = ref(view.getUint8(13))
            this.user_config.enable_ws_log.value.data = ref(view.getUint8(14))
            let received_config = Object.assign({}, this.user_config)
            for (let key in received_config) {
              received_config[key] = received_config[key].value.data
            }
            console.log("get config:", received_config)
            break
          case FETCHED_WS_IMU_DATA_PREFIX: // IMU Data
            let roll = ref(view.getFloat32(1, true))
            let pitch = ref(view.getFloat32(5, true))
            let ax = ref(view.getFloat32(9, true))
            let ay = ref(view.getFloat32(13, true))
            let az = ref(view.getFloat32(17, true))
            let gx = ref(view.getFloat32(21, true))
            let gy = ref(view.getFloat32(25, true))
            let gz = ref(view.getFloat32(29, true))
            this.imu_data.roll.value = roll
            this.imu_data.pitch.value = pitch
            this.imu_data.ax.value = ax
            this.imu_data.ay.value = ay
            this.imu_data.az.value = az
            this.imu_data.gx.value = gx
            this.imu_data.gy.value = gy
            this.imu_data.gz.value = gz
            break
          case FETCHED_STAT_DATA_PREFIX: // Stat Info
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
            // console.log("total_free_bytes:", this.stat_data.total_free_bytes.value, "total_allocated_bytes:", this.stat_data.total_allocated_bytes.value, "largest_free_block:", this.stat_data.largest_free_block.value, "minimum_free_bytes:", this.stat_data.minimum_free_bytes.value, "ws_bytes_available:", this.stat_data.ws_bytes_available.value)
            break
          case FETCHED_LOG_DATA_PREFIX:
            let log_line = new TextDecoder().decode(new Uint8Array(event.data, 1, event.data.byteLength - 1))
            // console.log(log_line)
            this.log_text_list.value.push(ansi_up.ansi_to_html(log_line))
            break
          case FETCHED_DATASET_DATA_PREFIX:
            let dataset_size = view.getUint32(1, true)
            this.dataset_data_view.value = view
            console.log("dataset_size: ", dataset_size, "total_get: ", event.data.byteLength)
            break
          default:
            console.warn("未知数据类型:", data_type)
            console.log("event.data:", event.data)
            console.log("size:", event.data.byteLength)
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
    let view = new DataView(new ArrayBuffer(15))
    view.setUint8(0, COMMIT_SET_USER_CONFIG_DATA_PREFIX)
    view.setUint32(1, this.user_config.ws2812_gpio_num.data, true)
    view.setUint32(5, this.user_config.mpu_sda_gpio_num.data, true)
    view.setUint32(9, this.user_config.mpu_scl_gpio_num.data, true)
    view.setUint8(13, this.user_config.enable_imu_det.data)
    view.setUint8(14, this.user_config.enable_ws_log.data)
    console.log("commit config:", view)
    this.sendMessage(view.buffer)
  }

  get_config() {
    let view = new DataView(new ArrayBuffer(1))
    view.setUint8(0, COMMIT_GET_USER_CONFIG_DATA_PREFIX)
    this.sendMessage(view.buffer)
  }

  reset_config() {
    let view = new DataView(new ArrayBuffer(1))
    view.setUint8(0, COMMIT_RESET_USER_CONFIG_DATA_PREFIX)
    this.sendMessage(view.buffer)
    console.log("reset config")
  }

  reset_imu() {
    let view = new DataView(new ArrayBuffer(1))
    view.setUint8(0, COMMIT_RESET_IMU_PREFIX)
    this.sendMessage(view.buffer)
    console.log("reset imu")
  }

  ready_to_scan_imu_data(model) {
    let view = new DataView(new ArrayBuffer(6))
    view.setUint8(0, COMMIT_READY_TO_SCAN)
    view.setUint8(1, model.type)
    view.setUint16(2, model.sample_tick)
    view.setUint16(4, model.sample_size)
    this.sendMessage(view.buffer)
    console.log("ready_to_scan_imu_data")
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
  } catch (error) {
    console.warn(error)
  } finally {
    if (wifi_info.value.host) {
      message.success("连接成功")
    } else {
      message.warning("连接失败")
    }
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