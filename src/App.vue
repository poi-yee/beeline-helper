<template>
  <div class="beeline-helper">
    <!-- 悬浮窗 -->
    <FloatingWindow
      :is-visible="isWindowVisible"
      :title="pageTitle"
      :show-back-button="currentPage !== 'main'"
      :auto-answer-mode="currentPage === 'auto-answer'"
      @close="closeWindow"
      @back="goBack"
    >
      <!-- 页面切换动画容器 -->
      <div class="page-container">
        <!-- 主页面 -->
        <Transition name="page-fade" mode="out-in">
          <div v-if="currentPage === 'main'" class="page-wrapper">
            <MainPage @navigate="navigateTo" @open-about="showAboutPage = true" />
          </div>
        </Transition>

        <!-- 操作日志子页面 -->
        <Transition name="page-fade" mode="out-in">
          <div v-if="currentPage === 'auto-course'" class="page-wrapper">
            <AutoCoursePage
              :auto-complete-enabled="autoCompleteEnabled"
              :auto-mute-enabled="autoMuteEnabled"
              :state-exception-enabled="stateExceptionEnabled"
              :auto-play-enabled="autoPlayEnabled"
              @toggle-auto-complete="handleAutoCompleteToggle"
              @toggle-auto-mute="handleAutoMuteToggle"
              @toggle-state-exception="handleStateExceptionToggle"
              @toggle-auto-play="handleAutoPlayToggle"
            />
          </div>
        </Transition>

        <!-- 自动答题子页面 -->
        <Transition name="page-fade" mode="out-in">
          <div v-if="currentPage === 'auto-answer'" class="page-wrapper">
            <AutoAnswerPage />
          </div>
        </Transition>

        <!-- 高级设置子页面 -->
        <Transition name="page-fade" mode="out-in">
          <div v-if="currentPage === 'advanced-settings'" class="page-wrapper">
            <AdvancedSettingsPage @navigate="navigateTo" />
          </div>
        </Transition>
      </div>
    </FloatingWindow>



    
    <!-- 状态显示悬浮窗 -->
    <Transition name="status-fade-slide">
      <StatusWindow
        v-if="operationLogEnabled && currentPage !== 'auto-answer'"
        :current-status="currentStatus"
        :operation-history="operationHistory"
      />
    </Transition>

    <!-- 控制按钮 -->
    <ControlButton
      :is-window-visible="isWindowVisible"
      @click="toggleWindow"
    />

    <!-- 全屏遮罩 About 页面 -->
    <Transition name="about-fade-scale">
      <div v-if="showAboutPage" class="about-overlay">
        <div class="about-container">
          <AboutPage @close="showAboutPage = false" />
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import FloatingWindow from './components/FloatingWindow.vue'
import StatusWindow from './components/StatusWindow.vue'
import ControlButton from './components/ControlButton.vue'
import MainPage from './components/MainPage.vue'
import AutoCoursePage from './components/AutoCoursePage.vue'
import AutoAnswerPage from './components/AutoAnswerPage.vue'
import AdvancedSettingsPage from './components/AdvancedSettingsPage.vue'
import AboutPage from './components/AboutPage.vue'
import { getStorageValue, setStorageValue } from './utils/storage.js'

const isWindowVisible = ref(false)
const currentPage = ref('main') // 当前页面：main, auto-course (操作日志)
const autoCompleteEnabled = ref(false) // 自动点击完成按钮开关状态
const autoMuteEnabled = ref(false) // 自动静音开关状态
const stateExceptionEnabled = ref(false) // 状态异常检测开关状态
const autoPlayEnabled = ref(false) // 视频暂停自动播放开关状态
const operationLogEnabled = ref(true) // 操作日志开关状态
const rainbowEnabled = ref(false) // Rainbow效果开关状态
const rainbowSettings = ref({
  backgroundUrl: 'https://bing.img.run/rand.php',
  backgroundOpacity: 1.0,
  glassEffectIntensity: 15
}) // Rainbow设置
const autoCompleteInterval = ref(null) // 自动检测定时器
const stateExceptionInterval = ref(null) // 状态异常检测定时器
const autoPlayInterval = ref(null) // 自动播放检测定时器
const operationHistory = ref([]) // 操作历史记录
const currentStatus = ref('未启动') // 当前工作状态
const isCoursePage = ref(false) // 是否在课程页面
const showAboutPage = ref(false) // 是否显示关于页面

// 计算页面标题
const pageTitle = computed(() => {
  const titles = {
    'main': 'Beeline Helper',
    'auto-course': '全自动刷课配置',
    'auto-answer': '自动答题',
    'advanced-settings': '高级设置'
  }
  return titles[currentPage.value] || 'Beeline Helper'
})

const toggleWindow = () => {
  isWindowVisible.value = !isWindowVisible.value
}

const closeWindow = () => {
  isWindowVisible.value = false
  // 关闭窗口时回到主页面
  currentPage.value = 'main'
}

// 页面导航
const navigateTo = (page) => {
  currentPage.value = page
}

// 返回上一页
const goBack = () => {
  currentPage.value = 'main'
}


// 存储功能开关状态
const saveFeatureStates = async () => {
  const states = {
    autoCompleteEnabled: autoCompleteEnabled.value,
    autoMuteEnabled: autoMuteEnabled.value,
    stateExceptionEnabled: stateExceptionEnabled.value,
    autoPlayEnabled: autoPlayEnabled.value,
    operationLogEnabled: operationLogEnabled.value, // This is the state that controls visibility
    rainbowEnabled: rainbowEnabled.value,
    rainbowSettings: rainbowSettings.value
  }
  console.log('保存功能状态到存储:', states)
  await setStorageValue('beelineHelper_featureStates', states)
}

// 加载功能开关状态
const loadFeatureStates = async () => {
  const states = await getStorageValue('beelineHelper_featureStates')
  console.log('从存储加载功能状态:', states)
  if (states) {
    try {
      autoCompleteEnabled.value = states.autoCompleteEnabled || false
      autoMuteEnabled.value = states.autoMuteEnabled || false
      stateExceptionEnabled.value = states.stateExceptionEnabled || false
      autoPlayEnabled.value = states.autoPlayEnabled || false
      operationLogEnabled.value = states.operationLogEnabled !== undefined ? states.operationLogEnabled : true // Explicitly set based on loaded state
      rainbowEnabled.value = states.rainbowEnabled || false

      // The userOperationLogPref is now a direct reference to operationLogEnabled.
      // So no need to separately load it here.

      // 加载Rainbow设置
      if (states.rainbowSettings) {
        rainbowSettings.value = {
          backgroundUrl: states.rainbowSettings.backgroundUrl || 'https://images.unsplash.com/photo-1593642532973-d31b6557fa68?auto=format&fit=crop&w=1920&q=80',
          backgroundOpacity: states.rainbowSettings.backgroundOpacity || 0.9,
          glassEffectIntensity: states.rainbowSettings.glassEffectIntensity || 15
        }
      }

      // 根据加载的状态启动相应的功能
      if (autoCompleteEnabled.value) {
        startAutoCompleteDetection()
      }
      if (autoMuteEnabled.value) {
        startAutoMute()
      }
      if (stateExceptionEnabled.value) {
        startStateExceptionDetection()
      }
      if (autoPlayEnabled.value) {
        startAutoPlay()
      }
      if (rainbowEnabled.value) {
        // 延迟应用Rainbow样式，确保DOM已加载
        setTimeout(() => {
          applyRainbowStyles()
        }, 100)
      }
    } catch (e) {
      console.warn('Failed to load feature states:', e)
    }
  }
  // Removed redundant check for 'beeline-helper-operation-log' as all states are under 'beelineHelper_featureStates'
}

// 自动点击完成按钮开关处理
const handleAutoCompleteToggle = (enabled) => {
  autoCompleteEnabled.value = enabled
  if (enabled) {
    startAutoCompleteDetection()
  } else {
    stopAutoCompleteDetection()
  }
  saveFeatureStates()
}

// 自动静音开关处理
const handleAutoMuteToggle = (enabled) => {
  autoMuteEnabled.value = enabled
  if (enabled) {
    startAutoMute()
  } else {
    stopAutoMute()
  }
  saveFeatureStates()
}

// 状态异常检测开关处理
const handleStateExceptionToggle = (enabled) => {
  stateExceptionEnabled.value = enabled
  console.log('状态异常检测开关状态:', enabled ? '开启' : '关闭')
  if (enabled) {
    startStateExceptionDetection()
  } else {
    stopStateExceptionDetection()
  }
  saveFeatureStates()
}

// 视频暂停自动播放开关处理
const handleAutoPlayToggle = (enabled) => {
  autoPlayEnabled.value = enabled
  if (enabled) {
    startAutoPlay()
  } else {
    stopAutoPlay()
  }
  saveFeatureStates()
}

// 检查是否在作业页面
const checkIsHomeworkPage = () => {
  const currentUrl = window.location.href.toLowerCase()

  // 检查是否是题目页面（包含homeworkPaperId）
  const isQuestionPage = currentUrl.includes('homeworkpaperid')

  // 如果是题目页面，自动打开自动答题页面
  if (isQuestionPage && currentPage.value !== 'auto-answer') {
    currentPage.value = 'auto-answer'
    isWindowVisible.value = true
  }

  return isQuestionPage
}

// 拦截网络请求检测题目页面
const setupNetworkMonitoring = () => {
  if (window.originalFetch) return // 避免重复设置

  // 保存原始的fetch函数
  window.originalFetch = window.fetch

  window.fetch = async function(...args) {
    const url = args[0]

    // 检查是否是题目页面请求
    if (typeof url === 'string' && url.includes('/api/learning-service/admin/studentLearning/getHomeworkPaperDetail/')) {
      console.log('检测到题目页面请求:', url)

      // 如果是题目页面，自动打开自动答题页面并重置位置
      if (currentPage.value !== 'auto-answer') {
        currentPage.value = 'auto-answer'
        isWindowVisible.value = true

        // 重置浮窗位置到屏幕最左侧
        setTimeout(() => {
          const floatingWindow = document.querySelector('.floating-window')
          if (floatingWindow) {
            floatingWindow.style.left = '20px'
            floatingWindow.style.top = '20px'
          }
        }, 100)
      }
    }

    return window.originalFetch(...args)
  }

  // 拦截XMLHttpRequest
  if (!window.originalXMLHttpRequest) {
    window.originalXMLHttpRequest = window.XMLHttpRequest

    window.XMLHttpRequest = function() {
      const xhr = new window.originalXMLHttpRequest()
      const originalOpen = xhr.open
      const originalSend = xhr.send

      xhr.open = function(method, url, ...rest) {
        this._url = url
        return originalOpen.call(this, method, url, ...rest)
      }

      xhr.send = function(data) {
        // 检查是否是题目页面请求
        if (this._url && this._url.includes('/api/learning-service/admin/studentLearning/getHomeworkPaperDetail/')) {
          console.log('检测到题目页面请求(XHR):', this._url)

          // 如果是题目页面，自动打开自动答题页面并重置位置
          if (currentPage.value !== 'auto-answer') {
            currentPage.value = 'auto-answer'
            isWindowVisible.value = true

            // 重置浮窗位置到屏幕最左侧
            setTimeout(() => {
              const floatingWindow = document.querySelector('.floating-window')
              if (floatingWindow) {
                floatingWindow.style.left = '20px'
                floatingWindow.style.top = '20px'
              }
            }, 100)
          }
        }

        return originalSend.call(this, data)
      }

      return xhr
    }
  }
}

// 启动自动检测
const startAutoCompleteDetection = () => {
  currentStatus.value = '检测中...'
  addToHistory('开始自动检测刷课按钮')

  // 每3秒检测一次
  autoCompleteInterval.value = setInterval(autoCompleteCourse, 3000)

  // 立即执行一次检测
  autoCompleteCourse()
}

// 停止自动检测
const stopAutoCompleteDetection = () => {
  if (autoCompleteInterval.value) {
    clearInterval(autoCompleteInterval.value)
    autoCompleteInterval.value = null
  }
  currentStatus.value = '已停止'
  addToHistory('停止自动检测')
}

// 自动刷课功能
const autoCompleteCourse = () => {
  const buttonSelector = "#videoLayer > div > div > div.button-box > div.left"

  // 检查按钮是否存在
  const button = document.querySelector(buttonSelector)
  if (button) {
    // 显示状态信息
    console.log('检测到刷课按钮，3秒后自动点击...')
    currentStatus.value = '检测到按钮，等待点击...'
    addToHistory('检测到刷课按钮')

    // 延迟3秒后点击
    setTimeout(() => {
      button.click()
      console.log('已自动点击刷课按钮')
      currentStatus.value = '已点击完成按钮'
      addToHistory('已点击刷课按钮')
    }, 3000)
  } else {
    currentStatus.value = '未检测到按钮'
  }
}

// 自动静音功能
const startAutoMute = () => {
  addToHistory('开始自动静音检测')

  // 查找视频元素并静音
  const videoElements = document.querySelectorAll('video')
  if (videoElements.length > 0) {
    videoElements.forEach((video, index) => {
      video.muted = true
      console.log(`已静音视频 ${index + 1}`)
    })
    addToHistory(`已静音 ${videoElements.length} 个视频`)
  } else {
    addToHistory('未找到视频元素')
  }

  // 监听新视频元素的创建
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === 1) { // Element node
          // 检查新增节点中的视频元素
          const videos = node.querySelectorAll ? node.querySelectorAll('video') : []
          videos.forEach((video) => {
            video.muted = true
            console.log('检测到新视频，已自动静音')
            addToHistory('检测到新视频，已自动静音')
          })

          // 如果节点本身就是视频元素
          if (node.tagName === 'VIDEO') {
            node.muted = true
            console.log('检测到新视频，已自动静音')
            addToHistory('检测到新视频，已自动静音')
          }
        }
      })
    })
  })

  // 开始观察DOM变化
  observer.observe(document.body, {
    childList: true,
    subtree: true
  })

  // 保存observer以便后续停止
  window.beelineHelperMuteObserver = observer
}

// 停止自动静音
const stopAutoMute = () => {
  // 停止观察DOM变化
  if (window.beelineHelperMuteObserver) {
    window.beelineHelperMuteObserver.disconnect()
    window.beelineHelperMuteObserver = null
  }

  // 恢复视频音量
  const videoElements = document.querySelectorAll('video')
  videoElements.forEach((video, index) => {
    video.muted = false
    console.log(`已恢复视频 ${index + 1} 音量`)
  })

  addToHistory('已停止自动静音')
}


// 启动状态异常检测
const startStateExceptionDetection = () => {
  addToHistory('开始状态异常检测')
  currentStatus.value = '监控学习状态...'

  // 设置网络请求监控
  setupStateExceptionMonitoring()
}

// 停止状态异常检测
const stopStateExceptionDetection = () => {
  // 停止DOM状态检测定时器
  if (stateExceptionInterval.value) {
    clearInterval(stateExceptionInterval.value)
    stateExceptionInterval.value = null
  }

  currentStatus.value = '已停止'
  addToHistory('停止状态异常检测')
}

// 设置状态异常监控
const setupStateExceptionMonitoring = () => {
  // 每2秒检测一次DOM状态
  stateExceptionInterval.value = setInterval(() => {
    const messageElement = document.querySelector('.el-message-box__container > div > p')

    if (messageElement) {
      const messageText = messageElement.textContent.trim()

      // 检测状态异常消息
      if (messageText === '当前视频不允许倍速播放' ||
          messageText === '系统检测到你的学习状态异常，请刷新后继续学习' ||
          messageText === '播放位置不合法') {
        console.log(`检测到状态异常消息: "${messageText}"，自动刷新页面...`)
        addToHistory(`检测到状态异常消息: "${messageText}"，自动刷新页面`)

        // 延迟2秒后刷新页面
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      }
    }
  }, 2000)
}

// 启动视频暂停自动播放检测
const startAutoPlay = () => {
  addToHistory('开始视频暂停自动播放检测')
  currentStatus.value = '检测视频暂停状态...'

  // 每2秒检测一次视频暂停状态
  autoPlayInterval.value = setInterval(checkVideoPaused, 2000)

  // 立即执行一次检测
  checkVideoPaused()
}

// 停止视频暂停自动播放检测
const stopAutoPlay = () => {
  if (autoPlayInterval.value) {
    clearInterval(autoPlayInterval.value)
    autoPlayInterval.value = null
  }
  currentStatus.value = '已停止'
  addToHistory('停止视频暂停自动播放检测')
}

// 检测视频暂停状态并自动播放
const checkVideoPaused = () => {
  const videoElements = document.querySelectorAll('video')

  if (videoElements.length > 0) {
    videoElements.forEach((video, index) => {
      // 检查视频是否已加载元数据且处于暂停状态
      if (video.readyState >= 1 && video.paused && !video.ended) {
        console.log(`检测到视频 ${index + 1} 暂停，自动开始播放...`)
        currentStatus.value = '检测到视频暂停，自动播放...'
        addToHistory(`检测到视频 ${index + 1} 暂停，自动播放`)

        // 延迟1秒后播放，避免频繁触发
        setTimeout(() => {
          video.play().catch(error => {
            console.warn(`视频 ${index + 1} 自动播放失败:`, error)
            addToHistory(`视频 ${index + 1} 自动播放失败`)
          })
        }, 1000)
      }
    })
  }
}

// 添加操作历史
const addToHistory = (message) => {
  if (!operationLogEnabled.value) return

  const timestamp = new Date().toLocaleTimeString()
  operationHistory.value.unshift({
    time: timestamp,
    message: message
  })

  // 只保留最近10条记录
  if (operationHistory.value.length > 10) {
    operationHistory.value = operationHistory.value.slice(0, 10)
  }
}

// 获取状态样式类
const getStatusClass = (status) => {
  const statusClasses = {
    '检测中...': 'status-detecting',
    '检测到按钮，等待点击...': 'status-waiting',
    '已点击完成按钮': 'status-success',
    '未检测到按钮': 'status-no-button',
    '已停止': 'status-stopped'
  }
  return statusClasses[status] || ''
}

// 监听页面变化
const handlePageChange = () => {
  checkIsHomeworkPage()
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

  // 创建或更新黑色叠加层
  let overlayLayer = document.getElementById('beeline-overlay-layer')
  if (!overlayLayer) {
    overlayLayer = document.createElement('div')
    overlayLayer.id = 'beeline-overlay-layer'
    Object.assign(overlayLayer.style, {
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      zIndex: '-1',
      pointerEvents: 'none',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      transition: 'opacity 0.5s ease-in-out',
      opacity: '0' // 初始透明
    })
    document.body.appendChild(overlayLayer)
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
        // 设置背景层完全不透明，黑色叠加层使用用户设置的透明度
        bgLayer.style.opacity = '1'
        overlayLayer.style.opacity = (1 - rainbowSettings.value.backgroundOpacity).toString()

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

        // 初始删除已存在的元素
        setTimeout(() => {
          removeCourseIntroduceTabElements()
        }, 200)
      }, 100)
    })
    .catch((error) => {
      console.error('背景图片加载失败:', error)
      // 即使图片加载失败，仍然应用其他样式
      setTimeout(() => {
        // 设置背景层完全不透明，黑色叠加层使用用户设置的透明度
        bgLayer.style.opacity = '1'
        overlayLayer.style.opacity = (1 - rainbowSettings.value.backgroundOpacity).toString()

        document.documentElement.style.setProperty('background-color', 'transparent', 'important')
        document.body.style.setProperty('background-color', 'transparent', 'important')
        applyGlassEffects()
        applyTransparentLayers()
        startDOMObserver()

        // 移除加载指示器
        setTimeout(removeLoader, 500)

        // 初始删除已存在的元素
        setTimeout(() => {
          removeCourseIntroduceTabElements()
        }, 200)
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
        "#chatLayout > div.chatIndex-sidebar.collapsed",
        "#LayoutTeaching > main > div > div"
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
    "#LayoutTeaching > main > div > div > div.course-introduce-tab",
    "#LayoutTeaching > main > div > div > div.course-courseWare__body"
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

  // 移除黑色叠加层
  const overlayLayer = document.getElementById('beeline-overlay-layer')
  if (overlayLayer) {
    overlayLayer.remove()
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
    let shouldRemoveElements = false

    mutations.forEach(mutation => {
      if (mutation.addedNodes.length > 0) {
        shouldReapply = true

        // 检查新增节点中是否包含需要删除的元素
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === 1) { // Element node
            if (node.classList && node.classList.contains('course-introduce-tab__content')) {
              shouldRemoveElements = true
            }
            // 检查子元素
            if (node.querySelectorAll) {
              const contentElements = node.querySelectorAll('.course-introduce-tab__content')
              const tabElement = node.querySelector("#LayoutTeaching > main > div > div > div.course-introduce-tab")
              if (contentElements.length > 0 || tabElement) {
                shouldRemoveElements = true
              }
            }
          }
        })
      }
    })

    if (shouldRemoveElements) {
      // 延迟删除，确保元素已完全加载
      setTimeout(() => {
        removeCourseIntroduceTabElements()
      }, 50)
    }

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

// 删除 course-introduce-tab 相关元素
const removeCourseIntroduceTabElements = () => {
  // 删除 class="course-introduce-tab__content" 的元素
  const contentElements = document.querySelectorAll('.course-introduce-tab__content')
  contentElements.forEach(element => {
    element.remove()
    console.log('已删除 course-introduce-tab__content 元素')
  })

  // 删除特定路径的 course-introduce-tab 元素
  const tabElement = document.querySelector("#LayoutTeaching > main > div > div > div.course-introduce-tab")
  if (tabElement) {
    tabElement.remove()
    console.log('已删除特定 course-introduce-tab 元素')
  }

  if (contentElements.length > 0 || tabElement) {
    console.log(`已删除 ${contentElements.length} 个 course-introduce-tab__content 元素和 ${tabElement ? 1 : 0} 个特定 course-introduce-tab 元素`)
  }
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

// 添加事件监听器
onMounted(async () => {
  // 监听页面变化
  window.addEventListener('popstate', handlePageChange)
  window.addEventListener('hashchange', handlePageChange)

  // 设置网络请求监控
  setupNetworkMonitoring()

  // 加载存储的功能开关状态
  await loadFeatureStates()

  // 暴露应用实例以便其他组件访问
  window.beelineHelperApp = {
    operationLogEnabled,
    userOperationLogPref: operationLogEnabled, // 将 operationLogEnabled 直接暴露为用户操作日志偏好
    rainbowEnabled,
    rainbowSettings,
    applyRainbowStyles,
    removeRainbowStyles,
    saveFeatureStates,
    checkIsHomeworkPage
  }


})

onUnmounted(() => {
  // 移除页面变化监听器
  window.removeEventListener('popstate', handlePageChange)
  window.removeEventListener('hashchange', handlePageChange)
})
</script>

<style scoped>
.beeline-helper {
  pointer-events: auto;
}

/* 页面容器 */
.page-container {
  position: relative;
  height: 100%;
  overflow: hidden;
}

/* 页面包装器 */
.page-wrapper {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

/* 页面切换动画 - 淡入淡出 */
.page-fade-enter-active,
.page-fade-leave-active {
  transition: opacity 0.3s ease;
}

.page-fade-enter-from,
.page-fade-leave-to {
  opacity: 0;
}

.page-fade-enter-to,
.page-fade-leave-from {
  opacity: 1;
}

/* 全屏遮罩层 */
.about-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(4px);
  z-index: 9999;

  display: flex;
  align-items: center;
  justify-content: center;
}

/* 居中 About 容器（约占屏幕 80%） */
.about-container {
  width: 80%;
  height: 80%;
  max-width: 1400px;
  max-height: 770px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
  overflow: auto;
  animation: fadeIn 0.3s ease;
}

/* 弹出过渡 */
@keyframes fadeIn {
  from {
    transform: scale(0.95);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

/* About 页面过渡动画 */
.about-fade-scale-enter-active,
.about-fade-scale-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.about-fade-scale-enter-from,
.about-fade-scale-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

.about-fade-scale-enter-to,
.about-fade-scale-leave-from {
  opacity: 1;
  transform: scale(1);
}

.status-fade-slide-enter-active {
  transition: opacity 0.3s ease-out, transform 0.3s ease-out;
}

.status-fade-slide-leave-active {
  transition: opacity 0.3s ease-in, transform 0.3s ease-in;
}

.status-fade-slide-enter-from,
.status-fade-slide-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

.status-fade-slide-enter-to,
.status-fade-slide-leave-from {
  opacity: 1;
  transform: translateX(0);
}
</style>