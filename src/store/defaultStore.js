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

export const useDefaultStore = defineStore('default', () => {

    const wifi_info = reactive({
        isOnline: false,
        host: "",
        enable_custom_address: false,
        custom_address: "",
        wifi_mode: 0,
        SSID: "",
        BSSID: "",
        RSSI: 0,
        channel: 0,
        ip: "",
        gw: "",
        netmask: "",
        input_password: "",
        input_ssid: "",
    })

    const wifi_list = ref([])

    const device_info = reactive({
        dev_mode: false,
        compile_time: "",
        firmware_version: "",
        idf_version: "",
        git_commit_id: "",
        package_version: "",
        chip_version: "",
        cpu_freq: 0,
    })

    const stat_data = reactive({
        task_count: 0,
        task_list: [],
        total_free_bytes: 0,
        total_allocated_bytes: 0,
        largest_free_block: 0,
        minimum_free_bytes: 0,
    })

    const computed_data = reactive({
        package_version_str: computed(() => chipVersions[device_info.package_version]),
        chip_version_str: computed(() => `v${parseInt(device_info.chip_version / 100)}.${device_info.chip_version % 10}`),
        firmware_tree: computed(() => `https://github.com/xizeyoupan/esp-light/tree/${device_info.git_commit_id}`),
        cpu_freq_str: computed(() => `${device_info.cpu_freq / 1000000}Mhz`),
        used_men_percent: computed(() => {
            return (stat_data.total_allocated_bytes / (stat_data.total_allocated_bytes + stat_data.total_free_bytes) * 100).toFixed(2)
        }),
        free_men_percent: computed(() => {
            return (stat_data.total_free_bytes / (stat_data.total_allocated_bytes + stat_data.total_free_bytes) * 100).toFixed(2)
        }),
    })

    const user_config = reactive({
        up_key_gpio_num: 0,
        down_key_gpio_num: 0,
        mpu_sda_gpio_num: 0,
        mpu_scl_gpio_num: 0,
        ws2812_gpio_num: 0,

        username: "",
        password: "",
        mdns_host_name: "",
        wifi_ap_ssid: "",
        wifi_ap_pass: "",
        wifi_ssid: "",
        wifi_pass: "",
        wifi_scan_list_size: 0,
        wifi_connect_max_retry: 0,
        ws_recv_buf_size: 0,
        ws_send_buf_size: 0,
        msg_buf_recv_size: 0,
        msg_buf_send_size: 0,

        button_period_ms: 0,

        mpu_command_buf_size: 0,
        mpu_one_shot_max_sample_size: 0,
        mpu_buf_out_to_cnn_size: 0,

    })

    const imu_data = reactive({
        roll: 0,
        pitch: 0,
        yaw: 0,
        ax: 0,
        ay: 0,
        az: 0,
        gx: 0,
        gy: 0,
        gz: 0,
    })

    const dataset_data_view = ref(new DataView(new ArrayBuffer(0)))

    return {
        wifi_list, wifi_info, device_info, computed_data, stat_data, user_config, imu_data, dataset_data_view
    }
})
