import { createWebHashHistory, createRouter } from 'vue-router'

import AboutView from './components/AboutView.vue'
import BTGamePadView from './components/BTGamePadView.vue'
import BTInfoView from './components/BTInfoView.vue'
import DevModeView from './components/DevModeView.vue'
import IRRemoteControlView from './components/IRRemoteControlView.vue'
import MusicFromNetView from './components/MusicFromNetView.vue'
import MusicToBTView from './components/MusicToBTView.vue'
import GestureDetectView from './components/GestureDetectView.vue'
import WiFiInfoView from './components/WiFiInfoView.vue'
import UserConfigView from './components/UserConfigView.vue'
import CNNView from './components/CNNView.vue'

const routes = [
  { path: '/', redirect: '/about' },
  { path: '/about', component: AboutView },
  { path: '/cnn', component: CNNView },
  { path: '/ble-gamepad', component: BTGamePadView },
  { path: '/bt-info', component: BTInfoView },
  { path: '/dev', component: DevModeView },
  { path: '/ir-control', component: IRRemoteControlView },
  { path: '/music-from-net', component: MusicFromNetView },
  { path: '/music-to-bt', component: MusicToBTView },
  { path: '/gesture-detection', component: GestureDetectView },
  { path: '/wifi-info', component: WiFiInfoView },
  { path: '/config', component: UserConfigView },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

export default router