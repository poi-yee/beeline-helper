<template>
  <div class="answer-settings-page">
    <div class="settings-section">
      <h3>API Token 设置</h3>

      <div class="token-section">
        <a href="https://tk.enncy.cn" target="_blank" class="token-link">
          📖 获取 Token（言溪题库）
        </a>

        <div class="token-input-box">
          <label for="tokenInput">用户凭证 (Token/密钥):</label>
          <input
            id="tokenInput"
            v-model="apiToken"
            @input="saveApiToken"
            placeholder="请输入题库 API Token"
            class="token-input"
          />
        </div>

        <div class="token-input-box">
          <label for="aiTokenInput">AI Token:</label>
          <input
            id="aiTokenInput"
            v-model="aiToken"
            @input="saveAiToken"
            placeholder="请输入 AI Token"
            class="token-input"
          />
        </div>
      </div>

      <div class="ai-settings-section">
        <h4>AI 辅助设置</h4>

        <div class="toggle-item">
          <label class="toggle-label">
            <input
              type="checkbox"
              v-model="aiAssistedEnabled"
              @change="toggleAIAssisted"
            />
            <span class="toggle-slider"></span>
            AI辅助回答选择判断题
          </label>
        </div>
      </div>

      <div class="advanced-section">
        <h4>高级设置</h4>
        <p class="warning-text">⚠️ 一般情况下请不要修改以下设置</p>

        <div class="token-input-box">
          <label for="baseUrlInput">BASE_URL:</label>
          <input
            id="baseUrlInput"
            v-model="baseUrl"
            @input="saveBaseUrl"
            placeholder="请输入 API 基础地址"
            class="token-input"
          />
        </div>

        <div class="token-input-box">
          <label for="modelNameInput">MODEL_NAME:</label>
          <input
            id="modelNameInput"
            v-model="modelName"
            @input="saveModelName"
            placeholder="请输入模型名称"
            class="token-input"
          />
        </div>

        <div class="token-input-box">
          <label for="systemPromptInput">SYSTEM_PROMPT:</label>
          <textarea
            id="systemPromptInput"
            v-model="systemPrompt"
            @input="saveSystemPrompt"
            placeholder="请输入系统提示词"
            class="token-input textarea-input"
            rows="3"
          />
        </div>
      </div>

      <div class="settings-info">
        <p class="info-text">
          <strong>使用说明：</strong>
        </p>
        <ul class="info-list">
          <li>题库 Token 用于查询题目答案</li>
          <li>AI Token 用于生成式回答（如需要）</li>
          <li>请确保输入的 Token 正确有效</li>
          <li>Token 会安全保存在本地浏览器中</li>
          <li>高级设置仅供高级用户使用，一般情况请保持默认</li>
        </ul>
      </div>
    </div>

    <div class="status-section" v-if="statusMessage">
      <div class="status-message" :class="{ success: isSuccess, error: !isSuccess }">
        {{ statusMessage }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { getStorageValue, setStorageValue } from '../utils/storage.js';

const apiToken = ref("");
const aiToken = ref("");
const baseUrl = ref("");
const modelName = ref("");
const systemPrompt = ref("");
const aiAssistedEnabled = ref(false);
const statusMessage = ref("");
const isSuccess = ref(false);

// 检查是否在开发环境
const isDevelopment = import.meta.env.DEV

// 加载/保存 Token
const loadApiToken = async () => {
  const saved = await getStorageValue("beelineHelper_apiToken");
  if (saved) apiToken.value = saved;
};

const saveApiToken = async () => {
  if (apiToken.value) {
    await setStorageValue("beelineHelper_apiToken", apiToken.value);
    showStatus("题库 Token 已保存", true);
  }
};

// 加载/保存 AI Token
const loadAiToken = async () => {
  const saved = await getStorageValue("beelineHelper_aiToken");
  if (saved) aiToken.value = saved;
};

const saveAiToken = async () => {
  if (aiToken.value) {
    await setStorageValue("beelineHelper_aiToken", aiToken.value);
    showStatus("AI Token 已保存", true);
  }
};

// 加载/保存 BASE_URL
const loadBaseUrl = async () => {
  const saved = await getStorageValue("beelineHelper_baseUrl");
  baseUrl.value = saved || "https://api.siliconflow.cn/v1";
};

const saveBaseUrl = async () => {
  await setStorageValue("beelineHelper_baseUrl", baseUrl.value);
  showStatus("BASE_URL 已保存", true);
};

// 加载/保存 MODEL_NAME
const loadModelName = async () => {
  const saved = await getStorageValue("beelineHelper_modelName");
  modelName.value = saved || "THUDM/GLM-4.1V-9B-Thinking";
};

const saveModelName = async () => {
  await setStorageValue("beelineHelper_modelName", modelName.value);
  showStatus("MODEL_NAME 已保存", true);
};

// 加载/保存 SYSTEM_PROMPT
const loadSystemPrompt = async () => {
  const saved = await getStorageValue("beelineHelper_systemPrompt");
  systemPrompt.value = saved || "你是一个专业全能的助手。请清晰、准确地回答问题，提供简明而准确的信息。使用正式、专业的语气。在适当情况下解释你的推理或提供背景信息，但避免不必要的冗长。始终确保答案可靠、易于理解。";
};

const saveSystemPrompt = async () => {
  await setStorageValue("beelineHelper_systemPrompt", systemPrompt.value);
  showStatus("SYSTEM_PROMPT 已保存", true);
};

// 加载/保存 AI 辅助设置
const loadAIAssisted = async () => {
  const saved = await getStorageValue("beelineHelper_aiAssistedEnabled");
  aiAssistedEnabled.value = saved === "true" || saved === true;
};

const toggleAIAssisted = async () => {
  await setStorageValue("beelineHelper_aiAssistedEnabled", aiAssistedEnabled.value);
  if (aiAssistedEnabled.value) {
    showStatus("AI辅助答题已启用", true);
  } else {
    showStatus("AI辅助答题已禁用", false);
  }
};

// 显示状态消息
const showStatus = (message, success) => {
  statusMessage.value = message;
  isSuccess.value = success;

  // 3秒后清除状态消息
  setTimeout(() => {
    statusMessage.value = "";
  }, 3000);
};

onMounted(async () => {
  await loadApiToken();
  await loadAiToken();
  await loadBaseUrl();
  await loadModelName();
  await loadSystemPrompt();
  await loadAIAssisted();
});
</script>

<style scoped>
.answer-settings-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  padding-right: 4px;
}

.answer-settings-page::-webkit-scrollbar {
  width: 6px;
}

.answer-settings-page::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.answer-settings-page::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.answer-settings-page::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

.settings-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.settings-section h3 {
  margin-bottom: 12px;
  font-size: 16px;
  color: #333;
  font-weight: 600;
}

.token-section {
  background: #f9fafc;
  border: 1px solid #e3e7eb;
  padding: 16px;
  border-radius: 12px;
  transition: box-shadow 0.2s;
}

.token-section:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.token-link {
  display: inline-block;
  margin-bottom: 12px;
  color: #007bff;
  text-decoration: none;
  font-weight: 500;
  font-size: 14px;
}

.token-link:hover {
  text-decoration: underline;
}

.token-input-box {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 12px;
}

.token-input-box:last-child {
  margin-bottom: 0;
}

.token-input-box label {
  font-size: 13px;
  color: #495057;
  font-weight: 500;
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

.ai-settings-section {
  background: #f0f8ff;
  border: 1px solid #b8daff;
  padding: 16px;
  border-radius: 12px;
  margin-top: 16px;
}

.ai-settings-section h4 {
  margin-bottom: 12px;
  font-size: 14px;
  color: #004085;
  font-weight: 600;
}

.toggle-item {
  margin-bottom: 8px;
}

.toggle-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
  color: #495057;
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

.advanced-section {
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  padding: 16px;
  border-radius: 12px;
  margin-top: 16px;
}

.advanced-section h4 {
  margin-bottom: 8px;
  font-size: 14px;
  color: #856404;
  font-weight: 600;
}

.warning-text {
  font-size: 12px;
  color: #856404;
  margin-bottom: 12px;
  font-style: italic;
}

.textarea-input {
  resize: vertical;
  min-height: 60px;
}

.settings-info {
  background: #e8f4fd;
  border: 1px solid #b8daff;
  padding: 16px;
  border-radius: 8px;
}

.info-text {
  font-size: 14px;
  color: #004085;
  margin-bottom: 8px;
}

.info-list {
  margin: 0;
  padding-left: 20px;
  font-size: 13px;
  color: #004085;
  line-height: 1.5;
}

.info-list li {
  margin-bottom: 4px;
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