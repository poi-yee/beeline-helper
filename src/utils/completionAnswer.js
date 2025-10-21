/**
 * 填空题回答工具类
 * 处理填空题的检测和回答逻辑
 */

/**
 * 查找填空题输入框
 * @returns {HTMLElement[]} 输入框元素数组
 */
function findCompletionInputs() {
  // 查找填空题输入框 - 尝试多种选择器
  const inputs = [];

  // 查找所有可能的输入框
  const possibleSelectors = [
    'input[type="text"]',
    'input[placeholder*="填空"]',
    'input[placeholder*="答案"]',
    '.el-input__inner',
    '.el-input input'
  ];

  possibleSelectors.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    elements.forEach(element => {
      // 检查元素是否在填空题区域
      const questionContainer = element.closest("div[class*='homework-']");
      if (questionContainer) {
        const typeElement = questionContainer.querySelector('span.tag.el-tooltip__trigger');
        if (typeElement && typeElement.textContent.trim() === '填空题') {
          inputs.push(element);
        }
      }
    });
  });

  return inputs;
}

/**
 * 检查输入框是否已有内容
 * @param {HTMLElement} input 输入框元素
 * @returns {boolean} 是否已有内容
 */
function hasExistingContent(input) {
  if (input.tagName === 'INPUT' || input.tagName === 'TEXTAREA') {
    return input.value.trim().length > 0;
  } else {
    return input.textContent.trim().length > 0;
  }
}

/**
 * 自动回答填空题
 * @param {string} token API token
 * @returns {Promise<object>} 答题结果
 */
export async function autoAnswerCompletionQuestion(token = '') {
  try {
    const inputs = findCompletionInputs();

    if (inputs.length === 0) {
      return {
        success: false,
        message: '未找到填空题输入框'
      };
    }

    console.log(`找到 ${inputs.length} 个填空题输入框`);

    // 检查是否有输入框已有内容
    const filledInputs = inputs.filter(input => hasExistingContent(input));
    if (filledInputs.length > 0) {
      console.log(`发现 ${filledInputs.length} 个输入框已有内容，跳过自动答题`);
      return {
        success: false,
        message: `发现 ${filledInputs.length} 个输入框已有内容，跳过自动答题`
      };
    }

    // 提取题目内容
    const { question } = extractQuestionContent('completion');

    if (!question) {
      return {
        success: false,
        message: '无法提取填空题题目内容'
      };
    }

    console.log('检测到填空题:', question);

    // 查询题库
    const apiResult = await queryAnswer(question, [], 'completion', token);

    if (!apiResult.success) {
      return {
        success: false,
        message: apiResult.message,
        question: question,
        answer: apiResult.answer
      };
    }

    console.log('题库查询结果:', apiResult);

    // 解析答案
    const answer = parseAnswer(apiResult.answer, 'completion', []);

    if (!answer) {
      return {
        success: false,
        message: '无法解析答案',
        question: apiResult.question,
        answer: apiResult.answer
      };
    }

    console.log('解析后的答案:', answer);

    // 将答案填充到第一个输入框
    if (inputs.length > 0) {
      const firstInput = inputs[0];

      // 聚焦并清空输入框
      firstInput.focus();
      firstInput.value = '';

      // 输入答案
      firstInput.value = answer;

      // 触发输入事件
      const inputEvent = new Event('input', { bubbles: true });
      firstInput.dispatchEvent(inputEvent);

      const changeEvent = new Event('change', { bubbles: true });
      firstInput.dispatchEvent(changeEvent);

      console.log('填空题答案已填充');

      return {
        success: true,
        message: '填空题答案已填充',
        question: apiResult.question,
        answer: apiResult.answer,
        times: apiResult.times
      };
    }

    return {
      success: false,
      message: '无法填充答案'
    };

  } catch (error) {
    console.error('填空题回答失败:', error);
    return {
      success: false,
      message: `填空题回答失败: ${error.message}`
    };
  }
}

// 导入依赖
import { extractQuestionContent } from './questionDetection.js';
import { queryAnswer, parseAnswer } from './questionBankAPI.js';