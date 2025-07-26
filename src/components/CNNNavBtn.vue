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
      {{ $t('nav.CNN') }}
    </template>

    <MenuItem v-slot="{ active }">
      <button
        :class="[active ? 'bg-black/15' : '', 'flex w-full items-center rounded-md px-2 py-2 text-sm']"
        @click="router.push('/cnn-train')"
      >
        {{ $t('nav.CNN_train') }}
      </button>
    </MenuItem>

    <MenuItem v-slot="{ active }">
      <button
        :class="[active ? 'bg-black/15' : '', 'flex w-full items-center rounded-md px-2 py-2 text-sm']"
        @click="router.push('/cnn-dataset')"
      >
        {{ $t('nav.CNN_dataset') }}
      </button>
    </MenuItem>

    <MenuItem v-slot="{ active }">
      <button
        :class="[active ? 'bg-black/15' : '', 'flex w-full items-center rounded-md px-2 py-2 text-sm']"
        @click="router.push('/cnn-manage')"
      >
        {{ $t('nav.CNN_manage') }}
      </button>
    </MenuItem>
  </DropdownMenu>
</template>
