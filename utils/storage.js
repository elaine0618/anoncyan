// 完整的存储工具函数
const STORAGE_KEYS = {
  WEIGHT_RECORDS: 'weight_records',
  INITIAL_WEIGHT: 'initial_weight',
  PLAN_LIST: 'plan_list',
  WORKOUT_COMPLETION: 'workout_completion'
};

// 体重记录相关
export function getWeightRecord() {
  return uni.getStorageSync(STORAGE_KEYS.WEIGHT_RECORDS) || [];
}

export function saveWeightRecord(records) {
  uni.setStorageSync(STORAGE_KEYS.WEIGHT_RECORDS, records);
}

export function getInitialWeight() {
  return uni.getStorageSync(STORAGE_KEYS.INITIAL_WEIGHT);
}

export function setInitialWeight(weight) {
  uni.setStorageSync(STORAGE_KEYS.INITIAL_WEIGHT, weight);
}

// 食谱相关
export function getRecipe(date) {
  const key = `recipe_${date}`;
  const data = uni.getStorageSync(key);
  if (data && data.meals) {
    return data;
  }
  return null;
}
// 获取第一次有计划安排的日期
export function getFirstPlanDate() {
  const allKeys = uni.getStorageInfoSync().keys;
  let firstDate = null;
  
  for (let key of allKeys) {
    if (key.startsWith('plan_')) {
      const dateStr = key.replace('plan_', '');
      // 验证日期格式是否有效
      const testDate = new Date(dateStr.replace(/-/g, '/'));
      if (!isNaN(testDate.getTime())) {
        if (!firstDate || new Date(dateStr.replace(/-/g, '/')) < new Date(firstDate.replace(/-/g, '/'))) {
          firstDate = dateStr;
        }
      }
    }
  }
  
  return firstDate;
}

// 添加获取打卡天数的函数
export function getCompletedDaysCount() {
  const completions = uni.getStorageSync('workout_completion') || {};
  let count = 0;
  for (let key in completions) {
    if (completions[key] === true) {
      count++;
    }
  }
  return count;
}
export function saveRecipe(date, data) {
  const key = `recipe_${date}`;
  uni.setStorageSync(key, data);
}

// 健身计划相关
export function getPlanByDate(date) {
  const key = `plan_${date}`;
  return uni.getStorageSync(key);
}

export function savePlanByDate(date, plan) {
  const key = `plan_${date}`;
  uni.setStorageSync(key, plan);
}

export function getPlanList() {
  return uni.getStorageSync(STORAGE_KEYS.PLAN_LIST) || [];
}

export function savePlanList(list) {
  uni.setStorageSync(STORAGE_KEYS.PLAN_LIST, list);
}

// 打卡完成状态
export function getWorkoutCompletionStatus(date) {
  const completions = uni.getStorageSync(STORAGE_KEYS.WORKOUT_COMPLETION) || {};
  return completions[date] || false;
}

export function setWorkoutCompletionStatus(date, completed) {
  const completions = uni.getStorageSync(STORAGE_KEYS.WORKOUT_COMPLETION) || {};
  completions[date] = completed;
  uni.setStorageSync(STORAGE_KEYS.WORKOUT_COMPLETION, completions);
}

// 添加健身计划（CRUD）
export function addPlan(plan) {
  const plans = getPlanList();
  plan.id = Date.now();
  plans.push(plan);
  savePlanList(plans);
  return plan;
}

export function updatePlan(plan) {
  const plans = getPlanList();
  const index = plans.findIndex(p => p.id === plan.id);
  if (index !== -1) {
    plans[index] = plan;
    savePlanList(plans);
  }
}

export function deletePlan(planId) {
  const plans = getPlanList();
  const filtered = plans.filter(p => p.id !== planId);
  savePlanList(filtered);
}

export function getPlanById(planId) {
  const plans = getPlanList();
  return plans.find(p => p.id === planId);
}