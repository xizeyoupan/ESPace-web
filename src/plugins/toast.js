// src/plugins/toast.js
import { createVNode, render } from 'vue'
import MessageToast from '../components/MessageToast.vue'

let container = null

export let toast = (text, type = 'success') => {
    console.warn('Toast system not initialized yet:', text, type)
}

const ToastPlugin = {
    install(app) {
        app.config.globalProperties.$toast = (text, type = 'success') => {
            if (!container) {
                container = document.createElement('div')
                container.className = 'fixed top-4 left-1/2 transform -translate-x-1/2 flex-col space-y-2 z-[9999]'
                document.body.appendChild(container)
            }

            const wrapper = document.createElement('div')
            container.appendChild(wrapper)

            const vnode = createVNode(MessageToast, { text, type })
            render(vnode, wrapper)

            setTimeout(() => {
                render(null, wrapper)
                wrapper.remove()
            }, 2000)
        }

        toast = app.config.globalProperties.$toast
    }
}

export default ToastPlugin
