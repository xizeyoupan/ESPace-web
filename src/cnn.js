// import * as tf from "@tensorflow/tfjs"
// import * as tfvis from '@tensorflow/tfjs-vis'

import { useInfoStore } from './store/infoStore.js'
import { reactive, ref, toRef, toRefs, toRaw } from 'vue'
import pinia from './store/index.js'
import { toast } from './plugins/toast.js'
import { i18n } from './i18n.js'
const t = i18n.global.t

const info_store = useInfoStore(pinia)

let X_train = [] // 训练集输入数据 (shape: [train_size, sample_size, 6])
let Y_train = [] // 训练集标签 (shape: [train_size, 1])

let X_val = [] // 验证集输入数据 (shape: [val_size, sample_size, 6])
let Y_val = [] // 验证集标签 (shape: [val_size, 1])

let X_test = [] // 测试集输入数据 (shape: [test_size, sample_size, 6])
let Y_test = [] // 测试集标签 (shape: [test_size, 1])

let model
let trainModel

// const metrics = ['loss', 'acc', 'val_loss', 'val_acc']
let container

tf.env().set("WEBGL_DELETE_TEXTURE_THRESHOLD", 1024 * 1000 * 1000)

const visorInstance = tfvis.visor()
if (visorInstance.isOpen()) {
    visorInstance.toggle()
}

export const toggle_visor = () => {
    if (!visorInstance.isOpen()) {
        visorInstance.toggle()
    }
}

export const load_data = async (dataset) => {

    X_train = []
    Y_train = []
    X_val = []
    Y_val = []
    X_test = []
    Y_test = []

    // item shape: [batch_size, 6 ,sample_size]
    dataset.items.forEach((item) => {

        const ax = item.ax.map(v => v / 4)
        const ay = item.ay.map(v => v / 4)
        const az = item.az.map(v => v / 4)
        const gx = item.gx.map(v => v / 500)
        const gy = item.gy.map(v => v / 500)
        const gz = item.gz.map(v => v / 500)

        if (item.set_type === "train") {

            X_train.push(
                [
                    ax,
                    ay,
                    az,
                    gx,
                    gy,
                    gz,
                ]
            )
            Y_train.push(item.type_id)

        } else if (item.set_type === "validation") {

            X_val.push(
                [
                    ax,
                    ay,
                    az,
                    gx,
                    gy,
                    gz,
                ]
            )
            Y_val.push(item.type_id)

        } else if (item.set_type === "test") {
            X_test.push(
                [
                    ax,
                    ay,
                    az,
                    gx,
                    gy,
                    gz,
                ]
            )
            Y_test.push(item.type_id)
        }
    })

    X_train = tf.tensor3d(X_train, [X_train.length, 6, dataset.sample_size])
    // [batch_size, channels, time_steps]
    // X_train = X_train.transpose([0, 2, 1])
    // [batch_size, time_steps, channels]
    Y_train = tf.tensor2d(Y_train, [Y_train.length, 1])

    X_val = tf.tensor3d(X_val, [X_val.length, 6, dataset.sample_size])
    // X_val = X_val.transpose([0, 2, 1])
    Y_val = tf.tensor2d(Y_val, [Y_val.length, 1])

    X_test = tf.tensor3d(X_test, [X_test.length, 6, dataset.sample_size])
    // X_test = X_test.transpose([0, 2, 1])
    Y_test = tf.tensor2d(Y_test, [Y_test.length, 1])

}

export const train = async (dataset, model_code) => {
    toast(t('toast.train_start'), 'info')

    toggle_visor()

    await load_data(dataset)

    try {
        visorInstance.setActiveTab('Training')
    } catch (e) {
        console.warn('Error setting active tab:', e)
    }

    container = { name: 'Model Training', tab: 'Training' }
    model = tf.sequential()
    eval(model_code)

    await trainModel()
    toast(t('toast.train_success'), 'success')

    container = {
        name: 'Model Summary',
        tab: 'Model Inspection'
    }
    tfvis.show.modelSummary(container, model)

    const result = model.evaluate(X_test, Y_test)

    const preds = model.predict(X_test).argMax(-1) // 获取最大概率的类别索引
    const labels = tf.tensor1d(await Y_test.data()) // 真实标签

    const classNames = dataset.item_types.map(item => item.comment)
    const classAccuracy = await tfvis.metrics.perClassAccuracy(labels, preds)
    container = {
        name: 'Accuracy',
        tab: 'Evaluation'
    }
    tfvis.show.perClassAccuracy(container, classAccuracy, classNames)

    const confusionMatrix = await tfvis.metrics.confusionMatrix(labels, preds)
    container = {
        name: 'Confusion Matrix',
        tab: 'Evaluation'
    }
    tfvis.render.confusionMatrix(container, {
        values: confusionMatrix,
        tickLabels: classNames
    })

    X_train.dispose()
    Y_train.dispose()
    X_val.dispose()
    Y_val.dispose()
    X_test.dispose()
    Y_test.dispose()
    labels.dispose()
    preds.dispose()

    console.log(`numBytesInGPUAllocated: ${tf.memory().numBytesInGPUAllocated}`)

    return result
}

export const save_model = async (name, suffix, tick) => {
    const randomHex = Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0')
    await model.save(`downloads://tfjs.${tick}.${suffix}.${name}.${randomHex}`)
}
