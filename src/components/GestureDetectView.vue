<script setup>
import { ref, onMounted, watch } from 'vue'
import { useDeviceStore } from '../stores/device.js'
import { storeToRefs } from 'pinia'
import { useMessage, NSwitch, NButton } from "naive-ui"

const device = useDeviceStore()
const { imu_data, user_config, wsmgr } = storeToRefs(device)

var meter1 = 0
var meter2 = 0
var meter3 = 0
var roll = 0.0
var yaw = 0.0
var pitch = 0.0
var deg2rad = 0.0174533
var gauge1
var gauge2
var gauge3

function init() {

  // specify size
  //const width = 960;
  //const height = 540;
  const width = 640
  const height = 360

  // create renderer
  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    canvas: document.querySelector('#canvas0')
  })
  renderer.setClearColor(0x000000, 0) // 设置透明背景
  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.setSize(width, height)

  // create scene
  const scene = new THREE.Scene()

  // create camera
  const camera = new THREE.PerspectiveCamera(45, width / height)
  camera.position.set(0, 0, +1000)

  // create box
  //const geometry = new THREE.BoxGeometry(400, 400, 400);
  //const geometry = new THREE.BoxGeometry(400, 100, 400);
  //const geometry = new THREE.BoxGeometry(400, 100, 200);
  const geometry = new THREE.BoxGeometry(400, 100, 400)
  const material = new THREE.MeshNormalMaterial()
  const box = new THREE.Mesh(geometry, material)
  scene.add(box)

  tick()

  // A loop event that runs every frame
  function tick() {
    //box.rotation.x = roll; // in radians
    box.rotation.x = pitch // in radians
    //box.rotation.y = yaw; // in radians
    box.rotation.y = yaw * -1.0 // in radians
    //box.rotation.z = pitch; // in radians
    box.rotation.z = roll * -1.0 // in radians
    renderer.render(scene, camera) // rendering

    requestAnimationFrame(tick)
  } // tick
} // init

onMounted(() => {

  gauge1 = new RadialGauge({
    renderTo: 'canvas1',
    width: 200,
    height: 200,
    units: "Deg",
    minValue: -90,
    maxValue: 90,
    majorTicks: [
      "-90", "-60", "-30", "0", "30", "60", "90"
    ],
    minorTicks: 3,
    ticksAngle: 180,
    startAngle: 90,
    highlights: [
      { from: -90, to: 0, color: "rgba(0, 0, 255, .3)" },
      { from: 0, to: 90, color: "rgba(255, 0, 0, .75)" }
    ],
    strokeTicks: true,
    colorMajorTicks: "#ddd",
    colorMinorTicks: "#ddd",
    colorTitle: "#eee",
    colorUnits: "#ccc",
    colorNumbers: "#eee",
    //colorPlate: "#fff",
    colorPlate: "#222",
    borderShadowWidth: 0,
    borders: true,
    colorBorderOuter: "#333",
    colorBorderOuterEnd: "#111",
    //colorBorderMiddle: "#222",
    //colorBorderMiddleEnd: "#111",
    colorBorderInner: "#111",
    colorBorderInnerEnd: "#333",
    needleType: "arrow",
    needleWidth: 2,
    needleCircleSize: 7,
    needleCircleOuter: true,
    needleCircleInner: false,
    animation: false,
    animationDuration: 500,
    animationRule: "linear"
  }).draw()

  gauge2 = new RadialGauge({
    renderTo: 'canvas2',
    width: 200,
    height: 200,
    units: "Deg",
    minValue: -90,
    maxValue: 90,
    majorTicks: [
      "-90", "-60", "-30", "0", "30", "60", "90"
    ],
    minorTicks: 3,
    ticksAngle: 180,
    startAngle: 90,
    highlights: [
      { from: -90, to: 0, color: "rgba(0, 0, 255, .3)" },
      { from: 0, to: 90, color: "rgba(255, 0, 0, .75)" }
    ],
    strokeTicks: true,
    colorMajorTicks: "#ddd",
    colorMinorTicks: "#ddd",
    colorTitle: "#eee",
    colorUnits: "#ccc",
    colorNumbers: "#eee",
    //colorPlate: "#fff",
    colorPlate: "#222",
    borderShadowWidth: 0,
    borders: true,
    colorBorderOuter: "#333",
    colorBorderOuterEnd: "#111",
    //colorBorderMiddle: "#222",
    //colorBorderMiddleEnd: "#111",
    colorBorderInner: "#111",
    colorBorderInnerEnd: "#333",
    needleType: "arrow",
    needleWidth: 2,
    needleCircleSize: 7,
    needleCircleOuter: true,
    needleCircleInner: false,
    animation: false,
    animationDuration: 500,
    animationRule: "linear"
  }).draw()

  gauge3 = new RadialGauge({
    renderTo: 'canvas3',
    width: 200,
    height: 200,
    //units: "Deg",
    minValue: 0,
    maxValue: 360,
    majorTicks: [
      "0", "45", "90", "135", "180", "225", "270", "225", "0"
    ],
    minorTicks: 3,
    ticksAngle: 360,
    startAngle: 180,
    highlights: false,
    strokeTicks: true,
    colorMajorTicks: "#ddd",
    colorMinorTicks: "#ddd",
    colorTitle: "#eee",
    colorUnits: "#ccc",
    colorNumbers: "#eee",
    //colorPlate: "#fff",
    colorPlate: "#222",
    borderShadowWidth: 0,
    borders: true,
    colorBorderOuter: "#333",
    colorBorderOuterEnd: "#111",
    //colorBorderMiddle: "#222",
    //colorBorderMiddleEnd: "#111",
    colorBorderInner: "#111",
    colorBorderInnerEnd: "#333",
    needleType: "arrow",
    needleWidth: 2,
    needleCircleSize: 7,
    needleCircleOuter: true,
    needleCircleInner: false,
    animationDuration: 500,
    animationRule: "linear"
  }).draw()

  document.getElementById("canvas1").style.display = "none"
  document.getElementById("canvas2").style.display = "none"
  document.getElementById("canvas3").style.display = "none"

  init()
  update_data(["METER", "ROLL", "PITCH", ""])

})


function update_data(values) {
  switch (values[0]) {
    case 'METER':
      // console.log("gauge1=" + Object.keys(gauge1.options))
      // console.log("gauge1.options.units=" + gauge1.options.units)
      console.log("METER values[1]=" + values[1])
      console.log("METER values[2]=" + values[2])
      console.log("METER values[3]=" + values[3])
      if (values[1] != "") {
        gauge1.options.units = values[1]
        document.getElementById("canvas1").style.display = "inline-block"
        meter1 = 1
      }
      if (values[2] != "") {
        gauge2.options.units = values[2]
        document.getElementById("canvas2").style.display = "inline-block"
        meter2 = 1
      }
      if (values[3] != "") {
        gauge3.options.units = values[3]
        document.getElementById("canvas3").style.display = "inline-block"
        meter3 = 1
      }
      gauge1.update()
      gauge2.update()
      gauge3.update()
      break
    case 'DATA':
      // console.log("DATA values[1]=" + values[1])
      var val1 = parseFloat(values[1])
      gauge1.value = val1
      gauge1.update({ valueText: val1.toFixed(1) })
      roll = val1 * deg2rad
      if (meter2) {
        // console.log("DATA values[2]=" + values[2])
        var val2 = parseFloat(values[2])
        gauge2.value = val2
        gauge2.update({ valueText: val2.toFixed(1) })
        pitch = val2 * deg2rad
      }
      if (meter3) {
        // console.log("DATA values[3]=" + values[3])
        var val3 = parseFloat(values[3])
        gauge3.value = val3
        gauge3.update({ valueText: val3.toFixed(1) })
        yaw = val3 * deg2rad * -1.0
      }
      break
    default:
      break
  }
}

window.update_data = update_data

watch(
  imu_data.value,
  (newVal) => {
    update_data(['DATA', newVal.pitch, newVal.roll, null])
  },
)

</script>

<template>
  <div />
  <div id="can">

    <div style="display: flex; align-items: center;">
      <span>启用：</span>
      <n-switch :value="Boolean(user_config.enable_imu_det.data)" @update:value="(v) => {
        user_config.enable_imu_det.data = Number(v)
        wsmgr.instance.commit_config()
      }" />
      <div style="width: 50px;"></div>
      <n-button type="info" round>
        重置
      </n-button>
    </div>
    <div>
      <span>
        <span>
          Base demo：
        </span>
        <a target="_blank" href="https://github.com/nopnop2002/esp-idf-mpu6050-dmp">
          <img src="https://img.shields.io/badge/nopnop2002-esp--idf--mpu6050--dmp-brightgreen">
        </a>
      </span>
    </div>

    <div>
      <canvas id="canvas0" />
    </div>

    <div>
      <canvas id="canvas1" />
      <canvas id="canvas2" />
      <canvas id="canvas3" />
    </div>
  </div>
</template>

<style scoped>
#can {
  display: flex;
  flex-direction: column;
  align-items: center;
}
</style>
