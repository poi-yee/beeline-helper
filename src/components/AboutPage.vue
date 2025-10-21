<script setup>
import { ref, onMounted } from "vue";
import { getStorageValue, setStorageValue } from '../utils/storage.js';

const agreeChecked = ref(false);
const countdown = ref(15);
const countdownActive = ref(true);
const isClosing = ref(false);

// 加载/保存同意状态
const loadAgreeState = async () => {
  const saved = await getStorageValue("beelineHelper_agreeState");
  if (saved !== null) agreeChecked.value = saved;
};

const saveAgreeState = async () => {
  await setStorageValue("beelineHelper_agreeState", agreeChecked.value);
};

// 倒计时逻辑
const startCountdown = () => {
  // 如果已经同意，直接跳过倒计时
  if (agreeChecked.value) {
    countdownActive.value = false;
    return;
  }

  const timer = setInterval(() => {
    if (countdown.value > 0) {
      countdown.value--;
    } else {
      clearInterval(timer);
      countdownActive.value = false;
    }
  }, 1000);
};

// 改为 emit 事件
const emit = defineEmits(["close"]);

// 关闭页面动画
const handleClose = () => {
  isClosing.value = true;
  setTimeout(() => {
    emit("close");
  }, 300); // 动画持续时间
};

onMounted(async () => {
  await loadAgreeState();
  startCountdown();
});
</script>

<template>
  <div class="about-page" :class="{ 'closing': isClosing }">
    <!-- 左侧支付区 -->
    <div class="left-panel">
      <h2 class="title gradient-text">💰 支持项目 ¥6.6</h2>
      <div class="image-box">
        <img
          src="C:\Users\PoiYee\Desktop\bh\beeline-helper\src\assets\pay.jpg"
          class="pay-image"
        />
      </div>
      <p class="subtitle">扫码支付，支持开发 ❤️</p>
    </div>

    <!-- 右侧说明区 -->
    <div class="right-panel">
      <h2 class="title">🤖 无人看守的诚信小卖铺</h2>

      <div class="content">
        <p>新版芯位已完全无法倍速，故删除。</p>
        <p>刷视频的全部功能———永久免费。</p>
        <p><b>自动答题 ¥6.6/人 永久使用</b>，感谢支持 😋</p>
        <p>当前版本自动答题请手动开始，避免Token浪费</p>
        <p class="warning">❗请务必确认答案正确且多选题已选中后再提交❗</p>
        <p>题库并非本人维护，请自行判断。AI生成内容务必检查！</p>
      </div>

      <p class="feedback">
        有 BUG？请到
        <a href="https://greasyfork.org/zh-CN/scripts/490485" target="_blank">GreasyFork</a>
        反馈。
      </p>

      <label class="agree-label">
        <input
          type="checkbox"
          v-model="agreeChecked"
          :disabled="countdownActive"
          @change="saveAgreeState"
        />
        <span v-if="countdownActive">
          我已诚信付款并认真阅读上述文字 ({{ countdown }}秒)
        </span>
        <span v-else>
          我已诚信付款并认真阅读上述文字
        </span>
      </label>

      <button @click="handleClose" class="close-btn">关闭</button>
    </div>
  </div>
</template>

<style scoped>
.about-page {
  height: 100%;
  background: linear-gradient(135deg, #f5f7fa, #e4ebf5);
  display: flex;
  flex-wrap: wrap;
  box-sizing: border-box;
  overflow-y: auto;
  opacity: 1;
  transform: scale(1);
  transition: all 0.3s ease-in-out;
}

.about-page.closing {
  opacity: 0;
  transform: scale(0.9);
}

.left-panel,
.right-panel {
  flex: 1;
  min-width: 320px;
  padding: 40px;
  box-sizing: border-box;
}

.left-panel {
  background: linear-gradient(135deg, #eef2f3, #dfe9f3);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.title {
  font-size: 22px;
  font-weight: 600;
  text-align: center;
  margin-bottom: 16px;
}

.gradient-text {
  background: linear-gradient(90deg, #007bff, #00c6ff);
  -webkit-background-clip: text;
  color: transparent;
}

.image-box {
  text-align: center;
  margin: 20px 0;
  padding: 10px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.pay-image {
  width: 590px;      /* 固定宽度 */
  height: auto;      /* 按比例缩放 */
  border-radius: 10px;
  object-fit: contain;
}

.subtitle {
  color: #555;
  text-align: center;
  font-size: 15px;
  margin-top: 12px;
}

.right-panel .content {
  line-height: 1.6;
  color: #333;
  font-size: 15px;
  margin-bottom: 15px;
}

.warning {
  color: #d93025;
  font-weight: 600;
}

.token-section {
  background: #f9fafc;
  border: 1px solid #e3e7eb;
  padding: 14px;
  border-radius: 12px;
  margin: 20px 0;
  transition: box-shadow 0.2s;
}
.token-section:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.token-link {
  display: inline-block;
  margin-bottom: 8px;
  color: #007bff;
  text-decoration: none;
  font-weight: 500;
}
.token-link:hover {
  text-decoration: underline;
}

.token-info {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
  line-height: 1.4;
}

.token-info strong {
  color: #007bff;
}

.token-input {
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.token-input:focus {
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.15);
}

.feedback {
  font-size: 14px;
  color: #666;
}

.feedback a {
  color: #007bff;
  text-decoration: none;
}
.feedback a:hover {
  text-decoration: underline;
}

.agree-label {
  font-size: 13px;
  color: #999;
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  cursor: pointer;
}

.agree-label input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.close-btn {
  display: block;
  width: 100%;
  margin-top: 24px;
  padding: 12px;
  background: linear-gradient(90deg, #007bff, #00aaff);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.25s ease;
}
.close-btn:hover {
  background: linear-gradient(90deg, #0056b3, #0080ff);
  transform: translateY(-2px);
}
</style>
