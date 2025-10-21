<template>
  <div>
    <p>欢迎使用 Beeline Helper！</p>
    <div class="features">
      <button class="feature-btn" @click="$emit('navigate', 'auto-course')">全自动刷课配置</button>
      <button class="feature-btn" @click="$emit('navigate', 'auto-answer')">自动答题</button>
      <button class="feature-btn" @click="$emit('navigate', 'advanced-settings')">高级设置</button>
      <button class="feature-btn" @click="$emit('open-about')">关于</button>
    </div>
  </div>
</template>

<script setup>
defineEmits(['navigate', 'open-about'])
</script>

<style scoped>
.features {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 16px;
}

.feature-btn {
  padding: 10px 16px;
  background: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
}

.feature-btn:hover {
  background: #e9e9e9;
  border-color: #ccc;
}
</style>