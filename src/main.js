import { createApp } from 'vue'
import { createPinia } from 'pinia'
import AppProvider from './AppProvider.vue'
import router from './router'

const pinia = createPinia()

createApp(AppProvider)
  .use(router)
  .use(pinia)
  .mount('#app')
