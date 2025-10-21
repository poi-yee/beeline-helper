<template>
  <div>
    <h3>高级设置</h3>
    <div class="toggle-features">
      <div class="toggle-item">
        <span class="toggle-label">操作日志</span>
        <label class="toggle-switch">
          <input type="checkbox" :checked="operationLogEnabled" @change="handleOperationLogToggle">
          <span class="toggle-slider"></span>
        </label>
      </div>

      <div class="toggle-item">
        <div class="toggle-label-container">
          <span class="toggle-label">?Rainbow</span>
          <button class="settings-icon" @click="showRainbowSettings" title="Rainbow设置">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1Z"/>
            </svg>
          </button>
        </div>
        <label class="toggle-switch">
          <input type="checkbox" :checked="rainbowEnabled" @change="handleRainbowToggle">
          <span class="toggle-slider rainbow-toggle"></span>
        </label>
      </div>
    </div>

    <!-- Rainbow设置模态框 -->
    <div v-if="showRainbowModal" class="modal-overlay" @click="closeRainbowModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h4>Rainbow设置</h4>
          <button class="close-btn" @click="closeRainbowModal">×</button>
        </div>
        <div class="modal-body">
          <div class="setting-group">
            <label class="setting-label">背景图片</label>
            <div class="image-input-group">
              <input
                type="text"
                v-model="rainbowSettings.backgroundUrl"
                placeholder="输入图片URL或选择本地图片"
                class="url-input"
              >
              <input
                type="file"
                ref="fileInput"
                accept="image/*"
                @change="handleFileUpload"
                class="file-input"
                style="display: none;"
              >
              <button class="upload-btn" @click="triggerFileInput">选择图片</button>
            </div>
          </div>

          <div class="setting-group">
            <label class="setting-label">背景透明度</label>
            <div class="slider-group">
              <input
                type="range"
                v-model="rainbowSettings.backgroundOpacity"
                min="0.1"
                max="1"
                step="0.05"
                class="slider"
              >
              <span class="slider-value">{{ (rainbowSettings.backgroundOpacity * 100).toFixed(0) }}%</span>
            </div>
          </div>

          <div class="setting-group">
            <label class="setting-label">毛玻璃效果强度</label>
            <div class="slider-group">
              <input
                type="range"
                v-model="rainbowSettings.glassEffectIntensity"
                min="0"
                max="20"
                step="1"
                class="slider"
              >
              <span class="slider-value">{{ rainbowSettings.glassEffectIntensity }}px</span>
            </div>
          </div>

          <div class="preview-section">
            <h5>预览</h5>
            <div class="preview-box" :style="previewStyle">
              <div class="preview-glass" :style="previewGlassStyle">
                毛玻璃效果预览
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="save-btn" @click="saveRainbowSettings">保存设置</button>
          <button class="cancel-btn" @click="closeRainbowModal">取消</button>
        </div>
      </div>
    </div>

    <div class="back-btn-container">
      <button class="back-btn" @click="$emit('navigate', 'main')">返回</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { getStorageValue, setStorageValue } from '../utils/storage.js'

const emit = defineEmits(['navigate'])

const operationLogEnabled = ref(true) // 默认开启
const userOperationLogPref = ref(true) // 用户操作日志偏好，默认开启
const rainbowEnabled = ref(false)
const showRainbowModal = ref(false)
const fileInput = ref(null)

// Rainbow设置
const rainbowSettings = ref({
  backgroundUrl: 'https://images.unsplash.com/photo-1593642532973-d31b6557fa68?auto=format&fit=crop&w=1920&q=80',
  backgroundOpacity: 0.9,
  glassEffectIntensity: 12
})

// 预览样式
const previewStyle = computed(() => ({
  backgroundImage: `url(${rainbowSettings.value.backgroundUrl})`,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  opacity: rainbowSettings.value.backgroundOpacity
}))

const previewGlassStyle = computed(() => ({
  backdropFilter: `blur(${rainbowSettings.value.glassEffectIntensity}px)`
}))

onMounted(async () => {
  // Load settings from storage
  const savedOperationLog = await getStorageValue('beeline-helper-operation-log')
  const savedRainbow = await getStorageValue('beeline-helper-rainbow')
  const savedRainbowSettings = await getStorageValue('beeline-helper-rainbow-settings')

  console.log('加载Rainbow设置:', { savedRainbow, savedRainbowSettings })

  // 初始化用户偏好
  if (savedOperationLog !== null) {
    userOperationLogPref.value = savedOperationLog
  } else {
    // 如果没有保存的偏好，设为默认开启
    userOperationLogPref.value = true
  }

  // 同步主应用中的偏好
  if (window.beelineHelperApp) {
    if (window.beelineHelperApp.userOperationLogPref && typeof window.beelineHelperApp.userOperationLogPref === 'object' && 'value' in window.beelineHelperApp.userOperationLogPref) {
      window.beelineHelperApp.userOperationLogPref.value = userOperationLogPref.value
    } else {
      window.beelineHelperApp.userOperationLogPref = userOperationLogPref.value
    }

    // 根据用户偏好和是否在题目页设置当前显示状态
    let isQ = false
    try { isQ = (typeof window.beelineHelperApp.checkIsHomeworkPage === 'function') ? window.beelineHelperApp.checkIsHomeworkPage() : checkIsHomeworkPage() } catch (e) {}
    operationLogEnabled.value = isQ ? false : !!userOperationLogPref.value
  } else {
    operationLogEnabled.value = userOperationLogPref.value
  }

  if (savedRainbow !== null) {
    rainbowEnabled.value = savedRainbow
  }

  // Initialize tempRainbowSettings with default values
  let tempRainbowSettings = {
    backgroundUrl: 'https://images.unsplash.com/photo-1593642532973-d31b6557fa68?auto=format&fit=crop&w=1920&q=80',
    backgroundOpacity: 0.9,
    glassEffectIntensity: 12
  };

  // Merge loaded settings with defaults, ensuring required properties exist
  if (savedRainbowSettings && typeof savedRainbowSettings === 'object') {
    tempRainbowSettings = { ...tempRainbowSettings, ...savedRainbowSettings };
  }

  // Ensure backgroundUrl is present, even if loadedSettings was an empty object or missing it
  if (!tempRainbowSettings.backgroundUrl) {
    tempRainbowSettings.backgroundUrl = 'https://images.unsplash.com/photo-1593642532973-d31b6557fa68?auto=format&fit=crop&w=1920&q=80';
  }

  // Assign the final, validated settings to the ref
  rainbowSettings.value = tempRainbowSettings;


  // 如果Rainbow已开启，应用样式
  if (rainbowEnabled.value) {
    // 延迟应用样式，确保DOM已完全加载
    setTimeout(() => {
      applyRainbowStyles()
    }, 100)
  }

  // 同步主应用中的Rainbow状态
  if (window.beelineHelperApp && window.beelineHelperApp.rainbowEnabled !== undefined) {
    rainbowEnabled.value = window.beelineHelperApp.rainbowEnabled
  }
})

const handleOperationLogToggle = async () => {
  // 切换用户偏好（持久化的开关），而不是直接切换 transient 的显示状态
  userOperationLogPref.value = !userOperationLogPref.value

  try {
    await setStorageValue('beeline-helper-operation-log', userOperationLogPref.value)

    console.log(`操作日志偏好已设置为: ${userOperationLogPref.value ? '开启' : '关闭'}`)

    // 同步主应用中的偏好与显示状态
    if (window.beelineHelperApp) {
      if (window.beelineHelperApp.userOperationLogPref && typeof window.beelineHelperApp.userOperationLogPref === 'object' && 'value' in window.beelineHelperApp.userOperationLogPref) {
        window.beelineHelperApp.userOperationLogPref.value = userOperationLogPref.value
      } else {
        window.beelineHelperApp.userOperationLogPref = userOperationLogPref.value
      }

      // 根据当前是否在题目页，决定实际显示状态
      let isQ = false
      try { isQ = (typeof window.beelineHelperApp.checkIsHomeworkPage === 'function') ? window.beelineHelperApp.checkIsHomeworkPage() : checkIsHomeworkPage() } catch (e) {}
      operationLogEnabled.value = isQ ? false : !!userOperationLogPref.value

      // 使用统一保存函数（如果可用）保证一致性
      if (typeof window.beelineHelperApp.saveFeatureStates === 'function') {
        try { window.beelineHelperApp.saveFeatureStates() } catch (e) { console.warn('saveFeatureStates failed:', e) }
      }
    }
  } catch (e) {
    console.warn('handleOperationLogToggle 出错:', e)
  }
}

const handleRainbowToggle = async () => {
  rainbowEnabled.value = !rainbowEnabled.value

  console.log('切换Rainbow状态:', rainbowEnabled.value)

  try {
    await setStorageValue('beeline-helper-rainbow', rainbowEnabled.value)
    console.log('保存到存储:', rainbowEnabled.value)

    console.log(`Rainbow已${rainbowEnabled.value ? '开启' : '关闭'}`, rainbowEnabled.value)

    // 更新主应用中的Rainbow状态（支持 ref 或原始布尔）
    if (window.beelineHelperApp) {
      if (window.beelineHelperApp.rainbowEnabled && typeof window.beelineHelperApp.rainbowEnabled === 'object' && 'value' in window.beelineHelperApp.rainbowEnabled) {
        window.beelineHelperApp.rainbowEnabled.value = rainbowEnabled.value
      } else {
        window.beelineHelperApp.rainbowEnabled = rainbowEnabled.value
      }
    }

    // 如果开启Rainbow，应用样式
    if (rainbowEnabled.value) {
      setTimeout(() => {
        applyRainbowStyles()
      }, 100)
    } else {
      removeRainbowStyles()
    }
  } catch (e) {
    console.warn('handleRainbowToggle 出错:', e)
  }
}

const showRainbowSettings = () => {
  showRainbowModal.value = true
}

const closeRainbowModal = () => {
  showRainbowModal.value = false
}

const triggerFileInput = () => {
  fileInput.value?.click()
}

const handleFileUpload = (event) => {
  const file = event.target.files[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      rainbowSettings.value.backgroundUrl = e.target.result
    }
    reader.readAsDataURL(file)
  }
}

const saveRainbowSettings = async () => {
  try {
    console.log('保存Rainbow设置:', rainbowSettings.value)

    // 验证背景URL
    if (!rainbowSettings.value.backgroundUrl) {
      alert('请设置背景图片URL或选择本地图片')
      return
    }

    // 创建一个新的对象，避免直接引用
    const settingsToSave = {
      backgroundUrl: rainbowSettings.value.backgroundUrl,
      backgroundOpacity: rainbowSettings.value.backgroundOpacity,
      glassEffectIntensity: rainbowSettings.value.glassEffectIntensity
    }

    await setStorageValue('beeline-helper-rainbow-settings', settingsToSave)
    console.log('保存到存储:', settingsToSave)

    // 更新主应用中的Rainbow设置
    if (window.beelineHelperApp && window.beelineHelperApp.rainbowSettings) {
      window.beelineHelperApp.rainbowSettings = settingsToSave
    }

    console.log('Rainbow设置已保存')
    closeRainbowModal()

    // 如果Rainbow已开启，重新应用样式
    if (rainbowEnabled.value) {
      setTimeout(() => {
        applyRainbowStyles()
      }, 100)
    }
  } catch (error) {
    console.error('保存Rainbow设置失败:', error)

    if (error.name === 'QuotaExceededError') {
      alert('存储空间不足，无法保存设置。请选择较小的背景图片或使用URL链接。')
    } else {
      alert('保存设置失败，请重试。')
    }
  }
}

// 应用Rainbow样式
const applyRainbowStyles = () => {
  console.log('应用Rainbow样式', rainbowSettings.value)

  // 创建或更新背景层
  let bgLayer = document.getElementById('beeline-bg-layer')
  if (!bgLayer) {
    bgLayer = document.createElement('div')
    bgLayer.id = 'beeline-bg-layer'
    Object.assign(bgLayer.style, {
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      zIndex: '-1',
      pointerEvents: 'none',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      filter: 'brightness(0.95)',
      transition: 'opacity 0.5s ease-in-out',
      opacity: '0' // 初始透明
    })
    document.body.appendChild(bgLayer)
  }

  // 立即设置背景图片（即使还没加载完成）
  bgLayer.style.backgroundImage = `url(${rainbowSettings.value.backgroundUrl})`

  // 添加加载指示器
  const removeLoader = addLoadingEffect(bgLayer)

  // 预加载背景图片
  preloadBackgroundImage(rainbowSettings.value.backgroundUrl)
    .then(() => {
      // 图片加载完成后淡入背景
      setTimeout(() => {
        bgLayer.style.opacity = rainbowSettings.value.backgroundOpacity.toString()

        // 设置页面背景为透明
        document.documentElement.style.setProperty('background-color', 'transparent', 'important')
        document.body.style.setProperty('background-color', 'transparent', 'important')

        // 应用毛玻璃效果到特定元素
        applyGlassEffects()

        // 设置透明层
        applyTransparentLayers()

        // 启动DOM观察器来处理动态内容
        startDOMObserver()

        // 移除加载指示器
        setTimeout(removeLoader, 500)
      }, 100)
    })
    .catch((error) => {
      console.error('背景图片加载失败:', error)
      // 即使图片加载失败，仍然应用其他样式
      setTimeout(() => {
        bgLayer.style.opacity = rainbowSettings.value.backgroundOpacity.toString()

        document.documentElement.style.setProperty('background-color', 'transparent', 'important')
        document.body.style.setProperty('background-color', 'transparent', 'important')
        applyGlassEffects()
        applyTransparentLayers()
        startDOMObserver()

        // 移除加载指示器
        setTimeout(removeLoader, 500)
      }, 100)
    })
}

// 应用毛玻璃效果
const applyGlassEffects = () => {
  const glassConfigs = [
    {
      selectors: [
        ".el-header",
        ".card",
        ".popup",
        "#chatLayout > div.chatIndex-sidebar.noCollapsed",
        "#chatLayout > div.chatIndex-sidebar.collapsed"
      ],
      config: {
        bgColor: 'rgba(255, 255, 255, 0.18)',
        blur: `${rainbowSettings.value.glassEffectIntensity}px`,
        radius: '12px',
        exclude: ['.el-menu', '.el-menu-item', '.el-sub-menu']
      }
    },
    {
      selectors: [
        "#chatLayout > main > div > div.chat-content-inner.chat-content-inner--full > div.teacher-bank-main > ul > li",
        ".el-menu-item",
        ".el-sub-menu"
      ],
      config: {
        bgColor: 'rgba(255, 255, 255, 0.12)',
        blur: `${Math.max(rainbowSettings.value.glassEffectIntensity - 4, 0)}px`,
        radius: '10px'
      }
    },
    {
      selectors: [
        "#LayoutTeaching > main > div > div > div.tabs",
        "#LayoutTeaching > main > div > div > div.tab-pane > div:nth-child(1) > div.header",
        ".homework-list[data-v-b27e416b]"
      ],
      config: {
        bgColor: 'rgba(255, 255, 255, 0.1)',
        blur: `${Math.max(rainbowSettings.value.glassEffectIntensity - 2, 0)}px`,
        radius: '12px',
        border: '1px solid rgba(255,255,255,0.1)'
      }
    }
  ]

  glassConfigs.forEach(effect => {
    effect.selectors.forEach(selector => {
      try {
        const elements = document.querySelectorAll(selector)
        elements.forEach(el => {
          if (effect.config.exclude && effect.config.exclude.some(ex => el.matches(ex))) return

          el.style.setProperty('background-color', effect.config.bgColor, 'important')
          el.style.setProperty('backdrop-filter', `blur(${effect.config.blur})`, 'important')
          el.style.setProperty('border-radius', effect.config.radius, 'important')
          el.style.setProperty('transition', 'all 0.3s ease', 'important')

          if (effect.config.border) {
            el.style.setProperty('border', effect.config.border, 'important')
          }

          el.style.backgroundImage = 'none'
        })
      } catch (e) {
        console.error(`Invalid selector: ${selector}`, e)
      }
    })
  })
}

// 应用透明层
const applyTransparentLayers = () => {
  const transparentSelectors = [
    "#LayoutTeaching > main > div",
    "#LayoutTeaching > main > div > div > div.tab-pane > div:nth-child(1) > div.loading-container > div",
    "#chatLayout > main > div > div:nth-child(2) > div:nth-child(2) > ul",
    "#app",
    ".el-main[data-v-6b17b855]",
    "#LayoutTeaching > main > div > div > div.course-introduce-tab"
  ]

  transparentSelectors.forEach(selector => {
    try {
      const elements = document.querySelectorAll(selector)
      elements.forEach(el => {
        el.style.setProperty('background-color', 'transparent', 'important')
        el.style.backgroundImage = 'none'
      })
    } catch (e) {
      console.error(`Invalid selector: ${selector}`, e)
    }
  })
}

// 移除Rainbow样式
const removeRainbowStyles = () => {
  console.log('移除Rainbow样式')

  // 移除背景层
  const bgLayer = document.getElementById('beeline-bg-layer')
  if (bgLayer) {
    bgLayer.remove()
  }

  // 恢复页面背景
  document.documentElement.style.removeProperty('background-color')
  document.body.style.removeProperty('background-color')

  // 移除所有毛玻璃效果
  const elementsWithGlass = document.querySelectorAll('[style*="backdrop-filter"]')
  elementsWithGlass.forEach(el => {
    el.style.removeProperty('backdrop-filter')
    el.style.removeProperty('background-color')
    el.style.removeProperty('border-radius')
    el.style.removeProperty('border')
    el.style.removeProperty('transition')
  })

  // 恢复透明层
  const transparentSelectors = [
    "#LayoutTeaching > main > div",
    "#LayoutTeaching > main > div > div > div.tab-pane > div:nth-child(1) > div.loading-container > div",
    "#chatLayout > main > div > div:nth-child(2) > div:nth-child(2) > ul",
    "#app",
    ".el-main[data-v-6b17b855]",
    "#LayoutTeaching > main > div > div > div.course-introduce-tab"
  ]

  transparentSelectors.forEach(selector => {
    try {
      const elements = document.querySelectorAll(selector)
      elements.forEach(el => {
        el.style.removeProperty('background-color')
        el.style.removeProperty('background-image')
      })
    } catch (e) {
      console.error(`Invalid selector: ${selector}`, e)
    }
  })

  // 停止DOM观察器
  stopDOMObserver()
}

// DOM观察器处理动态内容
let mutationObserver = null

const startDOMObserver = () => {
  if (mutationObserver) {
    return // 观察器已经在运行
  }

  mutationObserver = new MutationObserver((mutations) => {
    let shouldReapply = false

    mutations.forEach(mutation => {
      if (mutation.addedNodes.length > 0) {
        shouldReapply = true
      }
    })

    if (shouldReapply) {
      // 延迟重新应用样式，确保新元素已完全加载
      setTimeout(() => {
        applyGlassEffects()
        applyTransparentLayers()
      }, 100)
    }
  })

  // 开始观察DOM变化
  mutationObserver.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true
  })

  console.log('DOM观察器已启动')
}

const stopDOMObserver = () => {
  if (mutationObserver) {
    mutationObserver.disconnect()
    mutationObserver = null
    console.log('DOM观察器已停止')
  }
}

// 预加载背景图片
const preloadBackgroundImage = (url) => {
  return new Promise((resolve, reject) => {
    // 如果是data URL，直接解析
    if (url.startsWith('data:')) {
      resolve()
      return
    }

    const img = new Image()

    img.onload = () => {
      console.log('背景图片预加载成功')
      resolve()
    }

    img.onerror = () => {
      console.warn('背景图片预加载失败，将使用异步加载')
      reject(new Error('图片加载失败'))
    }

    // 设置超时时间
    const timeout = setTimeout(() => {
      console.warn('背景图片加载超时，将使用异步加载')
      reject(new Error('图片加载超时'))
    }, 3000) // 3秒超时

    img.onload = () => {
      clearTimeout(timeout)
      console.log('背景图片预加载成功')
      resolve()
    }

    img.onerror = () => {
      clearTimeout(timeout)
      console.warn('背景图片预加载失败，将使用异步加载')
      reject(new Error('图片加载失败'))
    }

    img.src = url
  })
}

// 添加渐进式加载效果
const addLoadingEffect = (bgLayer) => {
  // 创建加载指示器
  const loader = document.createElement('div')
  loader.id = 'beeline-bg-loader'
  Object.assign(loader.style, {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '40px',
    height: '40px',
    border: '3px solid rgba(255,255,255,0.3)',
    borderTop: '3px solid #667eea',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    zIndex: '9999',
    pointerEvents: 'none'
  })

  // 添加旋转动画
  const style = document.createElement('style')
  style.textContent = `
    @keyframes spin {
      0% { transform: translate(-50%, -50%) rotate(0deg); }
      100% { transform: translate(-50%, -50%) rotate(360deg); }
    }
  `
  document.head.appendChild(style)

  document.body.appendChild(loader)

  // 返回移除函数
  return () => {
    if (loader.parentNode) {
      loader.remove()
    }
    if (style.parentNode) {
      style.remove()
    }
  }
}
</script>

<style scoped>
.toggle-features {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 16px;
}

.toggle-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.toggle-label-container {
  display: flex;
  align-items: center;
  gap: 8px;
}

.toggle-label {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.settings-icon {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  color: #666;
  transition: all 0.2s;
}

.settings-icon:hover {
  background: #f0f0f0;
  color: #333;
}

.toggle-switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: .4s;
  border-radius: 24px;
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: .4s;
  border-radius: 50%;
}

.toggle-switch input:checked + .toggle-slider {
  background-color: #667eea;
}

.toggle-switch input:disabled + .toggle-slider {
  background-color: #ccc;
  cursor: not-allowed;
}

.toggle-switch input:disabled + .toggle-slider:before {
  background-color: #f5f5f5;
}

.toggle-switch input:checked + .toggle-slider:before {
  transform: translateX(20px);
}

.rainbow-toggle {
  background: linear-gradient(90deg, #ff0000, #ff9900, #ffff00, #33cc33, #3399ff, #9933cc, #ff3399, #ff0000);
  background-size: 200% 100%;
  animation: rainbow-scroll 1.5s linear infinite;
}

@keyframes rainbow-scroll {
  0% { background-position: 0% 0%; }
  100% { background-position: 200% 0%; }
}

/* Rainbow设置模态框样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #f0f0f0;
}

.modal-header h4 {
  margin: 0;
  font-size: 18px;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #999;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}

.close-btn:hover {
  background: #f5f5f5;
  color: #333;
}

.modal-body {
  padding: 24px;
}

.setting-group {
  margin-bottom: 24px;
}

.setting-label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.image-input-group {
  display: flex;
  gap: 8px;
}

.url-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
}

.upload-btn {
  padding: 8px 16px;
  background: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.upload-btn:hover {
  background: #e9e9e9;
}

.slider-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.slider {
  flex: 1;
  height: 6px;
  background: #ddd;
  border-radius: 3px;
  outline: none;
  -webkit-appearance: none;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 18px;
  height: 18px;
  background: #667eea;
  border-radius: 50%;
  cursor: pointer;
}

.slider::-moz-range-thumb {
  width: 18px;
  height: 18px;
  background: #667eea;
  border-radius: 50%;
  cursor: pointer;
  border: none;
}

.slider-value {
  min-width: 40px;
  font-size: 14px;
  color: #666;
  text-align: right;
}

.preview-section {
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

.preview-section h5 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #333;
}

.preview-box {
  width: 100%;
  height: 120px;
  border-radius: 8px;
  border: 1px solid #ddd;
  position: relative;
  overflow: hidden;
}

.preview-glass {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(255, 255, 255, 0.2);
  padding: 8px 16px;
  border-radius: 6px;
  color: #333;
  font-size: 14px;
  font-weight: 500;
  backdrop-filter: blur(12px);
}

.modal-footer {
  padding: 20px 24px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.save-btn {
  padding: 8px 20px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
}

.save-btn:hover {
  background: #5a6fd8;
}

.cancel-btn {
  padding: 8px 20px;
  background: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.cancel-btn:hover {
  background: #e9e9e9;
}

.back-btn-container {
  margin-top: 20px;
  text-align: center;
}

.back-btn {
  padding: 8px 16px;
  background: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.back-btn:hover {
  background: #e9e9e9;
  border-color: #ccc;
}

h3 {
  margin: 0 0 16px 0;
  font-size: 16px;
  color: #333;
  text-align: center;
}
</style>