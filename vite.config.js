import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import monkey from 'vite-plugin-monkey'
import fs from 'fs'
import { version } from './package.json'

const iconBase64 = fs.readFileSync('src/assets/icon.jpg', 'base64')

export default defineConfig({
  plugins: [
    vue(),
    monkey({
      entry: 'src/main.js',
      userscript: {
        name: '芯位助手-Beeline Helper',
        namespace: 'https://github.com/poi-yee/51xinweiauto',
        version,
        description: '芯位蜜线/教育 自动播放，自动刷作业',
        author: 'PoiYee,Code-dogcreatior',
        match: ['*://*.beeline-ai.com/*'],
        grant: ['GM_getValue', 'GM_setValue', 'GM_deleteValue'],
        icon: `data:image/png;base64,${iconBase64}`
      },
    })
  ],
  build: {
    target: 'esnext',
    minify: false
  }
})