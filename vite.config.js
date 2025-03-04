import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import GitRevisionVitePlugin from 'git-revision-vite-plugin'

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_debugger: true, // 移除 debugger
      },
      format: {
        comments: false, // 去掉所有注释
      }
    }
  },
  plugins: [
    vue(),
    GitRevisionVitePlugin()
  ],
})
