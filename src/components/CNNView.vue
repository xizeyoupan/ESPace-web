<script setup>
import { ref, onMounted, h, reactive, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useMessage, NMenu, NSelect, NFlex, NInput, NInputNumber, NPopover, NSplit, NDataTable, NButton } from "naive-ui"
import { useDeviceStore } from '../stores/device.js'
import { get } from 'idb-keyval'

const message = useMessage()
const device = useDeviceStore()

const { wifi_info, device_info, computed_data } = storeToRefs(device)


const nav = ref("")
const model_loading_method = ref(null)
const model_id = ref(null)

const new_dataset = reactive(
  {
    type: ref(null),
    sample_tick: ref(null), //采样间隔
    sample_size: ref(null), //采样数量
    protion: {
      train: ref(3),
      validation: ref(1),
      test: ref(1)
    },
    item_types: ref([]),
    items: ref([]),
  }
)

const dataset_type_cols = [
  {
    type: 'selection',
    multiple: false,
  },
  {
    title: 'id',
    key: 'id',
  },
  {
    title: '类型',
    key: 'comment',
    render(row, index) {
      console.log(row)
      return h(NInput, {
        value: row.comment,
        onUpdateValue(v) {
          new_dataset.item_types[index].comment = v
        }
      })
    }
  },
  {
    title: '训练集条数',
    key: 'train_num',
  },
  {
    title: '验证集条数',
    key: 'validation_num',
  },
  {
    title: '测试集条数',
    key: 'test_num',
  },
]

const handleNavUpdateValue = (key, item) => {
  nav.value = item.key
}

const handleModelUpdateValue = (value, option) => {
  message.info(`value: ${JSON.stringify(value)}`)
  message.info(`option: ${JSON.stringify(option)}`)
}

const menuOptions = [
  {
    label: "导入模型",
    key: "load_model",
  },
  {
    label: "新建模型",
    key: "new_model",
  },
  {
    label: "新建数据集",
    key: "new_dataset",
  },
]

const model_loading_options = [
  {
    label: '云数据库',
    value: 'db',
  },
  {
    label: '本地文件',
    value: 'local',
  },
  {
    label: 'flash',
    value: 'flash',
  },
]

const mode_list = ref([
  {
    label: 'flash',
    value: 'flash',
  },
])

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

const pagination = {
  pageSize: 10
}

function gen_dataset_type_item() {
  let data = {
    id: ref(new_dataset.item_types.length),
    comment: ref(""),
    desc: ref(""),
  }
  data.key = ref(data.id)
  new_dataset.item_types.push(data)
}

const dataset_type_items_for_table = computed(() => {
  let data = new_dataset.item_types.map((item) => {

    console.log(item)
    return item
  })
  console.log(data)

  return data
})

</script>

<template>
  <n-menu
    mode="horizontal"
    :options="menuOptions"
    responsive
    @update:value="handleNavUpdateValue"
  />
  <div class="cnn-container">
    <div v-if="!nav">
      <p>
        卷积神经网络是一种深度学习模型，主要用于处理和分析图像数据。它的设计灵感源自于对生物视觉系统的理解，模拟了视觉皮层的结构和功能。CNN通过一系列的卷积层、池化层和全连接层构建而成，每一层都有特定的功能和作用。
      </p>
      <p>点按上方导航按钮以开始。</p>
    </div>

    <div v-else-if="nav === `load_model`">
      <n-flex align="center">
        <n-select
          v-model:value="model_loading_method"
          placeholder="选择载入方式"
          style="width: 20%;"
          :options="model_loading_options"
        />
        <n-select
          v-model:value="model_id"
          placeholder="选择模型"
          style="width: 20%;"
          :options="mode_list"
          @update:value="handleModelUpdateValue"
        />
      </n-flex>
    </div>

    <div v-else-if="nav === `new_model`">
      <n-flex align="center">
        <n-select
          v-model:value="model_loading_method"
          placeholder="选择模型类型"
          style="width: 20%;"
          :options="model_loading_options"
        />
        <n-select
          v-model:value="model_id"
          placeholder="选择模型"
          style="width: 20%;"
          :options="mode_list"
          @update:value="handleModelUpdateValue"
        />
      </n-flex>
    </div>

    <div v-else-if="nav === `new_dataset`">
      <n-flex
        vertical
        style="gap: 20px;"
      >
        <n-flex align="center">
          <n-select
            v-model:value="new_dataset.type"
            placeholder="选择模型类型"
            style="width: 30%;"
            :options="mode_type_list"
          />
          <span v-if="new_dataset.type != null">{{ mode_type_list[new_dataset.type].desc }}</span>
        </n-flex>


        <n-flex align="center">
          <span>采样间隔</span>
          <n-popover
            trigger="hover"
            placement="bottom"
          >
            <template #trigger>
              <n-input-number
                v-model:value="new_dataset.sample_tick"
                style="width: 30%;"
                clearable
                placeholder="请输入采样间隔(ms)"
              />
            </template>
            每隔几毫秒进行一次采样
          </n-popover>
        </n-flex>

        <n-flex align="center">
          <span>采样数量</span>
          <n-popover
            trigger="hover"
            placement="bottom"
          >
            <template #trigger>
              <n-input-number
                v-model:value="new_dataset.sample_size"
                style="width: 30%;"
                clearable
                placeholder="请输入数据数量"
              />
            </template>
            对于指令模型，如果一个周期内实际采样的点数与该值不一致，则会超采或降采样到这个值；对于连续模型，这个值就是一次推理采样到的数量。
          </n-popover>

          <n-popover
            trigger="hover"
            placement="bottom"
          >
            <template #trigger>
              <n-input
                style="width: 30%;"
                disabled
                :value="Number(new_dataset.sample_size) * Number(new_dataset.sample_tick) + ' ms'"
              />
            </template>
            单次采样等效时长
          </n-popover>
        </n-flex>

        <n-flex align="center">
          <span>训练集、验证集、测试集相对比例</span>
          <n-popover
            trigger="hover"
            placement="bottom"
          >
            <template #trigger>
              <n-input-number
                v-model:value="new_dataset.protion.train"
                style="width: 20%;"
              />
            </template>
            train
          </n-popover>

          <n-popover
            trigger="hover"
            placement="bottom"
          >
            <template #trigger>
              <n-input-number
                v-model:value="new_dataset.protion.validation"
                style="width: 20%;"
              />
            </template>
            validation
          </n-popover>

          <n-popover
            trigger="hover"
            placement="bottom"
          >
            <template #trigger>
              <n-input-number
                v-model:value="new_dataset.protion.test"
                style="width: 20%;"
              />
            </template>
            test
          </n-popover>
        </n-flex>
      </n-flex>

      <n-split
        direction="horizontal"
        style="margin-top: 20px;"
      >
        <template #1>
          <n-flex vertical>
            <n-flex align="center">
              <span style="font-weight: normal;">类别</span>
              <n-button
                style="margin-left: 10px;"
                strong
                secondary
                type="info"
                @click="gen_dataset_type_item"
              >
                新增
              </n-button>
            </n-flex>
            <n-data-table
              :columns="dataset_type_cols"
              :pagination="pagination"
              :data="dataset_type_items_for_table"
            />
          </n-flex>
        </template>
        <template #2>
          Pane 2
        </template>
      </n-split>
    </div>
  </div>
</template>

<style scoped>
.cnn-container {
    font-weight: lighter;
    font-size: .9rem;
    padding: 0 20px;
}

p {
    text-indent: 1.8rem;
    margin: 0.45rem 0;
}
</style>
