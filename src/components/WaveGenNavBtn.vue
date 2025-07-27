<script setup>
import { Menu, MenuButton, MenuItems, MenuItem } from '@headlessui/vue'
import DropdownMenu from './DropdownMenu.vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

</script>

<template>
  <DropdownMenu>
    <template #button>
      {{ $t('nav.wave_gen') }}
    </template>

    <MenuItem v-slot="{ active }">
      <button
        :class="[active ? 'bg-black/15' : '', 'flex w-full items-center rounded-md px-2 py-2 text-sm']"
        @click="router.push('/square-wave')"
      >
        {{ $t('nav.square_wave') }}
      </button>
    </MenuItem>

    <MenuItem v-slot="{ active }">
      <button
        :class="[active ? 'bg-black/15' : '', 'flex w-full items-center rounded-md px-2 py-2 text-sm']"
        @click=""
      >
        {{ $t('nav.sin_wave') }}
      </button>
    </MenuItem>

    <MenuItem v-slot="{ active }">
      <button
        :class="[active ? 'bg-black/15' : '', 'flex w-full items-center rounded-md px-2 py-2 text-sm']"
        @click=""
      >
        {{ $t('nav.any_wave') }}
      </button>
    </MenuItem>
  </DropdownMenu>
</template>
