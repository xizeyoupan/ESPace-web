// import * as tf from "@tensorflow/tfjs"
// import * as tfvis from '@tensorflow/tfjs-vis'

import { useDefaultStore } from './store/defaultStore.js'
import { reactive, ref, toRef, toRefs, toRaw } from 'vue'
import pinia from './store/index.js'

const default_store = useDefaultStore(pinia)

let X_train = []   // 训练集输入数据 (shape: [train_size, sample_size, 6])
let Y_train = []   // 训练集标签 (shape: [train_size, 1])

let X_val = []  // 验证集输入数据 (shape: [val_size, sample_size, 6])
let Y_val = []   // 验证集标签 (shape: [val_size, 1])

let X_test = []   // 测试集输入数据 (shape: [test_size, sample_size, 6])
let Y_test = []  // 测试集标签 (shape: [test_size, 1])

let model
let trainModel

// const metrics = ['loss', 'acc', 'val_loss', 'val_acc']
let container = { name: 'Model Training', tab: 'Training' }

export const load_data = async (dataset) => {
    const visorInstance = tfvis.visor()
    if (!visorInstance.isOpen()) {
        visorInstance.toggle()
    }

    console.log(dataset)

    X_train = []
    Y_train = []
    X_val = []
    Y_val = []
    X_test = []
    Y_test = []

    // item shape: [batch_size, 6 ,sample_size]
    dataset.items.forEach((item) => {
        if (item.set_type === "train") {

            X_train.push(
                [
                    item.ax,
                    item.ay,
                    item.az,
                    item.gx,
                    item.gy,
                    item.gz,
                ]
            )
            Y_train.push(item.type_id)

        } else if (item.set_type === "validation") {

            X_val.push(
                [
                    item.ax,
                    item.ay,
                    item.az,
                    item.gx,
                    item.gy,
                    item.gz,
                ]
            )
            Y_val.push(item.type_id)

        } else if (item.set_type === "test") {
            X_test.push(
                [
                    item.ax,
                    item.ay,
                    item.az,
                    item.gx,
                    item.gy,
                    item.gz,
                ]
            )
            Y_test.push(item.type_id)
        }
    })

    X_train = tf.tensor3d(X_train, [X_train.length, 6, dataset.sample_size])
    X_train = X_train.transpose([0, 2, 1])
    Y_train = tf.tensor2d(Y_train, [Y_train.length, 1])

    X_val = tf.tensor3d(X_val, [X_val.length, 6, dataset.sample_size])
    X_val = X_val.transpose([0, 2, 1])
    Y_val = tf.tensor2d(Y_val, [Y_val.length, 1])

    X_test = tf.tensor3d(X_test, [X_test.length, 6, dataset.sample_size])
    X_test = X_test.transpose([0, 2, 1])
    Y_test = tf.tensor2d(Y_test, [Y_test.length, 1])

    console.log(default_store.model_code)
    container = { name: 'Model Training', tab: 'Training' }

    model = tf.sequential()
    eval(default_store.model_code)

    await trainModel()
    console.log("训练完成！")

    const result = model.evaluate(X_test, Y_test)
    console.log(`测试集损失: ${result[0]}`)
    console.log(`测试集准确率: ${result[1]}`)
    console.log(model.optimizer)

    const preds = model.predict(X_test).argMax(-1); // 获取最大概率的类别索引
    const labels = tf.tensor1d(await Y_test.data()) // 真实标签
    console.log(labels)

    const classNames = dataset.item_types.map(item => item.comment)
    const classAccuracy = await tfvis.metrics.perClassAccuracy(labels, preds);
    container = {
        name: 'Accuracy',
        tab: 'Evaluation'
    };
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
    labels.dispose()
}
