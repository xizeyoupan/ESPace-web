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
    compile_time: ref(""),
    firmware_version: ref(""),
    idf_version: ref(""),
    git_commit_id: ref(""),
    package_version: ref(""),
    chip_version: ref(""),
    cpu_freq: ref(0),
  })

  const computed_data = reactive({
    package_version_str: computed(() => chipVersions[device_info.package_version]),
    chip_version_str: computed(() => `v${device_info.chip_version / 100}.${device_info.chip_version / 10 % 10}`),
    firmware_tree: computed(() => `https://github.com/xizeyoupan/magic-wand/tree/${device_info.git_commit_id}`),
    cpu_freq_str: computed(() => `${device_info.cpu_freq / 1000000}Mhz`),
  })

  return {
    wifi_info, device_info, computed_data, wsmgr, imu_data
  }
})
