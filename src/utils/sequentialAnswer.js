/**
 * 顺序答题功能
 * 按顺序回答所有题目，自动点击下一题
 */

import { detectQuestionType, extractQuestionContent, clickOption, hasExistingSelection } from './questionDetection.js';
import { queryAnswer, parseAnswer } from './questionBankAPI.js';

/**
 * 获取下一题按钮元素
 * @returns {HTMLElement|null} 下一题按钮
 */
export function getNextQuestionButton() {
  return document.querySelector("#LayoutTeaching > main > div > div > div > div.content-area > div.content > div.toggle-box > button:nth-child(2)");
}

/**
 * 检查下一题按钮是否可用
 * @returns {boolean} 是否可用
 */
export function isNextButtonEnabled() {
  const button = getNextQuestionButton();
  if (!button) return false;

  // 检查按钮是否禁用
  return !button.disabled && !button.classList.contains('is-disabled');
}

/**
 * 点击下一题按钮
 * @returns {boolean} 是否成功点击
 */
export function clickNextQuestion() {
  const button = getNextQuestionButton();
  if (button && isNextButtonEnabled()) {
    button.click();
    return true;
  }
  return false;
}

/**
 * 回答当前题目并返回结果
 * @param {string} token API token
 * @returns {Promise<object>} 答题结果
 */
export async function answerCurrentQuestion(token = '') {
  try {
    console.log('[DEBUG] 顺序答题 - answerCurrentQuestion 开始执行');
    // 检测题目类型
    const questionType = detectQuestionType();
    console.log('[DEBUG] 顺序答题 - 检测到的题目类型:', questionType);

    if (questionType === 'unknown') {
      return {
        success: false,
        message: '无法检测到题目类型'
      };
    }

    // 处理填空题
    if (questionType === 'completion') {
      const { question } = extractQuestionContent(questionType);
      if (!question) {
        return {
          success: false,
          message: '无法提取填空题题目内容',
          type: questionType
        };
      }

      try {
        // 导入填空题回答功能
        const { autoAnswerCompletionQuestion } = await import('./completionAnswer.js');

        const result = await autoAnswerCompletionQuestion(token);
        return {
          ...result,
          type: questionType
        };
      } catch (error) {
        return {
          success: false,
          message: `填空题回答失败: ${error.message}`,
          question: question,
          type: questionType
        };
      }
    }

    // 处理主观题
    if (questionType === 'subjective') {
      const { question } = extractQuestionContent(questionType);
      if (!question) {
        return {
          success: false,
          message: '无法提取主观题题目内容',
          type: questionType
        };
      }

      try {
        console.log('[DEBUG] 顺序答题 - 开始处理主观题');
        // 导入主观题回答功能
        const { streamAnswerSubjectiveQuestion, checkSubjectiveAnswerConfig } = await import('./subjectiveAnswer.js');

        // 检查主观题回答配置
        console.log('[DEBUG] 顺序答题 - 检查主观题配置');
        const configCheck = await checkSubjectiveAnswerConfig();
        console.log('[DEBUG] 顺序答题 - 配置检查结果:', configCheck);
        if (!configCheck.valid) {
          console.log('[DEBUG] 顺序答题 - 配置检查失败:', configCheck.message);
          return {
            success: false,
            message: configCheck.message,
            type: questionType
          };
        }

        console.log('[DEBUG] 顺序答题 - 开始调用主观题回答函数');
        const result = await streamAnswerSubjectiveQuestion(question);
        console.log('[DEBUG] 顺序答题 - 主观题回答结果:', result);
        return {
          ...result,
          type: questionType
        };
      } catch (error) {
        console.error('[DEBUG] 顺序答题 - 主观题回答过程中出错:', error);
        console.error('[DEBUG] 顺序答题 - 错误堆栈:', error.stack);
        return {
          success: false,
          message: `主观题回答失败: ${error.message}`,
          question: question,
          type: questionType
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
        answer: apiResult.answer,
        type: questionType
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
        answer: apiResult.answer,
        type: questionType
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
      times: apiResult.times,
      type: questionType
    };

  } catch (error) {
    console.error('[DEBUG] 顺序答题 - 回答当前题目失败:', error);
    console.error('[DEBUG] 顺序答题 - 错误堆栈:', error.stack);
    return {
      success: false,
      message: `回答当前题目失败: ${error.message}`
    };
  }
}

/**
 * 获取当前题目编号
 * @returns {number} 题目编号，如果无法获取则返回0
 */
function getCurrentQuestionNumber() {
  try {
    // 使用XPath获取题目编号元素
    const xpathResult = document.evaluate(
      '//*[@id="LayoutTeaching"]/main/div/div/div/div[2]/div[2]/div[2]/div/div/div[1]/span',
      document,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null
    );

    const questionElement = xpathResult.singleNodeValue;
    if (questionElement && questionElement.textContent) {
      // 提取题目编号，格式为 "1.（10 分）"，只需要数字部分
      const text = questionElement.textContent.trim();
      const match = text.match(/^(\d+)\./);
      if (match && match[1]) {
        return parseInt(match[1], 10);
      }
    }
  } catch (error) {
    console.warn('获取题目编号失败:', error);
  }

  return 0;
}

// 全局变量用于控制自动答题终止
let shouldStopSequentialAnswering = false;

/**
 * 顺序回答所有题目
 * @param {string} token API token
 * @param {function} onProgress 进度回调函数
 * @returns {Promise<object>} 批量答题结果
 */
export async function sequentialAnswerAllQuestions(token = '', onProgress = null) {
  const results = [];
  let questionCount = 0;
  let successCount = 0;
  shouldStopSequentialAnswering = false;

  try {
    console.log('开始顺序答题...');

    // 循环回答题目，直到没有下一题或被终止
    while (true) {
      // 检查是否应该停止答题 - 在每个循环开始时检查
      if (shouldStopSequentialAnswering) {
        console.log('自动答题已被终止');
        break;
      }
      questionCount++;

      // 获取当前题目编号
      const currentQuestionNumber = getCurrentQuestionNumber();
      const displayNumber = currentQuestionNumber > 0 ? currentQuestionNumber : questionCount;

      // 报告进度
      if (onProgress) {
        onProgress({
          current: displayNumber,
          status: '正在回答第 ' + displayNumber + ' 题...'
        });
      }

      console.log(`正在回答第 ${displayNumber} 题...`);

      // 检查是否应该停止答题 - 在回答题目前再次检查
      if (shouldStopSequentialAnswering) {
        console.log('自动答题已被终止');
        break;
      }

      // 回答当前题目
      console.log(`[DEBUG] 顺序答题 - 开始回答第 ${displayNumber} 题`);
      const result = await answerCurrentQuestion(token);

      // 记录结果
      results.push({
        questionNumber: displayNumber,
        ...result
      });

      if (result.success) {
        successCount++;
        console.log(`第 ${displayNumber} 题回答成功`);
      } else {
        console.log(`第 ${displayNumber} 题回答失败: ${result.message}`);
        console.log(`[DEBUG] 顺序答题 - 详细失败信息:`, result);
      }

      // 检查是否应该停止答题 - 在等待前检查
      if (shouldStopSequentialAnswering) {
        console.log('自动答题已被终止');
        break;
      }

      // 等待选项点击生效
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 检查是否应该停止答题 - 在检查下一题前检查
      if (shouldStopSequentialAnswering) {
        console.log('自动答题已被终止');
        break;
      }

      // 检查是否有下一题
      if (!isNextButtonEnabled()) {
        console.log('没有下一题，答题完成');
        break;
      }

      // 检查是否应该停止答题 - 在点击下一题前检查
      if (shouldStopSequentialAnswering) {
        console.log('自动答题已被终止');
        break;
      }

      // 点击下一题
      console.log('点击下一题...');
      const nextClicked = clickNextQuestion();

      if (!nextClicked) {
        console.log('无法点击下一题，答题完成');
        break;
      }

      // 检查是否应该停止答题 - 在等待下一题加载前检查
      if (shouldStopSequentialAnswering) {
        console.log('自动答题已被终止');
        break;
      }

      // 等待下一题加载
      await new Promise(resolve => setTimeout(resolve, 1500));

      // 检查是否应该停止答题 - 在检查页面状态前检查
      if (shouldStopSequentialAnswering) {
        console.log('自动答题已被终止');
        break;
      }

      // 检查是否还在答题页面（防止意外跳转）
      const stillOnQuestionPage = detectQuestionType() !== 'unknown';
      if (!stillOnQuestionPage) {
        console.log('已离开答题页面，答题完成');
        break;
      }

      // 检查是否应该停止答题 - 在最终延迟前检查
      if (shouldStopSequentialAnswering) {
        console.log('自动答题已被终止');
        break;
      }

      // 添加延迟避免频繁请求
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // 答题完成后弹出提示框
    setTimeout(() => {
      alert('答题完成，请务必检查答案结果！');
    }, 1000);

    return {
      success: successCount > 0,
      message: `答题完成: 成功 ${successCount}/${questionCount} 题`,
      totalQuestions: questionCount,
      successCount: successCount,
      results: results
    };

  } catch (error) {
    console.error('顺序答题失败:', error);
    return {
      success: false,
      message: `顺序答题失败: ${error.message}`,
      totalQuestions: questionCount,
      successCount: successCount,
      results: results
    };
  }
}

/**
 * 停止顺序答题
 * @returns {boolean} 是否成功停止
 */
export function stopSequentialAnswering() {
  shouldStopSequentialAnswering = true;
  console.log('停止顺序答题');
  return true;
}