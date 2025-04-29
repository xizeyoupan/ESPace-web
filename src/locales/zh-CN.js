import { toast } from "../plugins/toast"

export default {
    app_name: '魔棒后台',
    nav: {
        wifi_info: 'WiFi信息',
        about: '本机信息',
        gesture: '姿态检测',
        CNN: 'CNN',
    },
    language: "设置语言",
    device: {
        connected: "已连接",
    },
    connect_modal: {
        title: "设置魔杖地址",
        enable_custom_address: "启用自定义地址",
        custom_address_placeholder: "例如 {0} 或 {1}",
        connect: "连接",
    },
    toast: {
        connect_success: "连接成功",
        connect_failed: "自动连接失败",
    }
}
