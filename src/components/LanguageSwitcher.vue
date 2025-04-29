<template>
  <Menu
    as="div"
    class="relative inline-block text-left"
  >
    <MenuButton
      class=" inline-flex w-full justify-center rounded-md px-4 py-2 text-sm font-medium hover:bg-black/15 focus:outline-none"
    >
      <LanguageIcon
        class="mr-2 h-5 w-5"
        aria-hidden="true"
      />
      {{ $t('language') }}
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
        class="absolute right-0 mt-2 w-28 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black/5 focus:outline-none"
      >
        <MenuItem v-slot="{ active }">
          <button
            :class="[
              active ? 'bg-black/15' : '',
              'flex w-full items-center rounded-md px-2 py-2 text-sm',
            ]"
            @click="changeLanguage('en')"
          >
            English
          </button>
        </MenuItem>

        <MenuItem v-slot="{ active }">
          <button
            :class="[
              active ? 'bg-black/15' : '',
              'flex w-full items-center rounded-md px-2 py-2 text-sm',
            ]"
            @click="changeLanguage('zh-CN')"
          >
            中文
          </button>
        </MenuItem>
      </MenuItems>
    </Transition>
  </Menu>
</template>

<script setup>
import { Menu, MenuButton, MenuItems, MenuItem } from '@headlessui/vue'
import { LanguageIcon } from '@heroicons/vue/20/solid'
import { useI18n } from 'vue-i18n'

const { locale } = useI18n()

const changeLanguage = (lang) => {
    locale.value = lang
}
</script>

<style scoped>
</style>