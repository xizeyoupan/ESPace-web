import { createApp } from 'vue'
import pinia from './store/index.js'
import AppProvider from './AppProvider.vue'
import router from './router'
import { i18n } from './i18n'
import ToastPlugin from './plugins/toast.js'
import WsPlugin from './plugins/ws.js'
import { get, set } from 'idb-keyval'

const t = i18n.global.t

const browserLang = navigator.language || navigator.userLanguage
if (['en', 'zh-CN'].includes(browserLang)) {
    i18n.global.locale.value = browserLang
}

createApp(AppProvider)
    .use(router)
    .use(pinia)
    .use(i18n)
    .use(ToastPlugin)
    .use(WsPlugin)
    .mount('#app')
