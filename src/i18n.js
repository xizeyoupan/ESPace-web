import { createI18n } from 'vue-i18n'

const defaultLocale = 'zh-CN'

import zhCN from './locales/zh-CN'
import en from './locales/en'


const loadLocaleMessages = async (locale) => {
    switch (locale) {
    case 'en':
        return en
    case 'zh-CN':
        return zhCN
    default:
        return {}
    }
}

const i18n = createI18n({
    legacy: false,
    globalInjection: true,
    locale: defaultLocale,
    fallbackLocale: 'en',
    messages: {
        'zh-CN': zhCN,
        'en': en,
    }
})

export { i18n, loadLocaleMessages }
