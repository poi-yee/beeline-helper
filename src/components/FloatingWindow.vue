<template>
  <div
    v-if="isVisible"
    ref="floatingWindow"
    class="floating-window"
    :class="{ 'window-hidden': !isVisible, 'auto-answer-mode': autoAnswerMode }"
    :style="{
      top: position.top + 'px',
      left: position.left + 'px',
      transform: 'none',
      willChange: isDragging ? 'transform' : 'auto'
    }"
  >
    <div
      class="window-header"
      @mousedown="startDrag"
      @touchstart="startDrag"
    >
      <button v-if="showBackButton" class="back-btn" @click="$emit('back')">←</button>
      <h3>{{ title }}</h3>
      <button class="close-btn" @click="$emit('close')">×</button>
    </div>
    <div class="window-content">
      <slot></slot>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  isVisible: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: 'Beeline Helper'
  },
  showBackButton: {
    type: Boolean,
    default: false
  },
  autoAnswerMode: {
    type: Boolean,
    default: false
  },
  initialPosition: {
    type: Object,
    default: () => ({
      top: window.innerHeight / 2 - 150,
      left: 20 // 移动到屏幕左侧
    })
  }
})

const emit = defineEmits(['close', 'back'])

const floatingWindow = ref(null)
const isDragging = ref(false)
const dragOffset = reactive({ x: 0, y: 0 })
const position = reactive({
  top: 20, // 固定在顶部
  left: 20 // 固定在左侧
})

const startDrag = (e) => {
  isDragging.value = true

  const rect = floatingWindow.value.getBoundingClientRect()
  if (e.type === 'mousedown') {
    dragOffset.x = e.clientX - rect.left
    dragOffset.y = e.clientY - rect.top
  } else if (e.type === 'touchstart') {
    const touch = e.touches[0]
    dragOffset.x = touch.clientX - rect.left
    dragOffset.y = touch.clientY - rect.top
  }

  e.preventDefault()
}

const onDrag = (e) => {
  if (!isDragging.value) return

  let clientX, clientY
  if (e.type === 'mousemove') {
    clientX = e.clientX
    clientY = e.clientY
  } else if (e.type === 'touchmove') {
    const touch = e.touches[0]
    clientX = touch.clientX
    clientY = touch.clientY
  }

  const newLeft = clientX - dragOffset.x
  const newTop = clientY - dragOffset.y

  const windowWidth = floatingWindow.value.offsetWidth
  const windowHeight = floatingWindow.value.offsetHeight

  // 使用requestAnimationFrame优化性能
  requestAnimationFrame(() => {
    position.left = Math.max(0, Math.min(newLeft, window.innerWidth - windowWidth))
    position.top = Math.max(0, Math.min(newTop, window.innerHeight - windowHeight))
  })

  e.preventDefault()
}

const stopDrag = () => {
  isDragging.value = false
}

onMounted(() => {
  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', stopDrag)
  document.addEventListener('touchmove', onDrag, { passive: false })
  document.addEventListener('touchend', stopDrag)
})

onUnmounted(() => {
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
  document.removeEventListener('touchmove', onDrag)
  document.removeEventListener('touchend', stopDrag)
})
</script>

<style scoped>
.floating-window {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 320px;
  height: 360px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  z-index: 1000;
  transition: opacity 0.3s ease, transform 0.3s ease, width 0.3s ease, height 0.3s ease;
}

/* 自动答题模式 - 更高 */
.floating-window.auto-answer-mode {
  height: 800px;
  width: 400px;
}

.floating-window.window-hidden {
  opacity: 0;
  transform: scale(0.8);
  pointer-events: none;
}

.window-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 12px 12px 0 0;
  cursor: move;
  user-select: none;
}

.back-btn {
  background: none;
  border: none;
  color: white;
  font-size: 18px;
  cursor: pointer;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.window-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  color: white;
  font-size: 20px;
  cursor: pointer;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.window-content {
  flex: 1;
  padding: 20px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
</style>