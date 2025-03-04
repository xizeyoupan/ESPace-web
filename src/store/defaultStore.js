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

  const wsmgr = reactive({})

  const wifi_info = reactive({
    isOnline: false,
    host: "",
    use_user_host: "",
    user_host: "",
    sta_ssid: "",
    sta_pass: "",
  })

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
    task_list: [],
    total_free_bytes: 0,
    ws_bytes_available: 0,
    minimum_free_bytes: 0,
    largest_free_block: 0,
    total_allocated_bytes: 0,
    task_list_order_column: "task_number",
    task_list_order: true,
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
    ws2812_gpio_num: { data: -1, display: true, type: 'number' },
    mpu_sda_gpio_num: { data: -1, display: true, type: 'number' },
    mpu_scl_gpio_num: { data: -1, display: true, type: 'number' },
    enable_imu_det: { data: 0, display: false, type: 'number' },
    enable_ws_log: { data: 0, display: true, type: 'number' },
  })

  const log_text_list = ref([])
  const dataset_data_view = ref(null)
  const model_code = ref(`
      // 添加第一个 1D 卷积层
      model.add(tf.layers.conv1d({
          inputShape: [dataset.sample_size, 6],  // 输入数据的形状
          filters: 18,  // 卷积核的数量
          kernelSize: 3,  // 卷积核的大小
          activation: 'relu',  // 激活函数
      }))

      // 添加池化层
      model.add(tf.layers.maxPooling1d({
          poolSize: 2,  // 池化窗口大小
      }))

      // 添加第二个卷积层
      model.add(tf.layers.conv1d({
          filters: 36,  // 卷积核数量
          kernelSize: 3,
          activation: 'relu',
      }))

      // 添加池化层
      model.add(tf.layers.maxPooling1d({
          poolSize: 2,
      }))

      // 扁平化层，将 2D 输出转为 1D
      model.add(tf.layers.flatten())

      // 添加全连接层
      model.add(tf.layers.dense({
          units: 512,  // 隐藏层的神经元数
          activation: 'relu',
      }))

      // 添加全连接层
      model.add(tf.layers.dense({
          units: 128,  // 隐藏层的神经元数
          activation: 'relu',
      }))

      // 输出层
      model.add(tf.layers.dense({
          units: dataset.item_types.length,  // 分类
          activation: 'softmax',  // 使用 softmax 激活函数
      }))

      // 编译模型
      model.compile({
          optimizer: tf.train.adam(0.0001),
          loss: 'sparseCategoricalCrossentropy',
          metrics: ['accuracy'],
      })

      trainModel = async () => {
          await model.fit(X_train, Y_train, {
              callbacks: tfvis.show.fitCallbacks(container, ['loss', 'acc', 'val_loss', 'val_acc'], { callbacks: ['onEpochEnd'] }),
              shuffle: true,
              // batchSize: 10,
              epochs: 20,  // 设置训练轮数
              validationData: [X_val, Y_val],  // 使用验证集进行验证
          })
      }
    `)

  return {
    wifi_info, device_info, computed_data, wsmgr, imu_data, stat_data, sort_task_list, user_config, log_text_list, dataset_data_view, model_code
  }
})
