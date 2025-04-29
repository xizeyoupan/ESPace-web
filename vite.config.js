import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import GitRevisionVitePlugin from 'git-revision-vite-plugin'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
    server: {
        port: 3030,
    },
    preview: {
        port: 8080,
    },
    build: {
    },
    plugins: [
        vue(),
        GitRevisionVitePlugin(),
        tailwindcss(),
    ],
})
