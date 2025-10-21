import { createApp } from 'vue'
import App from './App.vue'

// 创建并挂载Vue应用到页面
function initApp() {
  // 检查是否已经存在我们的应用
  if (document.getElementById('beeline-helper-app')) {
    return
  }

  // 创建应用容器
  const appContainer = document.createElement('div')
  appContainer.id = 'beeline-helper-app'
  appContainer.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    pointer-events: none;
    z-index: 9999;
  `

  document.body.appendChild(appContainer)

  // 创建Vue应用
  createApp(App).mount(appContainer)
}

// 等待页面加载完成后初始化应用
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp)
} else {
  initApp()
}