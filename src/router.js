import { createWebHashHistory, createRouter } from 'vue-router'

import AboutView from './views/AboutView.vue'
import BTGamePadView from './views/BTGamePadView.vue'
import BTInfoView from './views/BTInfoView.vue'
import IRRemoteControlView from './views/IRRemoteControlView.vue'
import MusicFromNetView from './views/MusicFromNetView.vue'
import MusicToBTView from './views/MusicToBTView.vue'
import GestureDetectView from './views/GestureDetectView.vue'
import WiFiInfoView from './views/WiFiInfoView.vue'
import UserConfigView from './views/UserConfigView.vue'
import CNNDataset from './views/CNNDataset.vue'
import CNNTrain from './views/CNNTrain.vue'
import CNNManage from './views/CNNManage.vue'
import StateView from './views/StateView.vue'
import EsptoolView from './views/EsptoolView.vue'
import SquareWaveView from './views/SquareWaveView.vue'

const routes = [
    { path: '/', redirect: '/about' },
    { path: '/about', component: AboutView },
    { path: '/cnn-dataset', component: CNNDataset },
    { path: '/cnn-train', component: CNNTrain },
    { path: '/cnn-manage', component: CNNManage },
    { path: '/ble-gamepad', component: BTGamePadView },
    { path: '/bt-info', component: BTInfoView },
    { path: '/ir-control', component: IRRemoteControlView },
    { path: '/music-from-net', component: MusicFromNetView },
    { path: '/music-to-bt', component: MusicToBTView },
    { path: '/mpu', component: GestureDetectView },
    { path: '/wifi-info', component: WiFiInfoView },
    { path: '/config', component: UserConfigView },
    { path: '/stat', component: StateView },
    { path: '/esptool', component: EsptoolView },
    { path: '/square-wave', component: SquareWaveView },
]

const router = createRouter({
    history: createWebHashHistory(),
    routes,
})

export default router
