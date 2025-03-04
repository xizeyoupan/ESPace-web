import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import GitRevisionVitePlugin from 'git-revision-vite-plugin'

// https://vitejs.dev/config/
export default defineConfig({
  build: {
  },
  plugins: [
    vue(),
    GitRevisionVitePlugin()
  ],
})
