/**
 * 题目检测工具类
 * 用于检测题目类型、提取题目内容、获取选项等
 */

/**
 * 检测题目类型
 * @returns {string} 题目类型 'single' | 'multiple' | 'judgement' | 'completion' | 'subjective' | 'unknown'
 */
export function detectQuestionType() {
  const typeElement = document.querySelector('span.tag.el-tooltip__trigger');
  if (!typeElement) return 'unknown';

  const typeText = typeElement.textContent.trim();
  const questionType = (() => {
    switch (typeText) {
      case '单选题': return 'single';
      case '多选题': return 'multiple';
      case '判断题': return 'judgement';
      case '填空题': return 'completion';
      case '主观题': return 'subjective';
      default: return 'unknown';
    }
  })();
  console.log('[BeelineHelper] detectQuestionType result:', typeText, '->', questionType);
  return questionType;
}

/**
 * 提取题目内容
 * @param {string} questionType 题目类型
 * @returns {object} 题目信息 { question: string, options: string[] }
 */
export function extractQuestionContent(questionType) {
  let question = '';
  let options = [];

  switch (questionType) {
    case 'single':
    case 'multiple':
      // 单选题和多选题 - 使用更通用的选择器
      const questionElement = document.querySelector('.question');
      if (questionElement) {
        // 提取题目
        const titleElement = questionElement.querySelector('.topic-title');
        if (titleElement) {
          question = titleElement.textContent.trim();
        }

        // 提取选项
        const optionElements = questionElement.querySelectorAll('.el-radio, .el-checkbox');
        options = Array.from(optionElements).map(option => {
          const labelElement = option.querySelector('.label');
          return labelElement ? labelElement.textContent.trim() : '';
        }).filter(text => text);
      }
      break;

    case 'judgement':
      // 判断题 - 使用更通用的选择器
      const judgementElement = document.querySelector('.topic-title');
      if (judgementElement) {
        question = judgementElement.textContent.trim();
        options = ['正确', '错误'];
      }
      break;

    case 'completion':
      // 填空题 - 提取题目内容
      const completionElement = document.querySelector('.topic-title');
      if (completionElement) {
        question = completionElement.textContent.trim();
      }
      break;

    case 'subjective':
      // 主观题 - 提取题目内容
      let subjectiveElement = document.querySelector('.homework-question-editor .content span');
      if (!subjectiveElement) {
        // 尝试新的路径
        subjectiveElement = document.querySelector('#LayoutTeaching .homework-question-editor .content p');
      }
      if (subjectiveElement) {
        question = subjectiveElement.textContent.trim();
      }
      break;
  }

  return { question, options };
}

/**
 * 获取选项对应的DOM元素
 * @param {string} questionType 题目类型
 * @param {string} option 选项标识 (A, B, C, D 等)
 * @returns {HTMLElement|null} 选项DOM元素
 */
export function getOptionElement(questionType, option) {
  const optionIndex = option.charCodeAt(0) - 65; // A=0, B=1, C=2, D=3

  switch (questionType) {
    case 'single':
      // 使用更通用的选择器
      const radioGroup = document.querySelector('.el-radio-group');
      if (radioGroup) {
        const radioLabels = radioGroup.querySelectorAll('label');
        if (radioLabels.length > optionIndex) {
          return radioLabels[optionIndex].querySelector('.el-radio__input span');
        }
      }
      break;

    case 'multiple':
      // 使用更通用的选择器
      const checkboxGroup = document.querySelector('.el-checkbox-group');
      if (checkboxGroup) {
        const checkboxLabels = checkboxGroup.querySelectorAll('label');
        if (checkboxLabels.length > optionIndex) {
          return checkboxLabels[optionIndex].querySelector('.el-checkbox__input span');
        }
      }
      break;

    case 'judgement':
      // 判断题
      const judgementGroup = document.querySelector('.el-radio-group');
      if (judgementGroup) {
        const judgementLabels = judgementGroup.querySelectorAll('label');
        if (option === 'A' && judgementLabels.length > 0) {
          return judgementLabels[0].querySelector('.el-radio__input span');
        } else if (option === 'B' && judgementLabels.length > 1) {
          return judgementLabels[1].querySelector('.el-radio__input span');
        }
      }
      break;
  }

  return null;
}

/**
 * 点击选项
 * @param {string} questionType 题目类型
 * @param {string} option 选项标识
 * @returns {boolean} 是否成功点击
 */
export async function clickOption(questionType, option) {
  const element = getOptionElement(questionType, option);
  if (element) {
    // 对于多选题，使用轮询式点击
    if (questionType === 'multiple') {
      const checkboxInput = element.closest('.el-checkbox__input');
      if (checkboxInput) {
        const input = checkboxInput.querySelector('input[type="checkbox"]');
        if (input) {
          // 轮询式点击：先点击一次，然后检查状态，如果没选中再点击
          let clickCount = 0;
          const maxClicks = 3; // 最多尝试3次

          while (clickCount < maxClicks && !input.checked) {
            element.click();
            clickCount++;

            // 短暂延迟让DOM更新
            await new Promise(resolve => setTimeout(resolve, 100));
          }

          return input.checked;
        }
      }
    } else {
      // 单选题和判断题直接点击
      element.click();
      return true;
    }
  }
  return false;
}

/**
 * 检查题目是否已有选择
 * @param {string} questionType 题目类型
 * @returns {boolean} 是否已有选择
 */
export async function hasExistingSelection(questionType) {
  switch (questionType) {
    case 'single':
    case 'judgement':
      // 检查单选题和判断题是否已有选中项
      const radioInputs = document.querySelectorAll('.el-radio__input input[type="radio"]');
      for (const input of radioInputs) {
        if (input.checked) {
          return true;
        }
      }
      break;

    case 'multiple':
      // 检查多选题是否已有选中项
      const checkboxInputs = document.querySelectorAll('.el-checkbox__input input[type="checkbox"]');
      for (const input of checkboxInputs) {
        if (input.checked) {
          return true;
        }
      }
      break;

    case 'completion':
      // 填空题已有内容检查在 completionAnswer.js 中处理
      return false;

    case 'subjective':
      // 主观题已有内容检查在 subjectiveAnswer.js 中处理
      return false;
  }

  return false;
}

/**
 * 获取当前页面所有题目的信息
 * @returns {object[]} 题目信息数组
 */
export function getAllQuestions() {
  const questions = [];

  // 获取所有题目容器
  const questionContainers = document.querySelectorAll("div[class*='homework-']");

  questionContainers.forEach((container, index) => {
    const typeElement = container.querySelector('span.tag.el-tooltip__trigger');
    if (typeElement) {
      const type = detectQuestionType();
      const content = extractQuestionContent(type);

      questions.push({
        index: index + 1,
        type,
        ...content
      });
    }
  });

  return questions;
}
/**
 * Converts a detected question type to a standardized format for the question bank API.
 * @param {string} type The detected question type (e.g., '单选题', '多选题', '判断题', '填空题', '主观题').
 * @returns {string} The standardized question type (e.g., 'single', 'multiple', 'judgment', 'completion', 'subjective'). Returns 'unknown' if not recognized.
 */
export function convertQuestionType(type) {
  switch (type) {
    case '单选题':
      return 'single';
    case '多选题':
      return 'multiple';
    case '判断题':
      return 'judgement';
    case '填空题':
      return 'completion';
    case '主观题':
      return 'subjective';
    default:
      return 'unknown';
  }
}
