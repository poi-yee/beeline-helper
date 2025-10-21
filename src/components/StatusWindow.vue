<template>
  <div class="status-window">
    <div class="status-header">
      <span class="status-title">操作日志</span>
    </div>
    <div class="status-content">
      <div class="current-status">
        <span class="status-label">当前状态：</span>
        <span class="status-value" :class="getStatusClass(currentStatus)">{{ currentStatus }}</span>
      </div>
      <div class="operation-history">
        <div class="history-title">操作历史</div>
        <div class="history-list">
          <div
            v-for="(item, index) in operationHistory"
            :key="index"
            class="history-item"
          >
            <span class="history-time">{{ item.time }}</span>
            <span class="history-message">{{ item.message }}</span>
          </div>
          <div v-if="operationHistory.length === 0" class="no-history">
            暂无操作记录
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  currentStatus: {
    type: String,
    default: '未启动'
  },
  operationHistory: {
    type: Array,
    default: () => []
  }
})

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
</script>

<style scoped>
.status-window {
  position: fixed;
  left: 20px;
  bottom: 80px;
  width: 280px;
  max-height: 270px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  border: 1px solid #e0e0e0;
  z-index: 9998;
  pointer-events: auto;
  overflow: hidden;
}

.status-header {
  padding: 9px 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-size: 14px;
  font-weight: 600;
}

.status-content {
  padding: 12px 16px;
  max-height: 240px;
  overflow-y: auto;
}

.current-status {
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.status-label {
  font-size: 12px;
  color: #666;
  margin-right: 8px;
}

.status-value {
  font-size: 12px;
  font-weight: 600;
}

.status-detecting {
  color: #ff9800;
}

.status-waiting {
  color: #2196f3;
}

.status-success {
  color: #4caf50;
}

.status-no-button {
  color: #f44336;
}

.status-stopped {
  color: #9e9e9e;
}

.operation-history {
  margin-top: 8px;
}

.history-title {
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
  font-weight: 600;
}

.history-list {
  max-height: 150px;
  overflow-y: auto;
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 6px;
  padding: 4px 0;
  font-size: 11px;
  line-height: 1.3;
}

.history-time {
  color: #999;
  min-width: 45px;
  margin-right: 8px;
}

.history-message {
  color: #333;
  flex: 1;
}

.no-history {
  font-size: 11px;
  color: #999;
  text-align: center;
  padding: 8px 0;
}
</style>