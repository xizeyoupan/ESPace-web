import * as tf from "@tensorflow/tfjs"

let X_train = []   // 训练集输入数据 (shape: [train_size, sample_size, 6])
let Y_train = []   // 训练集标签 (shape: [train_size, 1])

let X_val = []  // 验证集输入数据 (shape: [val_size, sample_size, 6])
let Y_val = []   // 验证集标签 (shape: [val_size, 1])

let X_test = []   // 测试集输入数据 (shape: [test_size, sample_size, 6])
let Y_test = []  // 测试集标签 (shape: [test_size, 1])

let model

export const load_data = async (dataset) => {
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

    model = tf.sequential()

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
    model.add(tf.layers.flatten());

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

    // 输出层（3个神经元，代表三分类）
    model.add(tf.layers.dense({
        units: 3,  // 三分类
        activation: 'softmax',  // 使用 softmax 激活函数
    }))

    // 编译模型
    model.compile({
        optimizer: tf.train.adam(0.0001),
        loss: 'sparseCategoricalCrossentropy',
        metrics: ['accuracy'],
    })

    await trainModel()
    console.log("训练完成！")

    const result = model.evaluate(X_test, Y_test)
    console.log(`测试集损失: ${result[0]}`)
    console.log(`测试集准确率: ${result[1]}`)
    console.log(model.optimizer)
}

const printCallback = {
    onEpochEnd: async (epoch, logs) => {
        console.log(`Epoch ${epoch + 1}: `);
        console.log(`train_loss = ${logs.loss}, train_accuracy = ${logs.acc}`);
        console.log(`val_loss = ${logs.val_loss}, val_accuracy = ${logs.val_acc}`);
    }
}

async function trainModel() {
    await model.fit(X_train, Y_train, {
        callbacks: [printCallback],
        // batchSize: 10,
        epochs: 20,  // 设置训练轮数
        validationData: [X_val, Y_val],  // 使用验证集进行验证
    })
}
