<template>
  <div
    class="control-button"
    :class="{ 'button-hidden': isWindowVisible }"
    @click="$emit('click')"
  >
    <span class="button-icon">🔧</span>
  </div>
</template>

<script setup>
defineProps({
  isWindowVisible: {
    type: Boolean,
    default: false
  }
})

defineEmits(['click'])
</script>

<style scoped>
.control-button {
  position: fixed;
  left: 20px;
  bottom: 20px;
  width: 50px;
  height: 50px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
  transition: all 0.3s ease;
  z-index: 9999;
  pointer-events: auto;
}

.control-button:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
}

.control-button.button-hidden {
  opacity: 0.7;
  transform: scale(0.9);
}

.button-icon {
  font-size: 20px;
  color: white;
}
</style>