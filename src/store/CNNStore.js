import { defineStore } from 'pinia'
import { ref, computed, reactive } from 'vue'

export const useCNNStore = defineStore('CNN', () => {

    const model_code = ref(`// 添加第一个 1D 卷积层
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

    const dataset_data_view = ref(new DataView(new ArrayBuffer(0)))

    const dataset = reactive(
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

    const selectedModel = ref('')

    return {
        dataset_data_view, mode_type_list, model_code, dataset, selectedModel
    }
})
