import { convertQuestionType } from './questionDetection.js'; // Import consolidated function
import { GM_xmlhttpRequest } from '$';

/**
 * 题库配置系统
 * 支持多个题库源配置和智能答案处理
 */

// 默认题库配置
const DEFAULT_QUESTION_BANKS = [
  {
    name: "言溪题库",
    homepage: "https://tk.enncy.cn/",
    url: "https://tk.enncy.cn/query",
    method: "get",
    type: "GM_xmlhttpRequest",
    contentType: "json",
    data: {
      token: "5d5a3c07b3fb49939d4e31406465dca3",
      title: "${title}",
      options: "${options}",
      type: "${type}"
    },
    handler: "return (res)=>res.code === 0 ? [res.data.answer, undefined] : [res.data.question,res.data.answer,{ai: res.data.ai}]"
  }
];

/**
 * 获取题库配置
 * @returns {Array} 题库配置数组
 */
export function getQuestionBankConfig() {
  try {
    const savedConfig = getStorageValue('beeline-helper-question-banks');
    if (savedConfig) {
      return savedConfig;
    }
  } catch (error) {
    console.error('读取题库配置失败:', error);
  }
  return DEFAULT_QUESTION_BANKS;
}

/**
 * 保存题库配置
 * @param {Array} config 题库配置数组
 */
export function saveQuestionBankConfig(config) {
  try {
    setStorageValue('beeline-helper-question-banks', config);
  } catch (error) {
    console.error('保存题库配置失败:', error);
  }
}

/**
 * 重置题库配置为默认值
 */
export function resetQuestionBankConfig() {
  saveQuestionBankConfig(DEFAULT_QUESTION_BANKS);
}

/**
 * 处理模板字符串
 * @param {string} template 模板字符串
 * @param {object} data 数据对象
 * @returns {string} 处理后的字符串
 */
function processTemplate(template, data) {
  return template.replace(/\$\{([^}]+)\}/g, (match, key) => {
    return data[key] || '';
  });
}

/**
 * 构建请求参数
 * @param {object} bankConfig 题库配置
 * @param {object} questionData 题目数据
 * @returns {object} 请求参数
 */
function buildRequestParams(bankConfig, questionData) {
  const params = {};

  if (bankConfig.method.toLowerCase() === 'get') {
    // GET请求处理
    const urlParams = new URLSearchParams();
    for (const [key, value] of Object.entries(bankConfig.data)) {
      const processedValue = typeof value === 'string'
        ? processTemplate(value, questionData)
        : value;
      urlParams.append(key, processedValue);
    }
    params.url = `${bankConfig.url}?${urlParams.toString()}`;
  } else {
    // POST请求处理
    params.url = bankConfig.url;
    const bodyData = {};
    for (const [key, value] of Object.entries(bankConfig.data)) {
      bodyData[key] = typeof value === 'string'
        ? processTemplate(value, questionData)
        : value;
    }
    params.data = bodyData;
  }

  return params;
}

/**
 * 执行答案处理器
 * @param {string} handlerCode 处理器代码
 * @param {object} response 响应数据
 * @returns {Array} 处理结果 [answer, question, extra]
 */
function executeHandler(handlerCode, response) {
  try {
    // 安全地执行处理器代码
    const handler = new Function(handlerCode)();
    return handler(response);
  } catch (error) {
    console.error('执行答案处理器失败:', error);
    return [null, null, null];
  }
}

/**
 * 查询题库答案
 * @param {string} question 题目内容
 * @param {string[]} options 选项数组
 * @param {string} questionType 题目类型
 * @param {number} bankIndex 题库索引
 * @returns {Promise<object>} 查询结果
 */
export async function queryAnswerFromBank(question, options = [], questionType = 'unknown', bankIndex = 0) {
  const banks = getQuestionBankConfig();

  if (bankIndex >= banks.length) {
    return {
      success: false,
      message: '题库索引超出范围'
    };
  }

  const bankConfig = banks[bankIndex];

  // 构建题目数据
  const questionData = {
    title: question,
    options: options.join('\n'),
    type: convertQuestionType(questionType)
  };

  try {
    const params = buildRequestParams(bankConfig, questionData);

    let response;
    // 检查是否在开发环境
    const isDevelopment = import.meta.env.DEV;

    if (bankConfig.type === 'GM_xmlhttpRequest' && !isDevelopment) {
      // 生产环境使用GM_xmlhttpRequest
      response = await new Promise((resolve, reject) => {
        GM_xmlhttpRequest({
          method: bankConfig.method.toUpperCase(),
          url: params.url,
          data: params.data,
          responseType: 'json',
          onload: (resp) => {
            if (resp.status === 200) {
              resolve(resp.response);
            } else {
              reject(new Error(`HTTP ${resp.status}: ${resp.statusText}`));
            }
          },
          onerror: reject
        });
      });
    } else {
      // 开发环境使用fetch，或者配置为fetch类型
      // 使用fetch
      const fetchOptions = {
        method: bankConfig.method.toUpperCase(),
        headers: {
          'Content-Type': 'application/json'
        }
      };

      if (params.data) {
        fetchOptions.body = JSON.stringify(params.data);
      }

      const fetchResponse = await fetch(params.url, fetchOptions);
      if (!fetchResponse.ok) {
        throw new Error(`HTTP error! status: ${fetchResponse.status}`);
      }
      response = await fetchResponse.json();
    }

    // 执行答案处理器
    const [answer, questionText, extra] = executeHandler(bankConfig.handler, response);

    if (answer) {
      return {
        success: true,
        question: questionText || question,
        answer: answer,
        extra: extra,
        bankName: bankConfig.name,
        message: '查询成功'
      };
    } else {
      return {
        success: false,
        question: questionText || question,
        answer: answer || '未找到答案',
        extra: extra,
        bankName: bankConfig.name,
        message: '题库中未找到答案'
      };
    }

  } catch (error) {
    console.error(`题库[${bankConfig.name}]查询失败:`, error);
    return {
      success: false,
      message: `题库查询失败: ${error.message}`,
      bankName: bankConfig.name
    };
  }
}

/**
 * 智能查询答案（依次尝试所有题库）
 * @param {string} question 题目内容
 * @param {string[]} options 选项数组
 * @param {string} questionType 题目类型
 * @returns {Promise<object>} 查询结果
 */
export async function smartQueryAnswer(question, options = [], questionType = 'unknown') {
  const banks = getQuestionBankConfig();

  for (let i = 0; i < banks.length; i++) {
    console.log(`正在尝试题库[${banks[i].name}]...`);
    const result = await queryAnswerFromBank(question, options, questionType, i);

    if (result.success) {
      console.log(`题库[${banks[i].name}]查询成功`);
      return result;
    }

    console.log(`题库[${banks[i].name}]查询失败:`, result.message);

    // 添加延迟避免频繁请求
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  return {
    success: false,
    message: '所有题库均未找到答案'
  };
}

/**
 * 将题目类型转换为API所需的类型
 * @param {string} questionType 题目类型
 * @returns {string} API类型
 */
