import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? '/jianghu1/' : './',
  plugins: [
    vue(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: '江湖',
        short_name: '江湖',
        description: '一个文字武侠放置游戏',
        theme_color: '#1a1612',
        background_color: '#1a1612',
        display: 'fullscreen',
        orientation: 'portrait',
        icons: [
          { src: 'logo.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024
      }
    })
  ],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') }
  },
  css: {
    // lightningcss 处理 CSS，降级新语法以兼容旧版 Android WebView（国产机友好）
    transformer: 'lightningcss',
    lightningcss: {
      targets: {
        android: (4 << 16) | (4 << 8), // Android 4.4
        chrome: 49 << 16, // Chrome 49
        ios_saf: (9 << 16) | (3 << 8) // iOS Safari 9.3
      },
      drafts: { customMedia: false }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false
  }
})
