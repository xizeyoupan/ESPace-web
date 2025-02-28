<script setup>
import { ref, onMounted, h, reactive, computed, watchEffect, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useMessage, NMenu, NSelect, NFlex, NInput, NInputNumber, NPopover, NSplit, NDataTable, NButton, NSwitch } from "naive-ui"
import { useDeviceStore } from '../stores/device.js'
import { get } from 'idb-keyval'

const message = useMessage()
const device = useDeviceStore()

const { wifi_info, device_info, computed_data, wsmgr, dataset_data_view } = storeToRefs(device)

const nav = ref("")
const model_loading_method = ref(null)
const model_id = ref(null)
const record_ready = ref(false)
const checked_model_type_id = ref(null)

const new_dataset = reactive(
  {
    id: ref(""),
    desc: ref(""),
    type: ref(null),
    sample_tick: ref(null), //采样间隔
    sample_size: ref(null), //采样数量
    protion: {
      train: 3,
      validation: 1,
      test: 1
    },
    item_types: ref([]),
    items: ref([]),
  }
)

watch(
  () => dataset_data_view.value,
  (newVal, oldVal) => {
    // console.log("dataset_data_view changed: ", newVal)

    if (checked_model_type_id.value === null) {
      return
    }

    let dataset_size = dataset_data_view.value.getUint32(1, true)
    let ax = []
    let ay = []
    let az = []
    let gx = []
    let gy = []
    let gz = []
    for (let i = 0; i < dataset_size; i++) {
      ax.push(dataset_data_view.value.getFloat32(5 + (0 * dataset_size + i) * 4, true))
      ay.push(dataset_data_view.value.getFloat32(5 + (1 * dataset_size + i) * 4, true))
      az.push(dataset_data_view.value.getFloat32(5 + (2 * dataset_size + i) * 4, true))
      gx.push(dataset_data_view.value.getFloat32(5 + (3 * dataset_size + i) * 4, true))
      gy.push(dataset_data_view.value.getFloat32(5 + (4 * dataset_size + i) * 4, true))
      gz.push(dataset_data_view.value.getFloat32(5 + (5 * dataset_size + i) * 4, true))
    }

    let train_num = 0
    let validation_num = 0
    let test_num = 0

    new_dataset.items.forEach((item) => {
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
        protion_diff: train_num / new_dataset.items.length - new_dataset.protion.train / total_portion
      },
      {
        type: "validation",
        protion_diff: validation_num / new_dataset.items.length - new_dataset.protion.validation / total_portion
      },
      {
        type: "test",
        protion_diff: test_num / new_dataset.items.length - new_dataset.protion.test / total_portion
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
  }
)

const update_record_ready = (state) => {
  if (new_dataset.type === null) {
    message.error("请选择模型类型")
    return
  } else if (new_dataset.sample_size == null) {
    message.error("请输入采样数量")
    return
  } else if (new_dataset.sample_tick == null) {
    message.error("请输入采样间隔")
    return
  } else if (new_dataset.sample_size > 500) {
    message.error("采样数量不能超过500")
    return
  }

  if (state) {
    wsmgr.value.instance.ready_to_scan_imu_data(new_dataset)
  }
  record_ready.value = state
}

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
    title: '名称',
    key: 'comment',
    render(row, index) {
      return h(
        NInput,
        {
          value: row.comment,
          onUpdateValue(v) {
            new_dataset.item_types[index].comment = v
          }
        }
      )
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
  {
    title: '删除',
    key: 'actions',
    render(row) {
      return h(
        NButton,
        {
          strong: true,
          tertiary: true,
          size: 'small',
          onClick: () => {
            new_dataset.item_types.splice(row.id, 1)
            for (let i = row.id; i < new_dataset.item_types.length; i++) {
              new_dataset.item_types[i].id = i
            }
          }
        },
        { default: () => '删除' }
      )
    }
  },
]

const dataset_item_cols = [
  {
    title: 'id',
    key: 'id',
  },
  {
    title: '类型',
    key: 'type_id',
    render(row, index) {
      return h(
        NSelect,
        {
          value: new_dataset.items[index] ? new_dataset.items[index].type_id : "",
          onUpdateValue(v) {
            new_dataset.items[index].type_id = v
          },
          options: computed(() => {
            return new_dataset.item_types.map((item) => {
              return {
                label: item.comment + " | " + item.id,
                value: item.id
              }
            })
          }).value,
        },
      )
    }
  },
  {
    title: '采样数量',
    key: 'sample_size',
    render(row) {
      return h(
        'span',
        {},
        row.ax.length
      )
    }
  },
  // {
  //   title: '采集时间',
  //   key: 'timestamp',
  //   render(row) {
  //     return h(
  //       'span',
  //       {},
  //       new Date(row.timestamp).toLocaleString(
  //         undefined,
  //         {
  //           year: '2-digit',
  //           month: '2-digit',
  //           day: '2-digit',
  //           hour: '2-digit',
  //           minute: '2-digit',
  //           second: '2-digit',
  //           fractionalSecondDigits: 3,
  //         }
  //       )
  //     )
  //   }
  // },
  {
    title: '归类',
    key: 'set_type',
  },
  {
    title: '删除',
    key: 'actions',
    render(row) {
      return h(
        NButton,
        {
          strong: true,
          tertiary: true,
          size: 'small',
          onClick: () => {
            new_dataset.items.splice(row.id, 1)
            for (let i = row.id; i < new_dataset.items.length; i++) {
              new_dataset.items[i].id = i
            }
          }
        },
        { default: () => '删除' }
      )
    }
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
    label: "数据集",
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
    train_num: ref(0),
    validation_num: ref(0),
    test_num: ref(0),
  }
  data.key = ref(data.id)
  new_dataset.item_types.push(data)
}

const dataset_type_items_for_table = computed(() => {
  let data = new_dataset.item_types.map((item) => {

    let train_num = 0
    let validation_num = 0
    let test_num = 0

    new_dataset.items.forEach((each) => {
      if (each.type_id != item.id) {
        return
      }

      if (each.set_type === "train") {
        train_num++
      } else if (each.set_type === "validation") {
        validation_num++
      } else if (each.set_type === "test") {
        test_num++
      }
    })

    item.train_num = train_num
    item.validation_num = validation_num
    item.test_num = test_num
    return item
  })

  return data
})

const handle_type_row_check = (keys, rows, meta) => {
  //选中类别
  if (meta.action === "check") {
    checked_model_type_id.value = rows[0].id
    console.log("checked_model_type_id: ", checked_model_type_id.value, ", comment: ", new_dataset.item_types[checked_model_type_id.value].comment)
  }
}

const load_dataset = () => {

}

const save_dataset = () => {
  let dataset_s = JSON.stringify(new_dataset)

  const blob = new Blob([dataset_s], { type: 'application/json' })

  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `wand-dataset-${new_dataset.id}-${new Date().toLocaleString(
    undefined,
    {
      year: '2-digit',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }
  )}.json`

  // 触发点击事件，下载文件
  link.click()

}

</script>

<template>
  <n-menu mode="horizontal" :options="menuOptions" responsive @update:value="handleNavUpdateValue" />
  <div class="cnn-container">
    <div v-if="!nav">
      <p>
        卷积神经网络是一种深度学习模型，主要用于处理和分析图像数据。它的设计灵感源自于对生物视觉系统的理解，模拟了视觉皮层的结构和功能。CNN通过一系列的卷积层、池化层和全连接层构建而成，每一层都有特定的功能和作用。
      </p>
      <p>点按上方导航按钮以开始。</p>
    </div>

    <div v-else-if="nav === `load_model`">
      <n-flex align="center">
        <n-select v-model:value="model_loading_method" placeholder="选择载入方式" style="width: 20%;"
          :options="model_loading_options" />
        <n-select v-model:value="model_id" placeholder="选择模型" style="width: 20%;" :options="mode_list"
          @update:value="handleModelUpdateValue" />
      </n-flex>
    </div>

    <div v-else-if="nav === `new_model`">
      <n-flex align="center">
        <n-select v-model:value="model_loading_method" placeholder="选择模型类型" style="width: 20%;"
          :options="model_loading_options" />
        <n-select v-model:value="model_id" placeholder="选择模型" style="width: 20%;" :options="mode_list"
          @update:value="handleModelUpdateValue" />
      </n-flex>
    </div>

    <div v-else-if="nav === `new_dataset`">
      <n-flex vertical style="gap: 20px;">

        <n-flex align="center">
          <span>模型名称</span>
          <n-input v-model:value="new_dataset.id" type="text" placeholder="模型的id" style="width: 20%;" />
          <span>模型简介</span>
          <n-input v-model:value="new_dataset.desc" type="text" placeholder="模型的介绍" style="width: 60%;" />
          <span>模型类别</span>
          <n-popover trigger="hover" placement="bottom">
            <template #trigger>
              <n-select v-model:value="new_dataset.type" placeholder="选择模型类型" style="width: 30%;"
                :options="mode_type_list" @update:value="(value) => { record_ready = false }" />
            </template>
            <template v-if="new_dataset.type != null">
              {{ mode_type_list[new_dataset.type].desc }}
            </template>
          </n-popover>

          <n-button strong secondary type="info" @click="load_dataset">
            导入
          </n-button>
          <n-button strong secondary type="success" @click="save_dataset">
            保存
          </n-button>
        </n-flex>

        <n-flex align="center">
          <span>采样间隔</span>
          <n-popover trigger="hover" placement="bottom">
            <template #trigger>
              <n-input-number v-model:value="new_dataset.sample_tick" style="width: 30%;" clearable
                placeholder="请输入采样间隔(ms)" :min="1" @update:value="(value) => { record_ready = false }" />
            </template>
            每隔几毫秒进行一次采样
          </n-popover>
        </n-flex>

        <n-flex align="center">
          <span>采样数量</span>
          <n-popover trigger="hover" placement="bottom">
            <template #trigger>
              <n-input-number v-model:value="new_dataset.sample_size" style="width: 30%;" clearable
                placeholder="请输入数据数量" :min="10" :max="500" @update:value="(value) => { record_ready = false }" />
            </template>
            对于指令模型，如果一个周期内实际采样的点数与该值不一致，则会超采或降采样到这个值；对于连续模型，这个值就是一次推理采样到的数量。
          </n-popover>

          <n-popover trigger="hover" placement="bottom">
            <template #trigger>
              <n-input style="width: 30%;" disabled
                :value="Number(new_dataset.sample_size) * Number(new_dataset.sample_tick) + ' ms'" />
            </template>
            单次采样等效时长
          </n-popover>
        </n-flex>

        <n-flex align="center">
          <span>训练集、验证集、测试集相对比例</span>
          <n-popover trigger="hover" placement="bottom">
            <template #trigger>
              <n-input-number v-model:value="new_dataset.protion.train" style="width: 20%;" />
            </template>
            train
          </n-popover>

          <n-popover trigger="hover" placement="bottom">
            <template #trigger>
              <n-input-number v-model:value="new_dataset.protion.validation" style="width: 20%;" />
            </template>
            validation
          </n-popover>

          <n-popover trigger="hover" placement="bottom">
            <template #trigger>
              <n-input-number v-model:value="new_dataset.protion.test" style="width: 20%;" />
            </template>
            test
          </n-popover>
        </n-flex>
      </n-flex>

      <n-split direction="horizontal" style="margin-top: 20px;">
        <template #1>
          <n-flex vertical style="padding-right: 10px;">
            <n-flex align="center">
              <span style="font-weight: normal;">类别</span>
              <n-button style="margin-left: 10px;" strong secondary type="info" @click="gen_dataset_type_item">
                新增
              </n-button>
            </n-flex>
            <n-data-table :columns="dataset_type_cols" :pagination="pagination" :data="dataset_type_items_for_table"
              @update:checked-row-keys="handle_type_row_check" />
          </n-flex>
        </template>
        <template #2>
          <n-flex vertical style="padding-left: 10px;">
            <n-flex align="center">
              <span>
                采集状态：
              </span>
              <n-switch :value="record_ready" @update:value="update_record_ready" />
              <n-button style="margin-left: 10px;" strong secondary type="info"
                @click="() => { new_dataset.items.length = 0 }">
                清空
              </n-button>
              <n-button style="margin-left: 10px;" strong secondary type="info" @click="() => {
                new_dataset.items = new_dataset.items.filter(
                  (item) => {
                    return item.type_id != checked_model_type_id
                  }
                )
                for (let i = 0; i < new_dataset.items.length; i++) {
                  new_dataset.items[i].id = i
                }
              }">
                删除选中类型
              </n-button>
            </n-flex>

            <n-data-table :columns="dataset_item_cols" :pagination="pagination" :data="new_dataset.items"
              @update:checked-row-keys="handle_type_row_check" />
          </n-flex>
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
