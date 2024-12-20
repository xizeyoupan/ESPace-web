import { defineStore } from 'pinia'
import { ref, } from 'vue'

export const useDeviceStore = defineStore('device', () => {
    const count = ref(0)
    const isOnline = ref(false)
    const host = ref("")
    const use_user_host = ref(false)
    const user_host = ref("")

    return { count, isOnline, host, use_user_host, user_host }
})
