import { createMemoryHistory, createRouter } from 'vue-router'

import AboutView from './components/AboutView.vue'

const routes = [
    { path: '/about', component: AboutView },
]

const router = createRouter({
    history: createMemoryHistory(),
    routes,
})

export default router