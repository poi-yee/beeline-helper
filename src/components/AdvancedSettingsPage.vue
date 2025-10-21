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

const emit = defineEmits(['navigate'])

const operationLogEnabled = ref(true) // 当前显示状态
const userOperationLogPref = ref(true) // 用户操作日志偏好，默认开启
const showRainbowModal = ref(false)
const fileInput = ref(null)

// 使用全局Rainbow状态
const rainbowEnabled = ref(false)
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
  // 同步全局Rainbow状态
  if (window.beelineHelperApp) {
    // 同步Rainbow启用状态
    if (window.beelineHelperApp.rainbowEnabled && typeof window.beelineHelperApp.rainbowEnabled === 'object' && 'value' in window.beelineHelperApp.rainbowEnabled) {
      rainbowEnabled.value = window.beelineHelperApp.rainbowEnabled.value
    } else if (window.beelineHelperApp.rainbowEnabled !== undefined) {
      rainbowEnabled.value = window.beelineHelperApp.rainbowEnabled
    }

    // 同步Rainbow设置
    if (window.beelineHelperApp.rainbowSettings && typeof window.beelineHelperApp.rainbowSettings === 'object' && 'value' in window.beelineHelperApp.rainbowSettings) {
      rainbowSettings.value = { ...rainbowSettings.value, ...window.beelineHelperApp.rainbowSettings.value }
    } else if (window.beelineHelperApp.rainbowSettings) {
      rainbowSettings.value = { ...rainbowSettings.value, ...window.beelineHelperApp.rainbowSettings }
    }
  }

  // 初始化用户偏好
  if (window.beelineHelperApp) {
    if (window.beelineHelperApp.userOperationLogPref && typeof window.beelineHelperApp.userOperationLogPref === 'object' && 'value' in window.beelineHelperApp.userOperationLogPref) {
      userOperationLogPref.value = window.beelineHelperApp.userOperationLogPref.value
    } else if (window.beelineHelperApp.userOperationLogPref !== undefined) {
      userOperationLogPref.value = window.beelineHelperApp.userOperationLogPref
    }

    // 显示状态完全由用户偏好决定
    operationLogEnabled.value = !!userOperationLogPref.value
  } else {
    operationLogEnabled.value = userOperationLogPref.value
  }
})

const handleOperationLogToggle = async () => {
  // 切换用户偏好（持久化的开关），而不是直接切换 transient 的显示状态
  userOperationLogPref.value = !userOperationLogPref.value

  try {
    console.log(`操作日志偏好已设置为: ${userOperationLogPref.value ? '开启' : '关闭'}`)

    // 同步主应用中的偏好与显示状态
    if (window.beelineHelperApp) {
      if (window.beelineHelperApp.userOperationLogPref && typeof window.beelineHelperApp.userOperationLogPref === 'object' && 'value' in window.beelineHelperApp.userOperationLogPref) {
        window.beelineHelperApp.userOperationLogPref.value = userOperationLogPref.value
      } else {
        window.beelineHelperApp.userOperationLogPref = userOperationLogPref.value
      }

      // 显示状态完全由用户偏好决定
      operationLogEnabled.value = !!userOperationLogPref.value

      // 直接更新主应用中的操作日志状态
      if (window.beelineHelperApp.operationLogEnabled && typeof window.beelineHelperApp.operationLogEnabled === 'object' && 'value' in window.beelineHelperApp.operationLogEnabled) {
        window.beelineHelperApp.operationLogEnabled.value = operationLogEnabled.value
      } else {
        window.beelineHelperApp.operationLogEnabled = operationLogEnabled.value
      }

      // 使用统一保存函数（如果可用）保证一致性
      if (typeof window.beelineHelperApp.saveFeatureStates === 'function') {
        try {
          await window.beelineHelperApp.saveFeatureStates()
          console.log('操作日志偏好已保存到存储')
        } catch (e) {
          console.warn('saveFeatureStates failed:', e)
        }
      } else {
        console.warn('saveFeatureStates 函数不可用')
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
    console.log(`Rainbow已${rainbowEnabled.value ? '开启' : '关闭'}`, rainbowEnabled.value)

    // 更新主应用中的Rainbow状态（支持 ref 或原始布尔）
    if (window.beelineHelperApp) {
      if (window.beelineHelperApp.rainbowEnabled && typeof window.beelineHelperApp.rainbowEnabled === 'object' && 'value' in window.beelineHelperApp.rainbowEnabled) {
        window.beelineHelperApp.rainbowEnabled.value = rainbowEnabled.value
      } else {
        window.beelineHelperApp.rainbowEnabled = rainbowEnabled.value
      }

      // 如果开启Rainbow，应用样式
      if (rainbowEnabled.value) {
        if (window.beelineHelperApp.applyRainbowStyles) {
          setTimeout(() => {
            window.beelineHelperApp.applyRainbowStyles()
          }, 100)
        }
      } else {
        if (window.beelineHelperApp.removeRainbowStyles) {
          window.beelineHelperApp.removeRainbowStyles()
        }
      }

      // 保存设置
      if (typeof window.beelineHelperApp.saveFeatureStates === 'function') {
        try { window.beelineHelperApp.saveFeatureStates() } catch (e) { console.warn('saveFeatureStates failed:', e) }
      }
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

    // 更新主应用中的Rainbow设置
    if (window.beelineHelperApp) {
      if (window.beelineHelperApp.rainbowSettings && typeof window.beelineHelperApp.rainbowSettings === 'object' && 'value' in window.beelineHelperApp.rainbowSettings) {
        window.beelineHelperApp.rainbowSettings.value = { ...rainbowSettings.value }
      } else {
        window.beelineHelperApp.rainbowSettings = { ...rainbowSettings.value }
      }

      console.log('Rainbow设置已保存')
      closeRainbowModal()

      // 如果Rainbow已开启，重新应用样式
      if (rainbowEnabled.value) {
        if (window.beelineHelperApp.applyRainbowStyles) {
          setTimeout(() => {
            window.beelineHelperApp.applyRainbowStyles()
          }, 100)
        }
      }

      // 保存设置
      if (typeof window.beelineHelperApp.saveFeatureStates === 'function') {
        try { window.beelineHelperApp.saveFeatureStates() } catch (e) { console.warn('saveFeatureStates failed:', e) }
      }
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

// 应用Rainbow样式 - 使用全局函数
const applyRainbowStyles = () => {
  if (window.beelineHelperApp && window.beelineHelperApp.applyRainbowStyles) {
    window.beelineHelperApp.applyRainbowStyles()
  }
}

// 移除Rainbow样式 - 使用全局函数
const removeRainbowStyles = () => {
  if (window.beelineHelperApp && window.beelineHelperApp.removeRainbowStyles) {
    window.beelineHelperApp.removeRainbowStyles()
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