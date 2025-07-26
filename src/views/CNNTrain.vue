<template>
  <div class="space-y-4">
    <!-- 第一行：数据集名称、操作按钮 -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="flex items-center gap-2">
        <span class="text-gray-600">数据集名称</span>
        <input
          v-model="CNN_store.dataset.id"
          type="text"
          disabled
          placeholder="请前往数据集选项"
          class="border px-2 py-1 rounded w-1/2 bg-gray-100 text-sm"
        >
      </div>

      <div class="flex flex-wrap gap-2">
        <button
          class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-1 rounded text-sm"
          @click="train_model"
        >
          训练
        </button>

        <button
          class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-1 rounded text-sm"
          @click="toggle_visor"
        >
          显示面板
        </button>

        <button
          class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-1 rounded text-sm"
          @click="save_model(CNN_store.dataset.id, CNN_store.dataset.type ? 'periodic' : 'oneshot', CNN_store.dataset.sample_tick)"
        >
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
        <textarea
          v-model="CNN_store.model_code"
          spellcheck="false"
          class="w-full h-80 border rounded p-2 font-mono text-sm bg-white"
        />
      </details>
    </div>

    <div class="flex items-center flex-wrap gap-2">
      <span class="text-base font-semibold">预测：</span>

      <label class="inline-flex items-center cursor-pointer">
        <input
          id="checsskbox"
          type="checkbox"
          class="form-checkbox"
          :checked="predict_ready"
          @click.prevent="(e) => update_predict_ready(e.target.checked)"
        >
        <span class="ml-2 text-sm">启用</span>
      </label>
    </div>

    <div class="space-y-1">
      <div
        v-for="(value, index) in predict_response.data"
        :key="index"
        :class="['flex justify-between px-2 py-1 rounded', index === maxPredictIndex ? 'bg-yellow-100 font-bold text-yellow-700' : '']"
      >
        <span>#{{ index }}</span>
        <span>{{ (value * 100).toFixed(2) }}%</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, h, reactive, computed, watchEffect, watch } from 'vue'
import { useInfoStore } from '../store/infoStore.js'
import ConfirmDialog from '../components/ConfirmDialog.vue'
import { toggle_visor, train, save_model } from '../cnn.js'
import { wsmgr } from '../plugins/ws.js'
import { i18n } from '../i18n.js'
import { toast } from '../plugins/toast.js'
import { calColor, calcXORChecksum, formatDate } from '../util.js'
import { useCNNStore } from '../store/CNNStore.js'

const t = i18n.global.t


const info_store = useInfoStore()
const CNN_store = useCNNStore()

const predict_ready = ref(false)

const predict_response = reactive({
    data: [],
    output_size: 0,
})

const predict_response_handler = async (payload) => {
    console.log(payload)
    Object.assign(predict_response, payload)
}

wsmgr.onMessage('predict', predict_response_handler)

const maxPredictIndex = computed(() => {
    let max = -Infinity
    let idx = -1
    predict_response.data.forEach((val, i) => {
        if (val > max) {
            max = val
            idx = i
        }
    })
    return idx
})


const update_predict_ready = async (state) => {
    if (state) {
        if (!CNN_store.selectedModel) {
            toast(t("toast.select_model_first"), "error")
            return
        }
        console.log("开始预测模型: ", CNN_store.selectedModel)
        await wsmgr.start_predict({ model: encodeURIComponent(CNN_store.selectedModel) })
    } else {
        await wsmgr.stop_predict()
        predict_response.data.length = 0
    }

    predict_ready.value = state
}

const train_model = async () => {
    if (CNN_store.dataset.items.length === 0) {
        toast(t('toast.select_dataset_first'), 'error')
        return
    }
    await train(CNN_store.dataset, CNN_store.model_code)
}

</script>
