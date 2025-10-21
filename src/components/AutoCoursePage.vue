<template>
  <div>
    <div class="toggle-features">
      <div class="toggle-item">
        <span class="toggle-label">自动点击下一集</span>
        <label class="toggle-switch">
          <input type="checkbox" :checked="props.autoCompleteEnabled" @change="$emit('toggle-auto-complete', !props.autoCompleteEnabled)">
          <span class="toggle-slider"></span>
        </label>
      </div>
      <div class="toggle-item">
        <span class="toggle-label">自动静音</span>
        <label class="toggle-switch">
          <input type="checkbox" :checked="props.autoMuteEnabled" @change="$emit('toggle-auto-mute', !props.autoMuteEnabled)">
          <span class="toggle-slider"></span>
        </label>
      </div>
      <div class="toggle-item">
        <span class="toggle-label">状态异常自动刷新</span>
        <label class="toggle-switch">
          <input type="checkbox" :checked="props.stateExceptionEnabled" @change="$emit('toggle-state-exception', !props.stateExceptionEnabled)">
          <span class="toggle-slider"></span>
        </label>
      </div>
      <div class="toggle-item">
        <span class="toggle-label">视频暂停自动播放</span>
        <label class="toggle-switch">
          <input type="checkbox" :checked="props.autoPlayEnabled" @change="$emit('toggle-auto-play', !props.autoPlayEnabled)">
          <span class="toggle-slider"></span>
        </label>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  autoCompleteEnabled: {
    type: Boolean,
    default: false
  },
  autoMuteEnabled: {
    type: Boolean,
    default: false
  },
  stateExceptionEnabled: {
    type: Boolean,
    default: false
  },
  autoPlayEnabled: {
    type: Boolean,
    default: false
  }
})

defineEmits(['toggle-auto-complete', 'toggle-auto-mute', 'toggle-state-exception', 'toggle-auto-play'])
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

.toggle-label {
  font-size: 14px;
  color: #333;
  font-weight: 500;
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
</style>