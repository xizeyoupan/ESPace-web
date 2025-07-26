<script setup>
import { Menu, MenuButton, MenuItems, MenuItem } from '@headlessui/vue'
</script>

<template>
  <Menu
    as="div"
    class="relative inline-block text-left"
  >
    <MenuButton
      class="text-gray-700 inline-flex w-full justify-center rounded-md px-4 py-2 text-sm font-medium hover:bg-black/15 focus:outline-none"
    >
      <div class="text-base">
        <slot name="button" />
      </div>
    </MenuButton>

    <Transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <MenuItems
        class="absolute mt-2 w-22 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black/5 focus:outline-none"
      >
        <slot />
      </MenuItems>
    </Transition>
  </Menu>
</template>
