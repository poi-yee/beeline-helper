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
    <StatusWindow
      v-if="operationLogEnabled"
      :current-status="currentStatus"
      :operation-history="operationHistory"
    />

    <!-- 控制按钮 -->
    <ControlButton
      :is-window-visible="isWindowVisible"
      @click="toggleWindow"
    />

    <!-- 全屏遮罩 About 页面 -->
    <div v-if="showAboutPage" class="about-overlay">
      <div class="about-container">
        <AboutPage @close="showAboutPage = false" />
      </div>
    </div>
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
    operationLogEnabled: operationLogEnabled.value
  }
  await setStorageValue('beelineHelper_featureStates', states)
}

// 加载功能开关状态
const loadFeatureStates = async () => {
  const states = await getStorageValue('beelineHelper_featureStates')
  if (states) {
    try {
      autoCompleteEnabled.value = states.autoCompleteEnabled || false
      autoMuteEnabled.value = states.autoMuteEnabled || false
      stateExceptionEnabled.value = states.stateExceptionEnabled || false
      autoPlayEnabled.value = states.autoPlayEnabled || false
      operationLogEnabled.value = states.operationLogEnabled !== undefined ? states.operationLogEnabled : true

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
    } catch (e) {
      console.warn('Failed to load feature states:', e)
    }
  }

  // 同时检查独立的操作日志设置
  const savedOperationLog = await getStorageValue('beeline-helper-operation-log')
  if (savedOperationLog !== null) {
    operationLogEnabled.value = savedOperationLog
  }
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

  // 如果是题目页面，自动打开自动答题页面并隐藏操作日志
  if (isQuestionPage && currentPage.value !== 'auto-answer') {
    currentPage.value = 'auto-answer'
    isWindowVisible.value = true
    operationLogEnabled.value = false
  } else if (!isQuestionPage) {
    // 如果不是题目页面，恢复操作日志显示
    operationLogEnabled.value = true
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

      // 如果是题目页面，自动打开自动答题页面并重置位置，同时隐藏操作日志
      if (currentPage.value !== 'auto-answer') {
        currentPage.value = 'auto-answer'
        isWindowVisible.value = true
        operationLogEnabled.value = false

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

          // 如果是题目页面，自动打开自动答题页面并重置位置，同时隐藏操作日志
          if (currentPage.value !== 'auto-answer') {
            currentPage.value = 'auto-answer'
            isWindowVisible.value = true
            operationLogEnabled.value = false

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
  // 停止网络请求监控
  if (window.stateExceptionOriginalFetch) {
    window.fetch = window.stateExceptionOriginalFetch
    window.stateExceptionOriginalFetch = null
  }
  if (window.stateExceptionOriginalXMLHttpRequest) {
    window.XMLHttpRequest = window.stateExceptionOriginalXMLHttpRequest
    window.stateExceptionOriginalXMLHttpRequest = null
  }

  currentStatus.value = '已停止'
  addToHistory('停止状态异常检测')
}

// 设置状态异常监控
const setupStateExceptionMonitoring = () => {
  // 使用不同的变量名避免与题目页面检测冲突
  if (window.stateExceptionOriginalFetch) return // 避免重复设置

  // 保存原始的fetch函数
  window.stateExceptionOriginalFetch = window.fetch

  window.fetch = async function(...args) {
    const url = args[0]
    const response = await window.stateExceptionOriginalFetch(...args)

    // 检查是否是学习状态报告请求
    if (typeof url === 'string' && url.includes('/api/learning-service/admin/studentLearning/videoLearnProcessReport')) {
      try {
        const responseClone = response.clone()
        const responseData = await responseClone.json()

        // 检测状态异常（code: 500）
        if (responseData.code === 500) {
          console.log('检测到学习状态异常，自动刷新页面...')
          addToHistory('检测到学习状态异常，自动刷新页面')

          // 延迟2秒后刷新页面
          setTimeout(() => {
            window.location.reload()
          }, 2000)
        }
      } catch (error) {
        console.warn('解析状态异常检测响应失败:', error)
      }
    }

    return response
  }

  // 拦截XMLHttpRequest
  if (!window.stateExceptionOriginalXMLHttpRequest) {
    window.stateExceptionOriginalXMLHttpRequest = window.XMLHttpRequest

    window.XMLHttpRequest = function() {
      const xhr = new window.stateExceptionOriginalXMLHttpRequest()
      const originalOpen = xhr.open
      const originalSend = xhr.send

      xhr.open = function(method, url, ...rest) {
        this._url = url
        return originalOpen.call(this, method, url, ...rest)
      }

      xhr.send = function(data) {
        const originalOnReadyStateChange = this.onreadystatechange

        this.onreadystatechange = function() {
          // 检查是否是学习状态报告请求
          if (this._url && this._url.includes('/api/learning-service/admin/studentLearning/videoLearnProcessReport') &&
              this.readyState === 4 && this.status === 200) {
            try {
              const responseData = JSON.parse(this.responseText)

              // 检测状态异常（code: 500）
              if (responseData.code === 500) {
                console.log('检测到学习状态异常(XHR)，自动刷新页面...')
                addToHistory('检测到学习状态异常，自动刷新页面')

                // 延迟2秒后刷新页面
                setTimeout(() => {
                  window.location.reload()
                }, 2000)
              }
            } catch (error) {
              console.warn('解析状态异常检测响应失败(XHR):', error)
            }
          }

          if (originalOnReadyStateChange) {
            originalOnReadyStateChange.apply(this, arguments)
          }
        }

        return originalSend.call(this, data)
      }

      return xhr
    }
  }
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
    operationLogEnabled
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
</style>