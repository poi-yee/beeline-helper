<template>
  <div class="auto-answer-page">
    <!-- 灰色覆盖层 -->
    <div v-if="!isAgreementChecked" class="overlay-blocker">
      <div class="overlay-content">
      <div class="warning-icon">
        <img src="C:\Users\PoiYee\Desktop\bh\beeline-helper\src\assets\huggingface_logo-noborder.svg" alt="提示图标" class="icon-img" />
      </div>
        <div class="warning-text">如要使用此功能请先阅读关于中的内容</div>
      </div>
    </div>

    <!-- 导航按钮 -->
    <div class="navigation-section">
      <button
        class="nav-btn"
        :class="{ active: currentSubpage === 'main' }"
        @click="currentSubpage = 'main'"
      >
        自动答题
      </button>
      <button
        class="nav-btn"
        :class="{ active: currentSubpage === 'settings' }"
        @click="currentSubpage = 'settings'"
      >
        答题设置
      </button>
    </div>

    <!-- 自动答题子页面 -->
    <div v-if="currentSubpage === 'main'" class="subpage-content">
      <div class="config-section">
        <div class="config-item">
          <div class="toggle-with-actions">
            <div class="action-buttons">
              <button
                class="action-btn primary"
                @click="answerCurrentQuestion"
                :disabled="isAnswering"
              >
                {{ isAnswering ? '答题中...' : '回答当前题目' }}
              </button>
              <button
                class="action-btn secondary"
                @click="answerAllQuestions"
                :disabled="isAnswering"
              >
                {{ isAnswering ? '答题中...' : '回答所有题目' }}
              </button>
              <button
                class="action-btn danger"
                @click="terminateAutoAnswer"
              >
                终止自动答题
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="results-section">
        <h3 v-if="singleResult">单次答题结果</h3>
        <!-- 单题结果 - 直接覆盖显示 -->
        <div v-if="singleResult" class="single-result">
          <div class="result-item" :class="{ success: singleResult.success, error: !singleResult.success }">
            <div class="result-header">
              <span class="result-type">{{ getTypeText(singleResult.type) }}</span>
              <span class="result-status" :class="{ success: singleResult.success, error: !singleResult.success }">
                {{ singleResult.success ? '成功' : '失败' }}
              </span>
            </div>
            <div class="result-message">{{ singleResult.message }}</div>
            <div v-if="singleResult.question" class="result-question">题目: {{ singleResult.question }}</div>
            <div v-if="singleResult.answer" class="result-answer">答案: {{ singleResult.answer }}</div>
            <div v-if="singleResult.selectedOptions && singleResult.selectedOptions.length > 0" class="result-options">
              选择: {{ singleResult.selectedOptions.join(', ') }}
            </div>
          </div>
        </div>

        <!-- 批量结果 - 有筛选按钮 -->
        <div v-if="batchResults.length > 0" class="batch-results">
          <div class="filter-buttons">
            <button
              class="filter-btn"
              :class="{ active: currentFilter === 'all' }"
              @click="currentFilter = 'all'"
            >
              全部
            </button>
            <button
              class="filter-btn"
              :class="{ active: currentFilter === 'abnormal' }"
              @click="currentFilter = 'abnormal'"
            >
              异常
            </button>
            <button
              class="filter-btn ai-filter"
              :class="{ active: currentFilter === 'ai' }"
              @click="currentFilter = 'ai'"
            >
              AI辅助
            </button>
          </div>

          <div class="results-list">
            <div
              v-for="(result, index) in filteredBatchResults"
              :key="index"
              class="result-item"
              :class="{ success: result.success, error: !result.success, 'ai-assisted': result.aiAssisted }"
            >
              <div class="result-header">
                <span class="result-type">
                  第{{ result.questionNumber }}题
                  <span v-if="result.aiAssisted" class="ai-indicator">AI辅助</span>
                </span>
                <span class="result-status" :class="{ success: result.success, error: !result.success }">
                  {{ result.success ? '成功' : '失败' }}
                </span>
              </div>
              <div class="result-message">{{ result.message }}</div>
              <div v-if="result.question" class="result-question">题目: {{ result.question }}</div>
              <div v-if="result.answer" class="result-answer">答案: {{ result.answer }}</div>
              <div v-if="result.selectedOptions && result.selectedOptions.length > 0" class="result-options">
                选择: {{ result.selectedOptions.join(', ') }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="progress-section" v-if="progressInfo">
        <h3>答题进度</h3>
        <div class="progress-info">
          <div class="progress-text">正在回答第 {{ progressInfo.current }} 题...</div>
          <div class="progress-status">{{ progressInfo.status }}</div>
        </div>
      </div>
    </div>

    <!-- 答题设置子页面 -->
    <div v-if="currentSubpage === 'settings'" class="subpage-content">
      <AnswerSettingsPage />
    </div>

    <div class="status-section" v-if="statusMessage">
      <div class="status-message" :class="{ success: isSuccess, error: !isSuccess }">
        {{ statusMessage }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { getStorageValue } from '../utils/storage.js'
import {
  autoAnswerSingleQuestion,
  autoAnswerAllQuestions
} from '../utils/autoAnswer.js'
import { stopSequentialAnswering } from '../utils/sequentialAnswer.js'
import AnswerSettingsPage from './AnswerSettingsPage.vue'

const isAnswering = ref(false)
const singleResult = ref(null)
const batchResults = ref([])
const statusMessage = ref('')
const isSuccess = ref(false)
const progressInfo = ref(null)
const currentFilter = ref('all')
const isAgreementChecked = ref(false)
const currentSubpage = ref('main') // 当前子页面：main, settings

// 从存储获取API Token
const getApiToken = async () => {
  return await getStorageValue('beelineHelper_apiToken', '') || ''
}

// 回答当前题目
const answerCurrentQuestion = async () => {
  const token = await getApiToken()
  if (!token) {
    showStatus('请先在答题设置页面设置API Token', false)
    return
  }

  isAnswering.value = true
  showStatus('正在查询答案...', true)

  try {
    const result = await autoAnswerSingleQuestion(token)

    // 单题结果直接覆盖，不保留历史
    singleResult.value = {
      type: 'single',
      ...result,
      timestamp: new Date().toLocaleTimeString()
    }

    if (result.success) {
      showStatus('答题成功！', true)
    } else {
      showStatus(`答题失败: ${result.message}`, false)
    }
  } catch (error) {
    showStatus(`答题失败: ${error.message}`, false)
  } finally {
    isAnswering.value = false
  }
}

// 回答所有题目
const answerAllQuestions = async () => {
  const token = await getApiToken()
  if (!token) {
    showStatus('请先在答题设置页面设置API Token', false)
    return
  }

  isAnswering.value = true
  progressInfo.value = null
  showStatus('开始顺序答题...', true)

  try {
    const result = await autoAnswerAllQuestions(token, (progress) => {
      progressInfo.value = progress
      showStatus(progress.status, true)
    })

    if (result.success) {
      showStatus(`顺序答题完成: ${result.message}`, true)
    } else {
      showStatus(`顺序答题失败: ${result.message}`, false)
    }

    // 批量结果存储到独立的数组中
    if (result.results && result.results.length > 0) {
      batchResults.value = result.results.map((item) => ({
        questionNumber: item.questionNumber,
        ...item,
        timestamp: new Date().toLocaleTimeString()
      }))
    }
  } catch (error) {
    showStatus(`顺序答题失败: ${error.message}`, false)
  } finally {
    isAnswering.value = false
    progressInfo.value = null
  }
}

// 显示状态消息
const showStatus = (message, success) => {
  statusMessage.value = message
  isSuccess.value = success

  // 3秒后清除状态消息
  setTimeout(() => {
    statusMessage.value = ''
  }, 3000)
}

// 获取题型文本
const getTypeText = (type) => {
  const typeMap = {
    'single': '单选题',
    'multiple': '多选题',
    'judgement': '判断题',
    'completion': '填空题',
    'subjective': '主观题',
    'batch': '批量答题'
  }
  return typeMap[type] || type
}

// 计算筛选后的批量结果
const filteredBatchResults = computed(() => {
  if (currentFilter.value === 'all') {
    return batchResults.value
  } else if (currentFilter.value === 'abnormal') {
    return batchResults.value.filter(result => !result.success)
  } else if (currentFilter.value === 'ai') {
    return batchResults.value.filter(result => result.aiAssisted)
  }
  return batchResults.value
})


// 终止自动答题
const terminateAutoAnswer = () => {
  stopSequentialAnswering();
  isAnswering.value = false
  progressInfo.value = null
  showStatus('已终止自动答题', true)
}

// 检查同意状态
const checkAgreementState = async () => {
  const savedState = await getStorageValue('beelineHelper_agreeState')
  if (savedState !== null) {
    isAgreementChecked.value = savedState
  }
}

// 页面加载时初始化
onMounted(async () => {
  // 检查同意状态
  await checkAgreementState()

  // 监听localStorage变化
  window.addEventListener('storage', checkAgreementState)
})

onUnmounted(() => {
  // 清理工作
  window.removeEventListener('storage', checkAgreementState)
})
</script>

<style scoped>
.auto-answer-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: auto;
  position: relative;
}

/* 灰色覆盖层样式 */
.overlay-blocker {
  position: absolute;
  inset: 0; /* 等价于 top:0; right:0; bottom:0; left:0; */
  background: rgba(40, 40, 40, 0.85);
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(8px);
  border-radius: 8px; /* 与浮窗圆角保持一致 */
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999; /* 更高的层级确保覆盖所有内容 */
  /* 边缘羽化效果 - 使用伪元素实现 */
  overflow: hidden;
}

.overlay-blocker::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at center, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0.6) 50%, rgba(0, 0, 0, 0.2) 80%, rgba(0, 0, 0, 0) 100%);
  pointer-events: none;
}

.overlay-content {
  text-align: center;
  background: linear-gradient(135deg, #ffffff, #f8f9fa);
  padding: 28px 24px;
  border-radius: 16px;
  max-width: 280px;
  border: 1px solid rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  /* 内容动画 */
  animation: fadeInScale 0.4s ease-out;
}

@keyframes fadeInScale {
  0% {
    opacity: 0;
    transform: scale(0.9);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

.warning-icon {
  font-size: 56px;
  margin-bottom: 20px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

.icon-text {
  display: block;
}

.warning-text {
  font-size: 16px;
  font-weight: 600;
  color: #d93025;
  line-height: 1.4;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.navigation-section {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.nav-btn {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ced4da;
  border-radius: 6px;
  background: white;
  color: #495057;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.nav-btn:hover {
  background: #f8f9fa;
}

.nav-btn.active {
  background: #007bff;
  color: white;
  border-color: #007bff;
}

.subpage-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: auto;
}

.config-section, .actions-section, .progress-section, .status-section {
  margin-bottom: 20px;
}

.results-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  margin-bottom: 20px;
}

.config-section h3, .actions-section h3, .progress-section h3, .results-section h3 {
  margin-bottom: 12px;
  font-size: 16px;
  color: #333;
}

.config-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.config-item label {
  font-size: 14px;
  color: #495057;
}

.toggle-with-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.toggle-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
  color: #495057;
  white-space: nowrap;
}

.toggle-label input[type="checkbox"] {
  display: none;
}

.toggle-slider {
  position: relative;
  width: 40px;
  height: 20px;
  background: #ced4da;
  border-radius: 20px;
  transition: all 0.3s;
}

.toggle-slider::before {
  content: '';
  position: absolute;
  width: 16px;
  height: 16px;
  background: white;
  border-radius: 50%;
  top: 2px;
  left: 2px;
  transition: all 0.3s;
}

.toggle-label input[type="checkbox"]:checked + .toggle-slider {
  background: #007bff;
}

.toggle-label input[type="checkbox"]:checked + .toggle-slider::before {
  transform: translateX(20px);
}

.token-input {
  padding: 8px 12px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 14px;
}

.token-input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.action-buttons {
  display: flex;
  flex-direction: row;
  gap: 8px;
  width: 100%;
}

.action-btn {
  padding: 8px 12px;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.action-btn.primary {
  background: #007bff;
  color: white;
}

.action-btn.primary:hover:not(:disabled) {
  background: #0056b3;
}

.action-btn.secondary {
  background: #6c757d;
  color: white;
}

.action-btn.secondary:hover:not(:disabled) {
  background: #545b62;
}

.action-btn.danger {
  background: #dc3545;
  color: white;
}

.action-btn.danger:hover:not(:disabled) {
  background: #c82333;
}

.single-result {
  margin-bottom: 16px;
}

.batch-results {
  margin-top: 16px;
}

.filter-buttons {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.filter-btn {
  padding: 6px 12px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  background: white;
  color: #495057;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-btn:hover {
  background: #f8f9fa;
}

.filter-btn.active {
  background: #007bff;
  color: white;
  border-color: #007bff;
}

.filter-btn.ai-filter.active {
  background: #ffc107;
  color: #212529;
  border-color: #ffc107;
}

.results-list {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
  max-height: 300px;
  padding-right: 4px;
}

.results-list::-webkit-scrollbar {
  width: 6px;
}

.results-list::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.results-list::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.results-list::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

.result-item {
  padding: 12px;
  margin-bottom: 8px;
  border-radius: 6px;
  border-left: 4px solid #6c757d;
}

.result-item.success {
  background: #d4edda;
  border-left-color: #28a745;
}

.result-item.error {
  background: #f8d7da;
  border-left-color: #dc3545;
}

.result-item.ai-assisted {
  background: #fff3cd;
  border-left-color: #ffc107;
}

.ai-indicator {
  background: #ffc107;
  color: #212529;
  padding: 2px 6px;
  border-radius: 12px;
  font-size: 10px;
  margin-left: 8px;
  font-weight: bold;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.result-type {
  font-size: 14px;
  font-weight: bold;
  color: #495057;
}

.result-status {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 12px;
  color: white;
}

.result-status.success {
  background: #28a745;
}

.result-status.error {
  background: #dc3545;
}

.result-message {
  font-size: 14px;
  color: #495057;
  margin-bottom: 4px;
}

.result-question, .result-answer, .result-options {
  font-size: 12px;
  color: #6c757d;
  margin-bottom: 2px;
}

.progress-section {
  background: #e9ecef;
  padding: 12px;
  border-radius: 6px;
  border-left: 4px solid #007bff;
}

.progress-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.progress-text {
  font-size: 14px;
  font-weight: bold;
  color: #495057;
}

.progress-status {
  font-size: 12px;
  color: #6c757d;
}

.status-section {
  text-align: center;
}

.status-message {
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 14px;
}

.status-message.success {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.status-message.error {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}
</style>