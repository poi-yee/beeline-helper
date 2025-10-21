import { convertQuestionType } from '../utils/questionDetection.js'; // Import consolidated function

const API_BASE_URL = 'https://tk.enncy.cn/query';

/**
 * 查询题目答案
 * @param {string} question 题目内容
 * @param {string[]} options 选项数组
 * @param {string} questionType 题目类型
 * @param {string} token API token
 * @returns {Promise<object>} 查询结果
 */
export async function queryAnswer(question, options = [], questionType = 'unknown', token = '') {
  if (!question.trim()) {
    return {
      success: false,
      message: '题目内容为空'
    };
  }

  try {
    const apiToken = token || getStorageValue('beelineHelper_apiToken', ''); // Use passed token or retrieve from storage
    if (!apiToken) {
      return { success: false, message: '请在答题设置中配置题库 Token' };
    }

    const params = new URLSearchParams({
      title: question,
      type: convertQuestionType(questionType),
      ...(apiToken && { token: apiToken })
    });

    // 如果有选项，添加到参数中
    if (options.length > 0) {
      params.append('options', options.join('\n'));
    }

    const response = await fetch(`${API_BASE_URL}?${params.toString()}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.code === 1) {
      return {
        success: true,
        question: data.data.question,
        answer: data.data.answer,
        times: data.data.times,
        message: data.message
      };
    } else {
      return {
        success: false,
        question: data.data?.question || '未找到答案',
        answer: data.data?.answer || '很抱歉，题目搜索不到',
        times: data.data?.times || 0,
        message: data.message
      };
    }
  } catch (error) {
    console.error('题库API查询失败:', error);
    return {
      success: false,
      message: `查询失败: ${error.message}`
    };
  }
}

/**
 * 批量查询题目答案
 * @param {object[]} questions 题目数组
 * @param {string} token API token
 * @returns {Promise<object[]>} 查询结果数组
 */
export async function batchQueryAnswers(questions, token = '') {
  const results = [];

  for (const question of questions) {
    const result = await queryAnswer(
      question.question,
      question.options,
      question.type,
      token
    );

    results.push({
      ...question,
      ...result
    });

    // 添加延迟避免频繁请求
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  return results;
}

/**
 * 解析答案文本
 * @param {string} answerText 答案文本
 * @param {string} questionType 题目类型
 * @param {string[]} options 选项内容数组
 * @returns {string[]} 解析后的选项数组
 */
export function parseAnswer(answerText, questionType, options = []) {
  if (!answerText) return [];

  // 去除标点符号和空格
  const cleanAnswer = answerText.replace(/[\s\p{P}]/gu, '');

  switch (questionType) {
    case 'single':
      // 方法1: 尝试匹配选项字母
      const letterMatch = cleanAnswer.match(/[A-D]/i);
      if (letterMatch) {
        return [letterMatch[0].toUpperCase()];
      }

      // 方法2: 根据答案内容匹配选项
      if (options.length > 0) {
        for (let i = 0; i < options.length; i++) {
          const optionText = options[i].replace(/[\s\p{P}]/gu, '');
          if (cleanAnswer.includes(optionText) || optionText.includes(cleanAnswer)) {
            return [String.fromCharCode(65 + i)]; // A, B, C, D
          }
        }
      }

      // 方法3: 根据常见答案模式匹配
      if (cleanAnswer.includes('正确') || cleanAnswer.includes('对') || cleanAnswer.includes('是')) {
        return ['A'];
      } else if (cleanAnswer.includes('错误') || cleanAnswer.includes('错') || cleanAnswer.includes('否')) {
        return ['B'];
      }

      return [];

    case 'multiple':
      // 多选题答案通常是多个字母
      const multipleMatch = cleanAnswer.match(/[A-D]/gi);
      if (multipleMatch) {
        return [...new Set(multipleMatch.map(m => m.toUpperCase()))];
      }

      // 如果没有找到字母，尝试根据内容匹配
      if (options.length > 0) {
        const matchedOptions = [];
        for (let i = 0; i < options.length; i++) {
          const optionText = options[i].replace(/[\s\p{P}]/gu, '');
          // 检查答案是否包含选项的关键词
          const optionKeywords = optionText.split('、').map(k => k.trim()).filter(k => k);
          const hasMatch = optionKeywords.some(keyword =>
            cleanAnswer.includes(keyword) || keyword.includes(cleanAnswer)
          );
          if (hasMatch) {
            matchedOptions.push(String.fromCharCode(65 + i));
          }
        }
        return matchedOptions;
      }

      return [];

    case 'judgement':
      // 判断题答案
      if (cleanAnswer.includes('正确') || cleanAnswer.includes('对') || cleanAnswer.includes('是')) {
        return ['A'];
      } else if (cleanAnswer.includes('错误') || cleanAnswer.includes('错') || cleanAnswer.includes('否')) {
        return ['B'];
      }
      return [];

    default:
      return [];
  }
}