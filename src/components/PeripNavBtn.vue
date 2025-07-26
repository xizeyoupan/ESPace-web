<script setup>
import { Menu, MenuButton, MenuItems, MenuItem } from '@headlessui/vue'
import DropdownMenu from './DropdownMenu.vue'
</script>

<template>
  <DropdownMenu>
    <template #button>
      {{ $t('nav.peripherals') }}
    </template>

    <MenuItem v-slot="{ active }">
      <button
        :class="[active ? 'bg-black/15' : '', 'flex w-full items-center rounded-md px-2 py-2 text-sm']"
        @click=""
      >
        I2C
      </button>
    </MenuItem>

    <MenuItem v-slot="{ active }">
      <button
        :class="[active ? 'bg-black/15' : '', 'flex w-full items-center rounded-md px-2 py-2 text-sm']"
        @click=""
      >
        SPI
      </button>
    </MenuItem>

    <MenuItem v-slot="{ active }">
      <button
        :class="[active ? 'bg-black/15' : '', 'flex w-full items-center rounded-md px-2 py-2 text-sm']"
        @click=""
      >
        UART
      </button>
    </MenuItem>

    <MenuItem v-slot="{ active }">
      <button
        :class="[active ? 'bg-black/15' : '', 'flex w-full items-center rounded-md px-2 py-2 text-sm']"
        @click=""
      >
        {{ $t('nav.ir') }}
      </button>
    </MenuItem>
  </DropdownMenu>
</template>
