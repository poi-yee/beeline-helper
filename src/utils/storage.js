import { GM_getValue, GM_setValue, GM_deleteValue } from '$'

/**
 * 获取存储的值
 * @param {string} key 存储键名
 * @param {any} defaultValue 默认值
 * @returns {Promise<any>}
 */
export async function getStorageValue(key, defaultValue = null) {
  try {
    const value = await GM_getValue(key, defaultValue)
    // 如果是字符串，尝试解析为 JSON
    if (typeof value === 'string') {
      try {
        return JSON.parse(value)
      } catch {
        return value
      }
    }
    return value
  } catch (error) {
    console.warn(`Failed to get storage value for key "${key}":`, error)
    return defaultValue
  }
}

/**
 * 设置存储的值
 * @param {string} key 存储键名
 * @param {any} value 要存储的值
 * @returns {Promise<void>}
 */
export async function setStorageValue(key, value) {
  try {
    // 如果是对象或数组，转换为 JSON 字符串
    const storageValue = typeof value === 'object' || Array.isArray(value)
      ? JSON.stringify(value)
      : value

    await GM_setValue(key, storageValue)
  } catch (error) {
    console.warn(`Failed to set storage value for key "${key}":`, error)
  }
}

/**
 * 删除存储的值
 * @param {string} key 存储键名
 * @returns {Promise<void>}
 */
export async function deleteStorageValue(key) {
  try {
    await GM_deleteValue(key)
  } catch (error) {
    console.warn(`Failed to delete storage value for key "${key}":`, error)
  }
}