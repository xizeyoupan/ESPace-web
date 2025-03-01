import { createApp } from 'vue'
import pinia from './store/index.js'
import AppProvider from './AppProvider.vue'
import router from './router'

createApp(AppProvider)
  .use(router)
  .use(pinia)
  .mount('#app')
