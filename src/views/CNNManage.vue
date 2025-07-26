<template>
  <!-- 文件上传 -->
  <div class="p-4 flex flex-col md:flex-row items-start md:items-center gap-2">
    <div>
      <input
        ref="fileInput"
        type="file"
        accept=".tflite"
        class="block w-full text-sm text-gray-500 file:mr-4 file:rounded-full file:border-0 file:bg-violet-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-violet-700 hover:file:bg-violet-100 dark:file:bg-violet-600 dark:file:text-violet-100 dark:hover:file:bg-violet-500"
      >
    </div>
    <button
      class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded text-sm"
      @click="uploadModel"
    >
      {{ t('cnn_view.upload_model') }}
    </button>
    <button
      class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded text-sm"
      @click="fetchModelList"
    >
      {{ t('cnn_view.list_model') }}
    </button>
  </div>

  <!-- 模型列表 -->
  <div
    v-if="models.length > 0"
    class="border rounded p-2 space-y-2 text-sm"
  >
    <div
      v-for="(model, index) in models"
      :key="model"
      class="flex justify-between items-center border-b border-gray-300 py-1"
    >
      <label class="flex items-center gap-2">
        <!-- 色块 -->
        <span
          class="w-4 h-4 rounded-full inline-block border"
          :style="{ backgroundColor: calColor(model) || '#ccc' }"
        />

        <!-- 单选 -->
        <input
          type="radio"
          name="selectedModel"
          @change="CNN_store.selectedModel = model"
        >
        {{ model }}
      </label>
      <div class="flex gap-2">
        <div class="flex items-center gap-2">
          <input
            type="color"
            :value="calColor(model)"
            class="w-6 h-6 p-0 border cursor-pointer"
            @change="updateModelColor(model, $event.target.value)"
          >
        </div>
        <!-- <button @click="downloadModel(model)" class="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded">
              下载
            </button> -->
        <button
          class="bg-rose-400 hover:bg-rose-300 text-white px-2 py-1 rounded"
          @click="deleteModel(model)"
        >
          删除
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

const info_store = useInfoStore()
const CNN_store = useCNNStore()

const fileInput = ref(null)
const models = ref([]) // 模型名称数组, ['model1.tflite', 'model2.tflite']

const uploadModel = async () => {
    const file = fileInput.value?.files?.[0]
    if (!file) {
        toast(t('cnn_view.select_model_file'), 'error')
        return
    }

    toast(t('toast.model_uploading'), 'success')

    const xor = await calcXORChecksum(file)
    const url = `${info_store.wifi_info.host}/upload_model?token=${info_store.user_config.username}:${info_store.user_config.password}&xor=${xor}&name=${encodeURIComponent(file.name)}`

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

await fetchModelList()
</script>
