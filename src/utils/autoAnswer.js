/**
 * 自动答题核心功能
 * 集成题目检测、题库查询、答案选择等功能
 */

import { detectQuestionType, extractQuestionContent, clickOption, getAllQuestions, hasExistingSelection } from './questionDetection.js';
import { queryAnswer, parseAnswer } from './questionBankAPI.js';
import { sequentialAnswerAllQuestions } from './sequentialAnswer.js';
// 主观题回答功能使用动态导入

/**
 * 自动回答单个题目
 * @param {string} token API token
 * @returns {Promise<object>} 答题结果
 */
export async function autoAnswerSingleQuestion(token = '') {
  try {
    console.log('[DEBUG] autoAnswerSingleQuestion 开始执行');
    // 检测题目类型
    const questionType = detectQuestionType();
    console.log('[DEBUG] 检测到的题目类型:', questionType);

    if (questionType === 'unknown') {
      return {
        success: false,
        message: '无法检测到题目类型'
      };
    }

    // 处理主观题
    if (questionType === 'subjective') {
      console.log('[DEBUG] 开始处理主观题');
      const { question } = extractQuestionContent(questionType);
      console.log('[DEBUG] 提取的主观题内容:', question);
      if (!question) {
        console.log('[DEBUG] 无法提取主观题题目内容');
        return {
          success: false,
          message: '无法提取主观题题目内容'
        };
      }

      try {
        console.log('[DEBUG] 开始动态导入主观题模块');
        // 动态导入主观题回答功能
        const { streamAnswerSubjectiveQuestion, checkSubjectiveAnswerConfig } = await import('./subjectiveAnswer.js');
        console.log('[DEBUG] 主观题模块导入成功');

        // 检查主观题回答配置
        console.log('[DEBUG] 开始检查主观题配置');
        const configCheck = await checkSubjectiveAnswerConfig();
        console.log('[DEBUG] 配置检查结果:', configCheck);
        if (!configCheck.valid) {
          console.log('[DEBUG] 配置检查失败:', configCheck.message);
          return {
            success: false,
            message: configCheck.message
          };
        }

        console.log('[DEBUG] 开始调用主观题回答函数');
        const result = await streamAnswerSubjectiveQuestion(question);
        console.log('[DEBUG] 主观题回答结果:', result);
        return {
          ...result,
          type: 'subjective'
        };
      } catch (error) {
        console.error('主观题回答过程中出错:', error);
        return {
          success: false,
          message: `主观题回答失败: ${error.message}`,
          question: question
        };
      }
    }

    // 处理填空题
    if (questionType === 'completion') {
      const { question } = extractQuestionContent(questionType);
      if (!question) {
        return {
          success: false,
          message: '无法提取填空题题目内容'
        };
      }

      try {
        // 动态导入填空题回答功能
        const { autoAnswerCompletionQuestion } = await import('./completionAnswer.js');

        const result = await autoAnswerCompletionQuestion(token);
        return {
          ...result,
          type: 'completion'
        };
      } catch (error) {
        return {
          success: false,
          message: `填空题回答失败: ${error.message}`,
          question: question
        };
      }
    }

    // 提取题目内容
    const { question, options } = extractQuestionContent(questionType);

    if (!question) {
      return {
        success: false,
        message: '无法提取题目内容'
      };
    }

    console.log('检测到题目:', question);
    console.log('选项:', options);

    // 检查是否已有选择（跳过逻辑）
    if (await hasExistingSelection(questionType)) {
      console.log('题目已有选择，跳过自动答题');
      return {
        success: false,
        message: '题目已有选择，跳过自动答题',
        question: question,
        type: questionType
      };
    }

    // 查询题库
    const apiResult = await queryAnswer(question, options, questionType, token);

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
    const answerOptions = parseAnswer(apiResult.answer, questionType, options);

    if (answerOptions.length === 0) {
      return {
        success: false,
        message: '无法解析答案',
        question: apiResult.question,
        answer: apiResult.answer
      };
    }

    console.log('解析后的答案选项:', answerOptions);

    // 点击选项
    let clickedCount = 0;
    for (const option of answerOptions) {
      if (await clickOption(questionType, option)) {
        clickedCount++;
        console.log(`已选择选项: ${option}`);
      }
    }

    return {
      success: clickedCount > 0,
      message: clickedCount > 0 ? `成功选择 ${clickedCount} 个选项` : '选择选项失败',
      question: apiResult.question,
      answer: apiResult.answer,
      selectedOptions: answerOptions,
      times: apiResult.times
    };

  } catch (error) {
    console.error('[DEBUG] 自动答题失败:', error);
    console.error('[DEBUG] 错误堆栈:', error.stack);
    return {
      success: false,
      message: `自动答题失败: ${error.message}`
    };
  }
}

/**
 * 自动回答当前页面所有题目（使用顺序答题方式）
 * @param {string} token API token
 * @param {function} onProgress 进度回调函数
 * @returns {Promise<object>} 批量答题结果
 */
export async function autoAnswerAllQuestions(token = '', onProgress = null) {
  return await sequentialAnswerAllQuestions(token, onProgress);
}

/**
 * 检测当前页面是否有题目
 * @returns {boolean} 是否有题目
 */
export function hasQuestions() {
  const typeElement = document.querySelector('span.tag.el-tooltip__trigger');
  console.log('[BeelineHelper] hasQuestions result:', !!typeElement);
  return !!typeElement;
}

/**
 * 获取当前页面题目统计信息
 * @returns {object} 题目统计
 */
export function getQuestionStats() {
  const questions = getAllQuestions();

  const stats = {
    total: questions.length,
    single: 0,
    multiple: 0,
    judgement: 0,
    completion: 0,
    subjective: 0,
    supported: 0
  };

  questions.forEach(question => {
    stats[question.type]++;
    if (question.type !== 'completion') {
      stats.supported++;
    }
  });

  return stats;
}