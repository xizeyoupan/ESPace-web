<template>
  <!-- 表单容器 -->
  <div class="grid grid-cols-1 md:grid-cols-2 gap-2 text-base">
    <!-- 模型名称 -->
    <div class="flex flex-col">
      <label class="text-gray-700 mb-1">模型名称</label>
      <input
        v-model="CNN_store.dataset.id"
        type="text"
        placeholder="模型的 ID"
        class="border px-2 py-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
    </div>

    <!-- 导入 / 保存 -->
    <div class="flex gap-5 py-4 px-5">
      <button
        class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded shadow-sm"
        @click="load_dataset"
      >
        导入
      </button>
      <button
        class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded shadow-sm"
        @click="save_dataset"
      >
        保存
      </button>
    </div>

    <!-- 模型简介 -->
    <div class="flex flex-col">
      <label class="text-gray-700 mb-1">模型简介</label>
      <input
        v-model="CNN_store.dataset.desc"
        type="text"
        placeholder="模型的描述"
        class="border px-2 py-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
    </div>

    <!-- 模型类别 -->
    <div class="flex flex-col">
      <label class="text-gray-700 mb-1">模型类别</label>
      <select
        v-model="CNN_store.dataset.type"
        class="border px-2 py-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        @change="async () => {
          if (record_ready) {
            await wsmgr.get_mpu_data_row_stop()
            record_ready = false
            toast(t('toast.stop_sampling'), 'info')
          }
        }"
      >
        <option
          v-for="item in CNN_store.mode_type_list"
          :key="item.id"
          :value="item.value"
        >
          {{ item.label }}
        </option>
      </select>
      <p
        v-if="CNN_store.dataset.type !== null"
        class="text-sm text-gray-500 mt-1"
      >
        {{ CNN_store.mode_type_list[CNN_store.dataset.type].desc }}
      </p>
    </div>

    <!-- 采样间隔 -->
    <div class="flex flex-col">
      <label class="text-gray-700 mb-1">采样间隔（ms）</label>
      <input
        v-model.number="CNN_store.dataset.sample_tick"
        type="number"
        min="1"
        class="border px-2 py-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        @input="async () => {
          if (record_ready) {
            await wsmgr.get_mpu_data_row_stop()
            record_ready = false
            toast(t('toast.stop_sampling'), 'info')
          }
        }"
      >
      <p class="text-sm text-gray-500 mt-1">
        每隔几毫秒采样一次
      </p>
    </div>

    <!-- 采样数量 -->
    <div class="flex flex-col">
      <label class="text-gray-700 mb-1">采样数量</label>
      <input
        v-model.number="CNN_store.dataset.sample_size"
        type="number"
        min="10"
        max="500"
        class="border px-2 py-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        @input="async () => {
          if (record_ready) {
            await wsmgr.get_mpu_data_row_stop()
            record_ready = false
            toast(t('toast.stop_sampling'), 'info')
          }
        }"
      >
      <p class="text-sm text-gray-500 mt-1">
        单次采样等效时长：
        {{ Number(CNN_store.dataset.sample_size || 0) * Number(CNN_store.dataset.sample_tick || 0) }} ms
      </p>
    </div>

    <!-- 数据集比例设置 -->
    <div class="md:col-span-2">
      <label class="text-gray-700 mb-2 block">数据集比例</label>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="flex flex-col">
          <input
            v-model.number="CNN_store.dataset.protion.train"
            type="number"
            placeholder="train"
            class="border px-2 py-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
          <span class="text-sm text-gray-500 mt-1">训练集</span>
        </div>
        <div class="flex flex-col">
          <input
            v-model.number="CNN_store.dataset.protion.validation"
            type="number"
            placeholder="validation"
            class="border px-2 py-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
          <span class="text-sm text-gray-500 mt-1">验证集</span>
        </div>
        <div class="flex flex-col">
          <input
            v-model.number="CNN_store.dataset.protion.test"
            type="number"
            placeholder="test"
            class="border px-2 py-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
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
        <button
          class="bg-blue-500 hover:bg-blue-600 text-white text-sm px-2 py-1 rounded"
          @click="gen_dataset_type_item"
        >
          新增
        </button>
      </div>

      <!-- 类别项表格 -->
      <table class="table-auto w-full border mt-6 text-sm">
        <thead class="bg-gray-100 text-left">
          <tr>
            <th class="px-4 py-2">
              选择
            </th>
            <th class="px-4 py-2">
              ID
            </th>
            <th class="px-4 py-2">
              名称
            </th>
            <th class="px-4 py-2">
              训练集
            </th>
            <th class="px-4 py-2">
              验证集
            </th>
            <th class="px-4 py-2">
              测试集
            </th>
            <th class="px-4 py-2">
              操作
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(item, index) in pagedItemTypes"
            :key="item.id"
            :class="{ 'bg-blue-50': item.id === checked_model_type_id }"
          >
            <td class="px-4 py-2">
              <input
                v-model="checked_model_type_id"
                type="radio"
                name="type_select"
                :value="item.id"
              >
            </td>
            <td class="px-4 py-2">
              {{ item.id }}
            </td>
            <td class="px-4 py-2">
              <input
                v-model="item.comment"
                class="border px-2 py-1 rounded w-full"
                placeholder="类别名称"
              >
            </td>
            <td class="px-4 py-2">
              {{ item.train_num }}
            </td>
            <td class="px-4 py-2">
              {{ item.validation_num }}
            </td>
            <td class="px-4 py-2">
              {{ item.test_num }}
            </td>
            <td class="px-4 py-2">
              <button
                class="text-red-500 hover:underline"
                @click="() => {
                  CNN_store.dataset.item_types.splice(item.id, 1)
                  for (let i = 0; i < CNN_store.dataset.item_types.length; i++) {
                    CNN_store.dataset.item_types[i].id = i
                  }
                  if (checked_model_type_id === item.id) checked_model_type_id = null
                  if (pagedItemTypes.length === 0 && typeCurrentPage > 1) {
                    typeCurrentPage--
                  }
                }"
              >
                删除
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- 分页控制（类别项） -->
      <div class="flex items-center justify-center gap-2 mt-4">
        <button
          :disabled="typeCurrentPage === 1"
          class="px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded disabled:opacity-50"
          @click="typeGoPrev"
        >
          上一页
        </button>

        <span class="text-sm text-gray-700">
          第 {{ typeCurrentPage }} 页 / 共 {{ typeTotalPages }} 页
        </span>

        <button
          :disabled="typeCurrentPage === typeTotalPages"
          class="px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded disabled:opacity-50"
          @click="typeGoNext"
        >
          下一页
        </button>
      </div>
    </div>

    <!-- 右侧：采样项管理 -->
    <div class="w-full md:w-1/2 space-y-2">
      <div class="flex items-center flex-wrap gap-2">
        <span class="text-base font-semibold">采集状态：</span>

        <label class="inline-flex items-center cursor-pointer">
          <input
            id="checsskbox"
            type="checkbox"
            class="form-checkbox"
            :checked="record_ready"
            @click.prevent="(e) => update_record_ready(e.target.checked)"
          >
          <span class="ml-2 text-sm">启用</span>
        </label>
        <button
          class="bg-gray-500 hover:bg-gray-600 text-white text-sm px-2 py-1 rounded"
          @click="() => { CNN_store.dataset.items.length = 0 }"
        >
          清空
        </button>
        <button
          class="bg-red-500 hover:bg-red-600 text-white text-sm px-2 py-1 rounded"
          @click="() => {
            CNN_store.dataset.items = CNN_store.dataset.items.filter(item => item.type_id !== checked_model_type_id)
            for (let i = 0; i < CNN_store.dataset.items.length; i++) CNN_store.dataset.items[i].id = i
          }"
        >
          删除选中类型
        </button>
      </div>

      <!-- 数据项表格 -->
      <table class="table-auto w-full border mt-6 text-sm">
        <thead class="bg-gray-100 text-left">
          <tr>
            <th class="px-4 py-2">
              ID
            </th>
            <th class="px-4 py-2">
              类型
            </th>
            <th class="px-4 py-2">
              采样数量
            </th>
            <th class="px-4 py-2">
              归类
            </th>
            <th class="px-4 py-2">
              操作
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(item, index) in pagedItems"
            :key="item.id"
          >
            <td class="px-4 py-2">
              {{ item.id }}
            </td>

            <td class="px-4 py-2">
              <select
                v-model="item.type_id"
                class="border rounded px-2 py-1"
              >
                <option
                  v-for="type in CNN_store.dataset.item_types"
                  :key="type.id"
                  :value="type.id"
                >
                  {{ type.comment }} | {{ type.id }}
                </option>
              </select>
            </td>

            <td class="px-4 py-2">
              {{ item.ax.length }}
            </td>
            <td class="px-4 py-2">
              {{ item.set_type }}
            </td>

            <td class="px-4 py-2">
              <button
                class="text-red-500 hover:underline"
                @click="() => {
                  CNN_store.dataset.items.splice(item.id, 1)
                  for (let i = 0; i < CNN_store.dataset.items.length; i++) {
                    CNN_store.dataset.items[i].id = i
                  }
                  if (pagedItems.length === 0 && currentPage > 1) {
                    currentPage--
                  }
                }"
              >
                删除
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- 分页控制 -->
      <div class="flex items-center justify-center gap-2 mt-4">
        <button
          :disabled="currentPage === 1"
          class="px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded disabled:opacity-50"
          @click="goPrev"
        >
          上一页
        </button>

        <span class="text-sm text-gray-700">
          第 {{ currentPage }} 页 / 共 {{ totalPages }} 页
        </span>

        <button
          :disabled="currentPage === totalPages"
          class="px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded disabled:opacity-50"
          @click="goNext"
        >
          下一页
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, h, reactive, computed, watchEffect, watch } from 'vue'
import { useInfoStore } from '../store/infoStore.js'
import { useCNNStore } from '../store/CNNStore.js'
import ConfirmDialog from '../components/ConfirmDialog.vue'
import { toggle_visor, train, save_model } from '../cnn.js'
import { wsmgr } from '../plugins/ws.js'
import { i18n } from '../i18n.js'
import { toast } from '../plugins/toast.js'
import { calColor, calcXORChecksum, formatDate } from '../util.js'
const t = i18n.global.t


const currentPage = ref(1)
const pageSize = 10

const pagedItems = computed(() => {
    const start = (currentPage.value - 1) * pageSize
    return CNN_store.dataset.items.slice(start, start + pageSize)
})

const totalPages = computed(() => {
    return Math.ceil(CNN_store.dataset.items.length / pageSize)
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
    return CNN_store.dataset.item_types.slice(start, start + typePageSize)
})

const typeTotalPages = computed(() => {
    return Math.ceil(CNN_store.dataset.item_types.length / typePageSize)
})

const typeGoPrev = () => {
    if (typeCurrentPage.value > 1) typeCurrentPage.value--
}

const typeGoNext = () => {
    if (typeCurrentPage.value < typeTotalPages.value) typeCurrentPage.value++
}



const CNN_store = useCNNStore()
const info_store = useInfoStore()

const record_ready = ref(false)
const checked_model_type_id = ref(null)

watch(
    () => CNN_store.dataset_data_view,
    (newVal, oldVal) => {

        if (checked_model_type_id.value === null) {
            console.warn("请先选择模型类型")
            return
        }

        let dataset_size = CNN_store.dataset_data_view.getFloat32(4, true)
        let ax = []
        let ay = []
        let az = []
        let gx = []
        let gy = []
        let gz = []
        for (let i = 0; i < dataset_size; i++) {
            ax.push(CNN_store.dataset_data_view.getFloat32(8 + (0 * dataset_size + i) * 4, true))
            ay.push(CNN_store.dataset_data_view.getFloat32(8 + (1 * dataset_size + i) * 4, true))
            az.push(CNN_store.dataset_data_view.getFloat32(8 + (2 * dataset_size + i) * 4, true))
            gx.push(CNN_store.dataset_data_view.getFloat32(8 + (3 * dataset_size + i) * 4, true))
            gy.push(CNN_store.dataset_data_view.getFloat32(8 + (4 * dataset_size + i) * 4, true))
            gz.push(CNN_store.dataset_data_view.getFloat32(8 + (5 * dataset_size + i) * 4, true))
        }

        let train_num = 0
        let validation_num = 0
        let test_num = 0
        let total_num = 0

        CNN_store.dataset.items.forEach((item) => {
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

        const total_portion = CNN_store.dataset.protion.train + CNN_store.dataset.protion.validation + CNN_store.dataset.protion.test
        let set_type_num = [
            {
                type: "train",
                protion_diff: train_num / total_num - CNN_store.dataset.protion.train / total_portion
            },
            {
                type: "validation",
                protion_diff: validation_num / total_num - CNN_store.dataset.protion.validation / total_portion
            },
            {
                type: "test",
                protion_diff: test_num / total_num - CNN_store.dataset.protion.test / total_portion
            }
        ]

        // sort
        set_type_num.sort((a, b) => {
            return a.protion_diff - b.protion_diff
        })

        let item = {
            id: CNN_store.dataset.items.length,
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

        CNN_store.dataset.items.push(item)
        // console.log("CNN_store.dataset item: ", item)
    })

watchEffect(() => {
    // calculate train_num, validation_num, test_num of each item_type
    CNN_store.dataset.item_types.forEach((item) => {
        item.train_num = 0
        item.validation_num = 0
        item.test_num = 0

        CNN_store.dataset.items.forEach((dataset_item) => {
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
        if (CNN_store.dataset.type === null) {
            toast(t('cnn_view.choose_model_type'), "error")
        } else if (CNN_store.dataset.sample_size == null) {
            toast(t('cnn_view.input_sample_size'), "error")
        } else if (CNN_store.dataset.sample_tick == null) {
            toast(t('cnn_view.input_sample_tick'), "error")
        } else {
            toast(t('toast.loading'), "info")
            await wsmgr.get_mpu_data_row({ type: CNN_store.dataset.type, sample_size: CNN_store.dataset.sample_size, sample_tick: CNN_store.dataset.sample_tick })
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

function gen_dataset_type_item() {
    let data = {
        id: ref(CNN_store.dataset.item_types.length),
        comment: ref(""),
        desc: ref(""),
        train_num: ref(0),
        validation_num: ref(0),
        test_num: ref(0),
    }
    data.key = ref(data.id)
    CNN_store.dataset.item_types.push(data)

    nextTick(() => {
        typeCurrentPage.value = Math.ceil(CNN_store.dataset.item_types.length / typePageSize)
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
                Object.assign(CNN_store.dataset, jsonData)
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
    if (!CNN_store.dataset.id || CNN_store.dataset.id.trim() === "") {
        toast(t("toast.CNN_store.dataset_id_is_null"), "error")
        return
    }

    let dataset_s = JSON.stringify(CNN_store.dataset)

    const blob = new Blob([dataset_s], { type: 'application/json' })

    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `dataset.${CNN_store.dataset.id}.${formatDate()}.json`

    // 触发点击事件，下载文件
    link.click()
}

</script>
