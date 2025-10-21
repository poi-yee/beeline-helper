/**
 * 主观题回答工具类
 * 使用 OpenAI 兼容的 API 进行流式回答
 */

import userEvent from '@testing-library/user-event';
import { getStorageValue } from './storage.js';

const DEFAULT_BASE_URL = 'https://api.siliconflow.cn/v1';
const DEFAULT_MODEL_NAME = 'THUDM/GLM-4.1V-9B-Thinking';
const DEFAULT_SYSTEM_PROMPT = '你是一个专业全能的助手。请清晰、准确地回答问题，提供简明而准确的信息。使用正式、专业的语气。在适当情况下解释你的推理或提供背景信息，但避免不必要的冗长。始终确保答案可靠、易于理解。';

/**
 * 获取主观题回答配置
 * @returns {Promise<object>} 配置对象
 */
async function getSubjectiveAnswerConfig() {
  const apiKey = await getStorageValue('beelineHelper_aiToken', '') || '';
  const baseUrl = await getStorageValue('beelineHelper_baseUrl', '') || DEFAULT_BASE_URL;
  const modelName = await getStorageValue('beelineHelper_modelName', '') || DEFAULT_MODEL_NAME;
  const systemPrompt = await getStorageValue('beelineHelper_systemPrompt', '') || DEFAULT_SYSTEM_PROMPT;

  return {
    apiKey,
    baseUrl,
    modelName,
    systemPrompt
  };
}

/**
 * 流式回答主观题
 * @param {string} question 题目内容
 * @param {function} onChunk 流式输出回调函数
 * @param {function} onComplete 完成回调函数
 * @returns {Promise<object>} 回答结果
 */
export async function streamAnswerSubjectiveQuestion(question, onChunk = null, onComplete = null) {
  const config = await getSubjectiveAnswerConfig();

  if (!config.apiKey) {
    throw new Error('请先在答题设置中设置 AI Token');
  }

  if (!question.trim()) {
    throw new Error('题目内容为空');
  }

  // 验证 BASE_URL
  if (!config.baseUrl || typeof config.baseUrl !== 'string') {
    throw new Error('BASE_URL 配置无效，请在答题设置中检查 BASE_URL 设置');
  }

  // 清理 BASE_URL，移除末尾的斜杠
  const cleanBaseUrl = config.baseUrl.replace(/\/$/, '');

  // 提前查找并检查输入框
  const textarea = await findTextarea();
  if (textarea) {
    // 检查输入框是否已有内容，如果有内容则跳过自动答题
    if (hasExistingContent(textarea)) {
      console.log('输入框已有内容，跳过自动答题');
      return {
        success: false,
        message: '输入框已有内容，跳过自动答题',
        question: question,
        aiAssisted: true
      };
    }
  }

  try {
    const requestUrl = `${cleanBaseUrl}/chat/completions`;
    console.log('主观题 API 请求 URL:', requestUrl);
    console.log('API Key 存在:', !!config.apiKey);
    console.log('模型名称:', config.modelName);

    const response = await fetch(requestUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      },
      body: JSON.stringify({
        model: config.modelName,
        messages: [
          {
            role: 'system',
            content: config.systemPrompt
          },
          {
            role: 'user',
            content: question
          }
        ],
        stream: true,
        temperature: 0.7,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      console.error('API 响应状态:', response.status, response.statusText);
      const errorData = await response.json().catch(() => ({}));
      console.error('API 错误数据:', errorData);
      throw new Error(`API 请求失败: ${response.status} - ${errorData.error?.message || response.statusText}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullAnswer = '';

    // 清空输入框并聚焦
    if (textarea) {
      await clearAndFocusTextarea(textarea);
    }

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n').filter(line => line.trim());

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);

          if (data === '[DONE]') {
            break;
          }

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;

            if (content) {
              fullAnswer += content;

              // 实时将内容输入到输入框
              if (textarea) {
                await appendToTextarea(textarea, content);
              }

              // 调用流式输出回调
              if (onChunk && typeof onChunk === 'function') {
                onChunk(content, fullAnswer);
              }
            }
          } catch (e) {
            console.warn('解析流式数据失败:', e);
          }
        }
      }
    }

    // 调用完成回调
    if (onComplete && typeof onComplete === 'function') {
      onComplete(fullAnswer);
    }

    return {
      success: true,
      answer: fullAnswer,
      question: question,
      aiAssisted: true
    };

  } catch (error) {
    console.error('主观题回答失败:', error);
    return {
      success: false,
      message: `回答失败: ${error.message}`,
      question: question,
      aiAssisted: true
    };
  }
}

/**
 * 将答案填充到主观题输入框（完整填充）
 * @param {string} answer 答案内容
 */
async function fillSubjectiveAnswer(answer) {
  console.log('完整填充主观题答案:', answer);

  const textarea = await findTextarea();

  if (textarea) {
    if (textarea.tagName === 'TEXTAREA') {
      // 对于textarea元素，使用user-event进行输入
      await fillTextareaWithUserEvent(textarea, answer);
    } else if (textarea.getAttribute('contenteditable') === 'true') {
      // 对于contenteditable元素（特别是Slate编辑器）
      await fillContentEditableWithUserEvent(textarea, answer);
    } else {
      // 其他类型的元素
      await fillGenericElementWithUserEvent(textarea, answer);
    }

    console.log('主观题答案已完整填充到输入框');

  } else {
    console.warn('未找到主观题输入框，尝试的选择器:', [
      "[id^='w-e-textarea-']",
      ".w-e-textarea",
      ".w-e-text",
      "[contenteditable='true']"
    ]);

    // 打印页面中所有可能的输入元素
    const allInputs = document.querySelectorAll('input, textarea, [contenteditable]');
    console.log('页面中所有输入元素:', Array.from(allInputs).map(el => ({
      tag: el.tagName,
      id: el.id,
      className: el.className,
      contenteditable: el.getAttribute('contenteditable')
    })));
  }
}

/**
 * 使用user-event填充textarea元素
 * @param {HTMLTextAreaElement} textarea textarea元素
 * @param {string} text 要输入的文本
 */
async function fillTextareaWithUserEvent(textarea, text) {
  try {
    const user = userEvent.setup();

    // 聚焦到textarea
    await user.click(textarea);

    // 清空现有内容
    await user.clear(textarea);

    // 输入新内容
    await user.type(textarea, text, { delay: 5 });

    console.log('使用user-event成功填充textarea');
  } catch (error) {
    console.warn('user-event填充textarea失败，使用备用方法:', error);
    await fillTextareaWithFallback(textarea, text);
  }
}

/**
 * 使用user-event填充contenteditable元素
 * @param {HTMLElement} element contenteditable元素
 * @param {string} text 要输入的文本
 */
async function fillContentEditableWithUserEvent(element, text) {
  try {
    const user = userEvent.setup();

    // 聚焦到元素
    await user.click(element);

    // 清空现有内容
    await user.clear(element);

    // 输入新内容
    await user.type(element, text, { delay: 5 });

    console.log('使用user-event成功填充contenteditable元素');
  } catch (error) {
    console.warn('user-event填充contenteditable失败，使用备用方法:', error);
    await fillContentEditableWithFallback(element, text);
  }
}

/**
 * 使用user-event填充通用元素
 * @param {HTMLElement} element 通用元素
 * @param {string} text 要输入的文本
 */
async function fillGenericElementWithUserEvent(element, text) {
  try {
    const user = userEvent.setup();

    // 聚焦到元素
    await user.click(element);

    // 清空现有内容
    await user.clear(element);

    // 输入新内容
    await user.type(element, text, { delay: 5 });

    console.log('使用user-event成功填充通用元素');
  } catch (error) {
    console.warn('user-event填充通用元素失败，使用备用方法:', error);
    await fillGenericElementWithFallback(element, text);
  }
}

/**
 * textarea备用填充方法
 * @param {HTMLTextAreaElement} textarea textarea元素
 * @param {string} text 要输入的文本
 */
async function fillTextareaWithFallback(textarea, text) {
  try {
    // 直接设置值
    textarea.value = text;

    // 触发事件
    const inputEvent = new Event('input', { bubbles: true });
    textarea.dispatchEvent(inputEvent);

    const changeEvent = new Event('change', { bubbles: true });
    textarea.dispatchEvent(changeEvent);

    console.log('使用备用方法成功填充textarea');
  } catch (error) {
    console.error('textarea备用填充方法失败:', error);
  }
}

/**
 * contenteditable备用填充方法
 * @param {HTMLElement} element contenteditable元素
 * @param {string} text 要输入的文本
 */
async function fillContentEditableWithFallback(element, text) {
  try {
    // 聚焦到元素
    element.focus();

    // 等待焦点设置
    await new Promise(resolve => setTimeout(resolve, 50));

    // 使用execCommand清空并插入内容
    document.execCommand('selectAll', false, null);
    document.execCommand('delete', false, null);
    document.execCommand('insertText', false, text);

    // 触发输入事件
    const inputEvent = new Event('input', { bubbles: true });
    element.dispatchEvent(inputEvent);

    console.log('使用备用方法成功填充contenteditable元素');
  } catch (error) {
    console.error('contenteditable备用填充方法失败:', error);
  }
}

/**
 * 通用元素备用填充方法
 * @param {HTMLElement} element 通用元素
 * @param {string} text 要输入的文本
 */
async function fillGenericElementWithFallback(element, text) {
  try {
    // 设置值
    element.value = text;

    // 触发各种事件
    const events = ['input', 'change', 'blur', 'keyup', 'keydown'];
    events.forEach(eventType => {
      const event = new Event(eventType, { bubbles: true });
      element.dispatchEvent(event);
    });

    console.log('使用备用方法成功填充通用元素');
  } catch (error) {
    console.error('通用元素备用填充方法失败:', error);
  }
}

/**
 * 查找输入框
 * @returns {Promise<HTMLElement|null>} 输入框元素
 */
async function findTextarea() {
  // 查找主观题输入框 - 尝试多种选择器
  let textarea = document.querySelector("[id^='w-e-textarea-']");

  if (!textarea) {
    // 尝试其他可能的选择器
    textarea = document.querySelector('.w-e-textarea');
  }

  if (!textarea) {
    // 尝试查找富文本编辑器的内容区域
    textarea = document.querySelector('.w-e-text');
  }

  if (!textarea) {
    // 尝试查找任何包含contenteditable属性的元素
    textarea = document.querySelector('[contenteditable="true"]');
  }

  if (textarea) {
    console.log('找到输入框:', textarea);
    console.log('输入框类型:', textarea.tagName);
    console.log('输入框属性:', {
      id: textarea.id,
      className: textarea.className,
      contenteditable: textarea.getAttribute('contenteditable')
    });
  }

  return textarea;
}

/**
 * 检查输入框是否已有内容
 * @param {HTMLElement} textarea 输入框元素
 * @returns {boolean} 是否已有内容
 */
function hasExistingContent(textarea) {
  if (textarea.tagName === 'TEXTAREA') {
    return textarea.value.trim().length > 0;
  } else {
    return textarea.textContent.trim().length > 0;
  }
}

/**
 * 清空输入框并聚焦
 * @param {HTMLElement} textarea 输入框元素
 */
async function clearAndFocusTextarea(textarea) {
  try {
    const user = userEvent.setup();

    // 聚焦到输入框
    await user.click(textarea);

    // 清空现有内容
    await user.clear(textarea);

    console.log('输入框已清空并聚焦');
  } catch (error) {
    console.warn('user-event清空输入框失败，使用备用方法:', error);

    // 备用方法
    textarea.focus();
    if (textarea.tagName === 'TEXTAREA') {
      textarea.value = '';
    } else {
      textarea.textContent = '';
    }
  }
}

/**
 * 向输入框追加内容
 * @param {HTMLElement} textarea 输入框元素
 * @param {string} content 要追加的内容
 */
async function appendToTextarea(textarea, content) {
  try {
    const user = userEvent.setup();

    // 使用user-event输入内容
    await user.type(textarea, content, { delay: 0 });

    console.log('实时输入内容:', content);
  } catch (error) {
    console.warn('user-event实时输入失败，使用备用方法:', error);

    // 备用方法
    if (textarea.tagName === 'TEXTAREA') {
      textarea.value += content;

      // 触发输入事件
      const inputEvent = new Event('input', { bubbles: true });
      textarea.dispatchEvent(inputEvent);
    } else {
      // 对于contenteditable元素，使用execCommand
      try {
        document.execCommand('insertText', false, content);
      } catch (e) {
        // 如果execCommand失败，直接追加
        textarea.textContent += content;
      }
    }
  }
}

/**
 * 检查主观题回答配置是否完整
 * @returns {Promise<object>} 检查结果
 */
export async function checkSubjectiveAnswerConfig() {
  const config = await getSubjectiveAnswerConfig();

  if (!config.apiKey) {
    return {
      valid: false,
      message: '请先在答题设置中设置 AI Token'
    };
  }

  // 验证 BASE_URL
  if (!config.baseUrl || typeof config.baseUrl !== 'string') {
    return {
      valid: false,
      message: 'BASE_URL 配置无效，请在答题设置中检查 BASE_URL 设置'
    };
  }

  return {
    valid: true,
    message: '配置完整'
  };
}