<template>
  <div class="p-6 space-y-10 text-sm text-gray-800">
    <section
      v-if="isConsoleClosed"
      id="program"
      class="space-y-6"
    >
      <h3 class="text-lg font-semibold">
        Program
      </h3>

      <!-- 波特率选择 -->
      <div
        v-if="!isConnected"
        class="flex items-center gap-2"
      >
        <label
          id="lblBaudrate"
          for="baudrates"
          class="whitespace-nowrap"
        >Baudrate:</label>
        <select
          id="baudrates"
          v-model="baudrates"
          name="baudrates"
          class="border rounded px-2 py-1 focus:outline-none focus:ring focus:border-blue-400"
        >
          <!-- <option value="921600">
            921600
          </option>
          <option value="460800">
            460800
          </option>
          <option value="230400">
            230400
          </option> -->
          <option value="115200">
            115200
          </option>
        </select>
      </div>

      <!-- 连接状态 -->
      <div
        v-if="isConnected"
        id="lblConnTo"
        class="text-green-600 font-medium"
      >
        Connected to device {{ chip ? chip : '' }}
      </div>

      <!-- 按钮操作 -->
      <div class="flex flex-wrap gap-2">
        <button
          v-if="!isConnected"
          id="connectButton"
          class="px-3 py-1 rounded bg-blue-500 text-white hover:bg-blue-600"
          @click="connect"
        >
          Connect
        </button>

        <button
          v-if="isConnected"
          id="disconnectButton"
          class="px-3 py-1 rounded bg-yellow-500 text-white hover:bg-yellow-600"
          @click="disconnect"
        >
          Disconnect
        </button>

        <button
          v-if="isConnected"
          id="eraseButton"
          class="px-3 py-1 rounded bg-red-500 text-white hover:bg-red-600 disabled:bg-red-200"
          @click="async (e) => {
            console.log(baudrates)
            if (baudrates != '115200') {
              term.writeln('Please set baudrate to 115200 for erasing flash.')
              return
            }
            e.target.disabled = true
            try {
              await esploader.eraseFlash()
            } catch (e) {
              console.error(e)
              term.writeln(`Error: ${e.message}`)
            } finally {
              e.target.disabled = false
            }
          }"
        >
          Erase Flash
        </button>
      </div>

      <!-- 文件表格 -->
      <div
        v-if="isConnected"
        class="flex space-x-2"
      >
        <input
          ref="fileInput"
          type="file"
          accept=".bin"
          class="block w-full text-sm text-gray-500 file:mr-4 file:rounded-full file:border-0 file:bg-violet-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-violet-700 hover:file:bg-violet-100 dark:file:bg-violet-600 dark:file:text-violet-100 dark:hover:file:bg-violet-500"
        >
        <button
          class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded text-sm"
          @click="program"
        >
          Program
        </button>
      </div>

      <output id="list" />
    </section>

    <!-- 🖥️ Console -->
    <section
      v-if="!isConnected"
      id="console"
      class="space-y-6"
    >
      <hr>
      <h3 class="text-lg font-semibold">
        Console
      </h3>

      <div
        v-show="connected"
        id="lblConsoleFor"
        class="text-green-600 font-medium"
      >
        Connected to device
      </div>

      <!-- 波特率选择 -->
      <div
        v-if="!device"
        class="flex items-center gap-2"
      >
        <label
          id="lblConsoleBaudrate"
          for="consoleBaudrates"
          class="whitespace-nowrap"
        >Baudrate:</label>
        <select
          id="consoleBaudrates"
          name="consoleBaudrates"
          class="border rounded px-2 py-1 focus:outline-none focus:ring focus:border-blue-400"
        >
          <option value="115200">
            115200
          </option>
          <option value="74880">
            74880
          </option>
        </select>
      </div>

      <!-- 控制按钮 -->
      <div class="flex flex-wrap gap-2">
        <button
          v-if="!device"
          id="consoleStartButton"
          class="px-3 py-1 rounded bg-blue-500 text-white hover:bg-blue-600"
          @click="start_console"
        >
          Start
        </button>
        <button
          v-if="device"
          id="consoleStopButton"
          class="px-3 py-1 rounded bg-blue-500 text-white hover:bg-blue-600"
          @click="stop_console"
        >
          Stop
        </button>
        <button
          v-if="device"
          id="resetButton"
          class="px-3 py-1 rounded bg-blue-500 text-white hover:bg-blue-600"
          @click="reset_device"
        >
          Reset
        </button>
        <button
          v-if="device"
          id="clearButton"
          class="px-3 py-1 rounded bg-blue-500 text-white hover:bg-blue-600"
          @click="term.clear()"
        >
          Clear
        </button>
      </div>
    </section>

    <!-- 📟 Terminal 区域 -->
    <div id="terminal" />
    <link
      rel="stylesheet"
      href="node_modules/@xterm/xterm/css/xterm.css"
    >
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { ESPLoader, Transport, UsbJtagSerialReset } from 'esptool-js'
import { Terminal } from '@xterm/xterm'
import { MD5 } from 'crypto-js'
import Latin1 from 'crypto-js/enc-latin1'

const term = new Terminal({ cols: 120, rows: 40 })
const baudrates = ref('115200')
const fileInput = ref(null)


onMounted(() => {
    term.open(document.getElementById('terminal'))
    term.write('Welcome to ESPTool! Waiting for device...\r\n')
})

const serialLib = navigator.serial

const connected = ref(false)
const device = ref(null)
const transport = ref(null)
const chip = ref(null)
const isConsoleClosed = ref(true)
const isConnected = ref(false)
let usbJtagSerialReset = new UsbJtagSerialReset(transport.value)
let esploader = null

const cleanUp = () => {
    device.value = null
    transport.value = null
    chip.value = null
}

const espLoaderTerminal = {
    clean() {
        term.clear()
    },
    writeLine(data) {
        term.writeln(data)
    },
    write(data) {
        term.write(data)
    },
}

const program = async () => {
    const file = fileInput.value?.files?.[0]
    if (!file) {
        term.writeln('Please select a file to program.')
        return
    }

    let data = null

    const reader = new FileReader()

    reader.onload = async () => {
        data = reader.result

        try {
            const flashOptions = {
                fileArray: [{ data: data, address: 0 }],
                flashSize: "keep",
                eraseAll: false,
                compress: true,
                reportProgress: (fileIndex, written, total) => {

                },
                calculateMD5Hash: (image) => MD5(Latin1.parse(image)),
            }

            console.log("Programming with options:", flashOptions)

            await esploader.writeFlash(flashOptions)
            await usbJtagSerialReset.reset()

            while (isConnected.value) {
                const readLoop = transport.value.rawRead()
                const { value, done } = await readLoop.next()

                if (done || !value) {
                    break
                }
                term.write(value)
            }
        } catch (e) {
            console.error(e)
            term.writeln(`Error: ${e.message}`)
        }
    }

    reader.readAsBinaryString(file)

}

const connect = async () => {
    try {
        if (device.value === null) {
            device.value = await serialLib.requestPort()
            transport.value = new Transport(device.value)
            usbJtagSerialReset = new UsbJtagSerialReset(transport.value)
        }

        const flashOptions = {
            transport: transport.value,
            baudrate: parseInt(baudrates.value),
            terminal: espLoaderTerminal,
            debugLogging: false,
        }
        esploader = new ESPLoader(flashOptions)
        chip.value = await esploader.main()

        try {
            await esploader.flashId()
        } catch (e) {
            term.writeln(`Use baudrate 115200 to specify flash ID`)
        }
        console.log("Settings done for :" + chip.value)
        isConnected.value = true
    } catch (e) {
        console.error(e)
        term.writeln(`Error: ${e.message}`)
    }
}

const disconnect = async () => {
    if (transport.value) await transport.value.disconnect()
    isConnected.value = false
    term.reset()
    cleanUp()
}

const start_console = async () => {
    if (device.value === null) {
        device.value = await serialLib.requestPort()
        transport.value = new Transport(device.value)
        usbJtagSerialReset = new UsbJtagSerialReset(transport.value)
    }

    await transport.value.connect(parseInt(consoleBaudrates.value))
    await usbJtagSerialReset.reset()

    isConsoleClosed.value = false

    while (!isConsoleClosed.value) {
        const readLoop = transport.value.rawRead()
        const { value, done } = await readLoop.next()

        if (done || !value) {
            break
        }
        term.write(value)
    }
    console.log("quitting console")
}

const stop_console = async () => {
    isConsoleClosed.value = true
    if (transport.value) {
        await transport.value.disconnect()
        await transport.value.waitForUnlock(1500)
    }
    term.reset()
    cleanUp()
}

const reset_device = async () => {
    if (transport.value) {
        await usbJtagSerialReset.reset()
    }
}

</script>
