<script setup>
import { ref, nextTick, h, reactive, computed, watchEffect, watch } from 'vue'
import { useDefaultStore } from '../store/defaultStore.js'
import ConfirmDialog from '../components/ConfirmDialog.vue'
import { toggle_visor, train, save_model } from '../cnn.js'
import { wsmgr } from '../plugins/ws.js'
import { i18n } from '../i18n.js'
import { toast } from '../plugins/toast.js'
import { calColor, calcXORChecksum, formatDate } from '../util.js'
const t = i18n.global.t

const confirmRef = ref()

const currentPage = ref(1)
const pageSize = 10

const pagedItems = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return new_dataset.items.slice(start, start + pageSize)
})

const totalPages = computed(() => {
  return Math.ceil(new_dataset.items.length / pageSize)
})

const goPrev = () => {
  if (currentPage.value > 1) currentPage.value--
}

const goNext = () => {
  if (currentPage.value < totalPages.value) currentPage.value++
}

const typeCurrentPage = ref(1)
const typePageSize = 10

const pagedItemTypes = computed(() => {
  const start = (typeCurrentPage.value - 1) * typePageSize
  return new_dataset.item_types.slice(start, start + typePageSize)
})

const typeTotalPages = computed(() => {
  return Math.ceil(new_dataset.item_types.length / typePageSize)
})

const typeGoPrev = () => {
  if (typeCurrentPage.value > 1) typeCurrentPage.value--
}

const typeGoNext = () => {
  if (typeCurrentPage.value < typeTotalPages.value) typeCurrentPage.value++
}

const model_code = ref(`
// 添加第一个 1D 卷积层
model.add(tf.layers.conv1d({
    batchInputShape : [1, 6, dataset.sample_size],  // 输入数据的形状
    filters: dataset.item_types.length,  // 卷积核的数量
    kernelSize: 3,  // 卷积核的大小
    activation: 'relu',  // 激活函数
}))

// 添加池化层
model.add(tf.layers.maxPooling1d({
    poolSize: 2,  // 池化窗口大小
}))

// 扁平化层，将 2D 输出转为 1D
model.add(tf.layers.flatten())

// 添加全连接层
model.add(tf.layers.dense({
    units: dataset.item_types.length * 2,  // 隐藏层的神经元数
    activation: 'relu',
}))

// 输出层
model.add(tf.layers.dense({
    units: dataset.item_types.length,  // 分类
    activation: 'softmax',  // 使用 softmax 激活函数
}))

// 编译模型
model.compile({
    optimizer: tf.train.adam(0.002),
    loss: 'sparseCategoricalCrossentropy',
    metrics: ['accuracy'],
})

trainModel = async () => {
    await model.fit(X_train, Y_train, {
        callbacks: tfvis.show.fitCallbacks(container, ['loss', 'acc', 'val_loss', 'val_acc'], { callbacks: ['onEpochEnd'] }),
        shuffle: true,
        //batchSize: 20,
        epochs: 100,  // 设置训练轮数
        validationData: [X_val, Y_val],  // 使用验证集进行验证
    })
}
    `)

const default_store = useDefaultStore()

const nav = ref("")
const record_ready = ref(false)
const checked_model_type_id = ref(null)

const new_dataset = reactive(
  {
    id: "",
    desc: "",
    type: null,
    sample_tick: null, //采样间隔
    sample_size: null, //采样数量
    protion: {
      train: 3,
      validation: 1,
      test: 1
    },
    item_types: [],
    items: [],
  }
)

watch(
  () => default_store.dataset_data_view,
  (newVal, oldVal) => {

    if (checked_model_type_id.value === null) {
      console.warn("请先选择模型类型")
      return
    }

    let dataset_size = default_store.dataset_data_view.getFloat32(4, true)
    let ax = []
    let ay = []
    let az = []
    let gx = []
    let gy = []
    let gz = []
    for (let i = 0; i < dataset_size; i++) {
      ax.push(default_store.dataset_data_view.getFloat32(8 + (0 * dataset_size + i) * 4, true))
      ay.push(default_store.dataset_data_view.getFloat32(8 + (1 * dataset_size + i) * 4, true))
      az.push(default_store.dataset_data_view.getFloat32(8 + (2 * dataset_size + i) * 4, true))
      gx.push(default_store.dataset_data_view.getFloat32(8 + (3 * dataset_size + i) * 4, true))
      gy.push(default_store.dataset_data_view.getFloat32(8 + (4 * dataset_size + i) * 4, true))
      gz.push(default_store.dataset_data_view.getFloat32(8 + (5 * dataset_size + i) * 4, true))
    }

    let train_num = 0
    let validation_num = 0
    let test_num = 0
    let total_num = 0

    new_dataset.items.forEach((item) => {
      if (item.type_id !== checked_model_type_id.value) return

      total_num++
      if (item.set_type === "train") {
        train_num++
      } else if (item.set_type === "validation") {
        validation_num++
      } else if (item.set_type === "test") {
        test_num++
      }
    })

    const total_portion = new_dataset.protion.train + new_dataset.protion.validation + new_dataset.protion.test
    let set_type_num = [
      {
        type: "train",
        protion_diff: train_num / total_num - new_dataset.protion.train / total_portion
      },
      {
        type: "validation",
        protion_diff: validation_num / total_num - new_dataset.protion.validation / total_portion
      },
      {
        type: "test",
        protion_diff: test_num / total_num - new_dataset.protion.test / total_portion
      }
    ]

    // sort
    set_type_num.sort((a, b) => {
      return a.protion_diff - b.protion_diff
    })

    let item = {
      id: new_dataset.items.length,
      type_id: checked_model_type_id.value,
      timestamp: Date.now(),
      set_type: set_type_num[0].type,
      ax: ax,
      ay: ay,
      az: az,
      gx: gx,
      gy: gy,
      gz: gz,
    }

    new_dataset.items.push(item)
    // console.log("new_dataset item: ", item)
  })

watchEffect(() => {
  // calculate train_num, validation_num, test_num of each item_type
  new_dataset.item_types.forEach((item) => {
    item.train_num = 0
    item.validation_num = 0
    item.test_num = 0

    new_dataset.items.forEach((dataset_item) => {
      if (dataset_item.type_id === item.id) {
        if (dataset_item.set_type === "train") {
          item.train_num++
        } else if (dataset_item.set_type === "validation") {
          item.validation_num++
        } else if (dataset_item.set_type === "test") {
          item.test_num++
        }
      }
    })
  })
})

const update_record_ready = async (state) => {
  if (state) {
    if (new_dataset.type === null) {
      toast(t('cnn_view.choose_model_type'), "error")
    } else if (new_dataset.sample_size == null) {
      toast(t('cnn_view.input_sample_size'), "error")
    } else if (new_dataset.sample_tick == null) {
      toast(t('cnn_view.input_sample_tick'), "error")
    } else {
      toast(t('toast.loading'), "info")
      await wsmgr.get_mpu_data_row({ type: new_dataset.type, sample_size: new_dataset.sample_size, sample_tick: new_dataset.sample_tick })
      toast(t('toast.load_success'), "success")
      record_ready.value = true
    }
  } else {
    toast(t('toast.loading'), "info")
    await wsmgr.get_mpu_data_row_stop()
    toast(t('toast.load_success'), "success")
    record_ready.value = false
  }
}

const mode_type_list = [
  {
    id: 0,
    label: "指令模型",
    value: 0,
    desc: "该类模型需要在一个周期内完成一个完整的动作"
  },
  {
    id: 1,
    label: "连续模型",
    value: 1,
    desc: "该类模型进行不间断扫描，达到采样数量后进行识别"
  },
]

function gen_dataset_type_item() {
  let data = {
    id: ref(new_dataset.item_types.length),
    comment: ref(""),
    desc: ref(""),
    train_num: ref(0),
    validation_num: ref(0),
    test_num: ref(0),
  }
  data.key = ref(data.id)
  new_dataset.item_types.push(data)

  nextTick(() => {
    typeCurrentPage.value = Math.ceil(new_dataset.item_types.length / typePageSize)
  })
}

const load_dataset = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json' // 只允许 JSON 文件
  input.style.display = 'none' // 隐藏 input

  // 监听文件选择
  input.addEventListener('change', function (event) {
    const file = event.target.files[0] // 获取用户选择的文件
    if (!file) return

    const reader = new FileReader()

    reader.onload = function (e) {
      try {
        const jsonData = JSON.parse(e.target.result) // 解析 JSON
        console.log('JSON 数据:', jsonData)
        Object.assign(new_dataset, jsonData)
      } catch (error) {
        console.error('JSON 解析失败:', error)
      }
    }

    reader.readAsText(file) // 以文本方式读取文件
  })

  // 触发文件选择
  input.click()
}

const save_dataset = () => {
  if (!new_dataset.id || new_dataset.id.trim() === "") {
    toast(t("toast.new_dataset_id_is_null"), "error")
    return
  }

  let dataset_s = JSON.stringify(new_dataset)

  const blob = new Blob([dataset_s], { type: 'application/json' })

  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `dataset.${new_dataset.id}.${formatDate()}.json`

  // 触发点击事件，下载文件
  link.click()
}

const train_model = async () => {
  await train(new_dataset, model_code.value)
}

const fileInput = ref(null)
const models = ref([]) // 模型名称数组, ['model1.tflite', 'model2.tflite']
const selectedModel = ref(null)

const uploadModel = async () => {
  const file = fileInput.value?.files?.[0]
  if (!file) {
    toast(t('cnn_view.select_model_file'), 'error')
    return
  }

  toast(t('toast.model_uploading'), 'success')

  const xor = await calcXORChecksum(file)
  const url = `${default_store.wifi_info.host}/upload_model?token=${default_store.user_config.username}:${default_store.user_config.password}&xor=${xor}&name=${encodeURIComponent(file.name)}`

  const xhr = new XMLHttpRequest()
  xhr.open("POST", url)
  xhr.timeout = 60000
  xhr.onload = function () {
    if (xhr.status === 200) {
      console.log('model上传成功:', xhr.responseText)
      toast(t('toast.model_upload_success'), 'success')
      fetchModelList()
    } else {
      toast(t('toast.model_upload_fail'), 'error')
      console.error('model上传失败:', xhr.status, xhr.statusText)
    }
  }

  xhr.onerror = function () {
    toast(t('toast.model_upload_fail'), 'error')
  }

  xhr.ontimeout = function () {
    console.error('请求超时')
  }

  xhr.send(file)
}

const fetchModelList = async () => {
  toast(t('toast.loading'), 'info')
  let data = await wsmgr.get_file_list()
  toast(t('toast.load_success'), 'success')

  const list = data.split('\n')
    .map(name => decodeURIComponent(name))
    .filter(i => i.endsWith(".tflite"))

  console.log(list)
  models.value = list
}

const updateModelColor = async (old, color) => {
  let list = old.split('.')
  list[list.length - 2] = color.replace(/^#/, '')
  const new_val = list.join('.')
  const data = { old: encodeURIComponent(old), new: encodeURIComponent(new_val), del: false }
  toast(t('toast.loading'), 'info')
  await wsmgr.modify_model(data)
  toast(t('toast.load_success'), 'success')
  await fetchModelList()
}

const deleteModel = async (name) => {
  const ok = await confirmRef.value.show(t('confirm_dialog.del_model_confirm'))
  if (ok) {
    toast(t('toast.loading'), 'info')
    const data = { old: encodeURIComponent(name), new: "", del: true }
    await wsmgr.modify_model(data)
    toast(t('toast.load_success'), 'success')
    await fetchModelList()
  }
}

function downloadModel(name) {
}

</script>

<template>
  <div class="flex space-x-4 border-b mb-4">
    <button class="px-4 py-2 text-gray-700 hover:text-blue-600 border-b-2"
      :class="{ 'border-blue-500 font-semibold': nav === 'model' }" @click="nav = 'model'">
      {{ t('cnn_view.train') }}
    </button>
    <button class="px-4 py-2 text-gray-700 hover:text-blue-600 border-b-2"
      :class="{ 'border-blue-500 font-semibold': nav === 'new_dataset' }" @click="nav = 'new_dataset'">
      {{ t('cnn_view.dataset') }}
    </button>
    <button class="px-4 py-2 text-gray-700 hover:text-blue-600 border-b-2"
      :class="{ 'border-blue-500 font-semibold': nav === 'predict' }" @click="nav = 'predict'">
      {{ t('cnn_view.predict') }}
    </button>
    <button class="px-4 py-2 text-gray-700 hover:text-blue-600 border-b-2"
      :class="{ 'border-blue-500 font-semibold': nav === 'model_manage' }" @click="nav = 'model_manage'">
      {{ t('cnn_view.model_manage') }}
    </button>
  </div>

  <ConfirmDialog ref="confirmRef" />

  <div class="cnn-container">
    <div v-if="!nav">
      <p class="indent-8 mb-2">
        卷积神经网络是一种深度学习模型，主要用于处理和分析图像数据。它的设计灵感源自于对生物视觉系统的理解，模拟了视觉皮层的结构和功能。CNN通过一系列的卷积层、池化层和全连接层构建而成，每一层都有特定的功能和作用。
      </p>
      <p class="indent-8">点按上方导航按钮以开始。</p>
    </div>

    <!-- 模型设置 -->
    <div v-if="nav === 'model'" class="space-y-4">

      <!-- 第一行：数据集名称、操作按钮 -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="flex items-center gap-2">
          <span class="text-gray-600">数据集名称</span>
          <input type="text" v-model="new_dataset.id" disabled placeholder="请前往数据集选项"
            class="border px-2 py-1 rounded w-1/2 bg-gray-100 text-sm" />
        </div>

        <div class="flex flex-wrap gap-2">
          <button @click="train_model" class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-1 rounded text-sm">
            训练
          </button>
          <button @click="predict" class="bg-green-500 hover:bg-green-600 text-white px-4 py-1 rounded text-sm">
            预测
          </button>
          <button @click="toggle_visor" class="bg-blue-400 hover:bg-blue-500 text-white px-4 py-1 rounded text-sm">
            显示面板
          </button>
          <button @click="save_model(new_dataset.id)"
            class="bg-blue-400 hover:bg-blue-500 text-white px-4 py-1 rounded text-sm">
            保存
          </button>
        </div>
      </div>

      <!-- 模型代码编辑 -->
      <div>
        <details class="bg-gray-100 rounded p-4">
          <summary class="cursor-pointer font-semibold text-sm mb-2">
            训练代码
          </summary>
          <textarea v-model="model_code" spellcheck="false"
            class="w-full h-80 border rounded p-2 font-mono text-sm bg-white"></textarea>
        </details>
      </div>
    </div>

    <div v-if="nav === 'new_dataset'" class="space-y-4">
      <!-- 表单容器 -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-2 text-base">

        <!-- 模型名称 -->
        <div class="flex flex-col">
          <label class="text-gray-700 mb-1">模型名称</label>
          <input v-model="new_dataset.id" type="text" placeholder="模型的 ID"
            class="border px-2 py-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <!-- 导入 / 保存 -->
        <div class="flex gap-5 py-4 px-5">
          <button @click="load_dataset" class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded shadow-sm">
            导入
          </button>
          <button @click="save_dataset" class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded shadow-sm">
            保存
          </button>
        </div>

        <!-- 模型简介 -->
        <div class="flex flex-col">
          <label class="text-gray-700 mb-1">模型简介</label>
          <input v-model="new_dataset.desc" type="text" placeholder="模型的描述"
            class="border px-2 py-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <!-- 模型类别 -->
        <div class="flex flex-col">
          <label class="text-gray-700 mb-1">模型类别</label>
          <select v-model="new_dataset.type" @change="async () => {
            if (record_ready) {
              await wsmgr.get_mpu_data_row_stop()
              record_ready = false
              toast(t('toast.stop_sampling'), 'info')
            }
          }" class="border px-2 py-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option v-for="item in mode_type_list" :value="item.value" :key="item.id">{{ item.label }}</option>
          </select>
          <p v-if="new_dataset.type !== null" class="text-sm text-gray-500 mt-1">
            {{ mode_type_list[new_dataset.type].desc }}
          </p>
        </div>

        <!-- 采样间隔 -->
        <div class="flex flex-col">
          <label class="text-gray-700 mb-1">采样间隔（ms）</label>
          <input v-model.number="new_dataset.sample_tick" type="number" min="1" @input="async () => {
            if (record_ready) {
              await wsmgr.get_mpu_data_row_stop()
              record_ready = false
              toast(t('toast.stop_sampling'), 'info')
            }
          }" class="border px-2 py-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <p class="text-sm text-gray-500 mt-1">每隔几毫秒采样一次</p>
        </div>

        <!-- 采样数量 -->
        <div class="flex flex-col">
          <label class="text-gray-700 mb-1">采样数量</label>
          <input v-model.number="new_dataset.sample_size" type="number" min="10" max="500" @input="async () => {
            if (record_ready) {
              await wsmgr.get_mpu_data_row_stop()
              record_ready = false
              toast(t('toast.stop_sampling'), 'info')
            }
          }" class="border px-2 py-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <p class="text-sm text-gray-500 mt-1">
            单次采样等效时长：
            {{ Number(new_dataset.sample_size || 0) * Number(new_dataset.sample_tick || 0) }} ms
          </p>
        </div>

        <!-- 数据集比例设置 -->
        <div class="md:col-span-2">
          <label class="text-gray-700 mb-2 block">数据集比例</label>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div class="flex flex-col">
              <input v-model.number="new_dataset.protion.train" type="number" placeholder="train"
                class="border px-2 py-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <span class="text-sm text-gray-500 mt-1">训练集</span>
            </div>
            <div class="flex flex-col">
              <input v-model.number="new_dataset.protion.validation" type="number" placeholder="validation"
                class="border px-2 py-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <span class="text-sm text-gray-500 mt-1">验证集</span>
            </div>
            <div class="flex flex-col">
              <input v-model.number="new_dataset.protion.test" type="number" placeholder="test"
                class="border px-2 py-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <span class="text-sm text-gray-500 mt-1">测试集</span>
            </div>
          </div>
        </div>
      </div>


      <!-- 双栏区域 -->
      <div class="flex flex-col md:flex-row gap-4 mt-4">
        <!-- 左侧：类别管理 -->
        <div class="w-full md:w-1/2 space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-base font-semibold">类别</span>
            <button @click="gen_dataset_type_item"
              class="bg-blue-500 hover:bg-blue-600 text-white text-sm px-2 py-1 rounded">
              新增
            </button>
          </div>

          <!-- 类别项表格 -->
          <table class="table-auto w-full border mt-6 text-sm">
            <thead class="bg-gray-100 text-left">
              <tr>
                <th class="px-4 py-2">选择</th>
                <th class="px-4 py-2">ID</th>
                <th class="px-4 py-2">名称</th>
                <th class="px-4 py-2">训练集</th>
                <th class="px-4 py-2">验证集</th>
                <th class="px-4 py-2">测试集</th>
                <th class="px-4 py-2">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in pagedItemTypes" :key="item.id"
                :class="{ 'bg-blue-50': item.id === checked_model_type_id }">
                <td class="px-4 py-2">
                  <input type="radio" name="type_select" :value="item.id" v-model="checked_model_type_id" />
                </td>
                <td class="px-4 py-2">{{ item.id }}</td>
                <td class="px-4 py-2">
                  <input v-model="item.comment" class="border px-2 py-1 rounded w-full" placeholder="类别名称" />
                </td>
                <td class="px-4 py-2">{{ item.train_num }}</td>
                <td class="px-4 py-2">{{ item.validation_num }}</td>
                <td class="px-4 py-2">{{ item.test_num }}</td>
                <td class="px-4 py-2">
                  <button class="text-red-500 hover:underline" @click="() => {
                    new_dataset.item_types.splice(item.id, 1)
                    for (let i = 0; i < new_dataset.item_types.length; i++) {
                      new_dataset.item_types[i].id = i
                    }
                    if (checked_model_type_id === item.id) checked_model_type_id = null
                    if (pagedItemTypes.length === 0 && typeCurrentPage > 1) {
                      typeCurrentPage--
                    }
                  }">
                    删除
                  </button>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- 分页控制（类别项） -->
          <div class="flex items-center justify-center gap-2 mt-4">
            <button @click="typeGoPrev" :disabled="typeCurrentPage === 1"
              class="px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded disabled:opacity-50">
              上一页
            </button>

            <span class="text-sm text-gray-700">
              第 {{ typeCurrentPage }} 页 / 共 {{ typeTotalPages }} 页
            </span>

            <button @click="typeGoNext" :disabled="typeCurrentPage === typeTotalPages"
              class="px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded disabled:opacity-50">
              下一页
            </button>
          </div>

        </div>

        <!-- 右侧：采样项管理 -->
        <div class="w-full md:w-1/2 space-y-2">
          <div class="flex items-center flex-wrap gap-2">
            <span class="text-base font-semibold">采集状态：</span>

            <label class="inline-flex items-center cursor-pointer">
              <input type="checkbox" id="checsskbox" class="form-checkbox" :checked="record_ready"
                @click.prevent="(e) => update_record_ready(e.target.checked)" />
              <span class="ml-2 text-sm">启用</span>
            </label>
            <button @click="() => { new_dataset.items.length = 0 }"
              class="bg-gray-500 hover:bg-gray-600 text-white text-sm px-2 py-1 rounded">
              清空
            </button>
            <button @click="() => {
              new_dataset.items = new_dataset.items.filter(item => item.type_id !== checked_model_type_id)
              for (let i = 0; i < new_dataset.items.length; i++) new_dataset.items[i].id = i
            }" class="bg-red-500 hover:bg-red-600 text-white text-sm px-2 py-1 rounded">
              删除选中类型
            </button>
          </div>

          <!-- 数据项表格 -->
          <table class="table-auto w-full border mt-6 text-sm">
            <thead class="bg-gray-100 text-left">
              <tr>
                <th class="px-4 py-2">ID</th>
                <th class="px-4 py-2">类型</th>
                <th class="px-4 py-2">采样数量</th>
                <th class="px-4 py-2">归类</th>
                <th class="px-4 py-2">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in pagedItems" :key="item.id">
                <td class="px-4 py-2">{{ item.id }}</td>

                <td class="px-4 py-2">
                  <select v-model="item.type_id" class="border rounded px-2 py-1">
                    <option v-for="type in new_dataset.item_types" :key="type.id" :value="type.id">
                      {{ type.comment }} | {{ type.id }}
                    </option>
                  </select>
                </td>

                <td class="px-4 py-2">{{ item.ax.length }}</td>
                <td class="px-4 py-2">{{ item.set_type }}</td>

                <td class="px-4 py-2">
                  <button class="text-red-500 hover:underline" @click="() => {
                    new_dataset.items.splice(item.id, 1)
                    for (let i = 0; i < new_dataset.items.length; i++) {
                      new_dataset.items[i].id = i
                    }
                    if (pagedItems.length === 0 && currentPage > 1) {
                      currentPage--
                    }
                  }">
                    删除
                  </button>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- 分页控制 -->
          <div class="flex items-center justify-center gap-2 mt-4">
            <button @click="goPrev" :disabled="currentPage === 1"
              class="px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded disabled:opacity-50">
              上一页
            </button>

            <span class="text-sm text-gray-700">
              第 {{ currentPage }} 页 / 共 {{ totalPages }} 页
            </span>

            <button @click="goNext" :disabled="currentPage === totalPages"
              class="px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded disabled:opacity-50">
              下一页
            </button>
          </div>

        </div>
      </div>
    </div>

    <div v-if="nav === 'model_manage'" class="space-y-4">
      <!-- 文件上传 -->
      <div class="flex flex-col md:flex-row items-start md:items-center gap-2">
        <div>
          <input ref="fileInput" type="file" accept=".tflite"
            class="block w-full text-sm text-gray-500 file:mr-4 file:rounded-full file:border-0 file:bg-violet-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-violet-700 hover:file:bg-violet-100 dark:file:bg-violet-600 dark:file:text-violet-100 dark:hover:file:bg-violet-500" />
        </div>
        <button @click="uploadModel" class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded text-sm">
          {{ t('cnn_view.upload_model') }}
        </button>
        <button @click="fetchModelList" class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded text-sm">
          {{ t('cnn_view.list_model') }}
        </button>
      </div>

      <!-- 模型列表 -->
      <div v-if="models.length > 0" class="border rounded p-2 space-y-2 text-sm">
        <div v-for="(model, index) in models" :key="model"
          class="flex justify-between items-center border-b border-gray-300 py-1">
          <label class="flex items-center gap-2">
            <!-- 色块 -->
            <span class="w-4 h-4 rounded-full inline-block border"
              :style="{ backgroundColor: calColor(model) || '#ccc' }"></span>

            <!-- 单选 -->
            <input type="radio" name="selectedModel" :value="model.name" v-model="selectedModel" />
            {{ model }}
          </label>
          <div class="flex gap-2">
            <div class="flex items-center gap-2">
              <input type="color" :value="calColor(model)" @change="updateModelColor(model, $event.target.value)"
                class="w-6 h-6 p-0 border cursor-pointer" />
            </div>
            <!-- <button @click="downloadModel(model)" class="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded">
              下载
            </button> -->
            <button @click="deleteModel(model)" class="bg-rose-400 hover:bg-rose-300 text-white px-2 py-1 rounded">
              删除
            </button>
          </div>
        </div>
      </div>
    </div>


    <div v-if="nav === 'predict'" class="space-y-4">
      <div class="space-y-4">
        <div class="flex flex-col md:flex-row gap-4">
          <!-- JSON & BIN file input -->
          <div class="flex flex-col space-y-2 md:w-1/2">
            <label class="font-semibold">加载数据文件</label>
            <input ref="jsonInput" type="file" accept=".json" class="border rounded px-2 py-1" />
            <input ref="binInput" type="file" accept=".bin" class="border rounded px-2 py-1" />
            <button class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded shadow-sm w-max"
              @click="handleLoadDataFiles">
              加载
            </button>
          </div>
          <!-- TFLite file input -->
          <div class="flex flex-col space-y-2 md:w-1/2">
            <label class="font-semibold">上传 TFLite 模型</label>
            <input ref="tfliteInput" type="file" accept=".tflite" class="border rounded px-2 py-1" />
            <button class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded shadow-sm w-max"
              @click="handleUploadTFLite">
              上传
            </button>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>
