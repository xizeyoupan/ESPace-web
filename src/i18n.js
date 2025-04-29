import { createI18n } from 'vue-i18n'

const defaultLocale = 'zh-CN'

import zhCN from './locales/zh-CN'

const loadLocaleMessages = async (locale) => {
    switch (locale) {
    case 'en':
        return import('./locales/en.js').then(m => m.default)
    case 'zh-CN':
        return import('./locales/zh-CN.js').then(m => m.default)
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
    }
})

export { i18n, loadLocaleMessages }
