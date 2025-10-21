import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import monkey from 'vite-plugin-monkey'

export default defineConfig({
  plugins: [
    vue(),
    monkey({
      entry: 'src/main.js',
      userscript: {
        name: 'Beeline Helper',
        namespace: 'beeline-helper',
        version: '1.0.0',
        description: 'A helper extension for beeline-ai.com with floating window UI',
        author: 'beeline-helper',
        match: ['*://*.beeline-ai.com/*'],
        grant: ['GM_getValue', 'GM_setValue', 'GM_deleteValue'],
        icon: 'https://www.google.com/s2/favicons?domain=beeline-ai.com&sz=32'
      },
    })
  ],
  build: {
    target: 'esnext',
    minify: false
  }
})