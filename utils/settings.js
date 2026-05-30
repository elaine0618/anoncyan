// 全局设置存储
const STORAGE_KEYS = {
  REST_SECONDS: 'rest_seconds',
  SOUND_ENABLED: 'sound_enabled'
};

/**
 * 获取组间休息秒数
 * @returns {number} 休息秒数，默认30秒
 */
export function getRestSeconds() {
  const rest = uni.getStorageSync(STORAGE_KEYS.REST_SECONDS);
  return rest ? parseInt(rest) : 30;
}

/**
 * 设置组间休息秒数
 * @param {number} seconds 秒数
 */
export function setRestSeconds(seconds) {
  uni.setStorageSync(STORAGE_KEYS.REST_SECONDS, parseInt(seconds));
}

/**
 * 获取音效开关状态
 * @returns {boolean} 是否开启音效
 */
export function getSoundEnabled() {
  const enabled = uni.getStorageSync(STORAGE_KEYS.SOUND_ENABLED);
  return enabled !== undefined ? enabled : true;
}

/**
 * 设置音效开关
 * @param {boolean} enabled 是否开启
 */
export function setSoundEnabled(enabled) {
  uni.setStorageSync(STORAGE_KEYS.SOUND_ENABLED, enabled);
}