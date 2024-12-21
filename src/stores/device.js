import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

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
    const isOnline = ref(false)
    const host = ref("")
    const use_user_host = ref(false)
    const user_host = ref("")
    const repo_id = ref(0)
    const latest_tag_name = ref("")
    const sha = ref("")
    const compile_time = ref("")
    const firmware_version = ref("")
    const idf_version = ref("")
    const git_commit_id = ref("")
    const package_version = ref(0)
    const chip_version = ref(0)
    const cpu_freq = ref(0)

    const package_version_str = computed(() => chipVersions[package_version.value])
    const chip_version_str = computed(() => `v${chip_version.value / 100}.${chip_version.value / 10 % 10}`)
    const cpu_freq_str = computed(() => `${cpu_freq.value / 1000000}Mhz`)
    const firmware_tree = computed(() => `https://github.com/xizeyoupan/magic-wand/tree/${git_commit_id.value}`)

    return {
        isOnline, host, use_user_host, user_host, repo_id, latest_tag_name, sha, git_commit_id,
        compile_time, firmware_version, idf_version, package_version, chip_version, cpu_freq,
        package_version_str, chip_version_str, cpu_freq_str, firmware_tree
    }
})
