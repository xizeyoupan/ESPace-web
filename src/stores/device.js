import { defineStore } from 'pinia'
import { ref, computed, reactive } from 'vue'


const chipVersions = [
  "ESP32D0WDQ6",
  "ESP32D0WDQ5",
  "ESP32D2WDQ5",
  "ESP32PICOD2", // Deprecated
  "ESP32U4WDH",
  "ESP32PICOD4",
  "ESP32PICOV302",
  "ESP32D0WDR2V3"
]

export const useDeviceStore = defineStore('device', () => {

  const imu_data = reactive({
    roll: ref(0),
    pitch: ref(0)
  })
  const wsmgr = reactive({ instance: null })

  const wifi_info = reactive({
    isOnline: ref(false),
    host: ref(""),
    use_user_host: ref(""),
    user_host: ref(""),
    sta_ssid: ref(""),
    sta_pass: ref(""),
  })

  const device_info = reactive({
    dev_mode: ref(false),
    compile_time: ref(""),
    firmware_version: ref(""),
    idf_version: ref(""),
    git_commit_id: ref(""),
    package_version: ref(""),
    chip_version: ref(""),
    cpu_freq: ref(0),
  })

  const stat_data = reactive({
    task_list: ref([]),
    total_free_bytes: ref(0),
    ws_bytes_available: ref(0),
    minimum_free_bytes: ref(0),
    largest_free_block: ref(0),
    total_allocated_bytes: ref(0),
    task_list_order_column: ref("task_number"),
    task_list_order: ref(true),
  })

  const computed_data = reactive({
    package_version_str: computed(() => chipVersions[device_info.package_version]),
    chip_version_str: computed(() => `v${device_info.chip_version / 100}.${device_info.chip_version / 10 % 10}`),
    firmware_tree: computed(() => `https://github.com/xizeyoupan/magic-wand/tree/${device_info.git_commit_id}`),
    cpu_freq_str: computed(() => `${device_info.cpu_freq / 1000000}Mhz`),
    used_men_percent: computed(() => {
      return (stat_data.total_allocated_bytes / (stat_data.total_allocated_bytes + stat_data.total_free_bytes) * 100).toFixed(2)
    }),
    free_men_percent: computed(() => {
      return (stat_data.total_free_bytes / (stat_data.total_allocated_bytes + stat_data.total_free_bytes) * 100).toFixed(2)
    }),
  })

  const sort_task_list = () => {
    let task_list_order_column = stat_data.task_list_order_column
    stat_data.task_list.sort((a, b) => {
      if (task_list_order_column === "task_number") {
        return stat_data.task_list_order ? a.task_number - b.task_number : b.task_number - a.task_number
      } else if (task_list_order_column === "task_name") {
        return stat_data.task_list_order ? a.task_name.localeCompare(b.task_name) : b.task_name.localeCompare(a.task_name)
      } else if (task_list_order_column === "task_state") {
        return stat_data.task_list_order ? a.task_state - b.task_state : b.task_state - a.task_state
      } else if (task_list_order_column === "stack_water_mark") {
        return stat_data.task_list_order ? a.stack_water_mark - b.stack_water_mark : b.stack_water_mark - a.stack_water_mark
      } else {
        return 0
      }
    })
  }

  const user_config = reactive({
    ws2812_gpio_num: reactive({ data: ref(-1), display: true, type: 'number' }),
    mpu_sda_gpio_num: reactive({ data: ref(-1), display: true, type: 'number' }),
    mpu_scl_gpio_num: reactive({ data: ref(-1), display: true, type: 'number' }),
    enable_imu_det: reactive({ data: ref(0), display: false, type: 'number' }),
  })

  const log_text_list = ref([])

  return {
    wifi_info, device_info, computed_data, wsmgr, imu_data, stat_data, sort_task_list, user_config, log_text_list
  }
})
