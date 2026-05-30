<template>
  <view class="container">
    <!-- 日期选择器 -->
    <DateSelector @dateChange="onDateChange" ref="dateSelector" />

    <!-- 健身计划与食谱入口卡片 -->
    <view class="card-row">
      <!-- 健身计划卡片 -->
      <view class="card plan-card" @click="navigateTo('/pages/workout/workout', { date: selectedDate })">
        <text class="plan-title">当日安排</text>
        <text class="plan-titles">{{ todayPlanName }}</text>
        <text class="plan-stat">已打卡 {{ completedDays }} 天</text>
        <text class="plan-stat">已开始 {{持续天数}} 天</text>
      </view>
      
      <!-- 今日食谱卡片 -->
      <view class="card recipe-card" @click="navigateTo('/pages/recipe/recipe', { date: selectedDate })">
        <text class="recipe-title">当日饮食</text>
        <text class="recipe-item">早餐</text>
        <text class="recipe-item">午餐</text>
        <text class="recipe-item">晚餐</text>
      </view>
    </view>

    <!-- 体重记录卡片 -->
    <view class="weight-card" @click="navigateTo('/pages/weight/weight')">
      <view class="weight-header">
        <text class="weight-title">体重管理</text>
      </view>
      <view class="weight-content">
        <view class="weight-left">
          <text class="weight-label">当前体重</text>
          <text class="weight-value">{{ currentWeight || '--' }}</text>
          <text class="weight-unit">kg</text>
        </view>
        <view class="weight-right" v-if="initialWeight && currentWeight">
          <text class="weight-diff" :class="weightDiffClass">{{ weightDiffSymbol }} {{ Math.abs(weightDiff) }}kg</text>
          <text class="weight-compare-label">初始体重对比</text>
        </view>
        <view class="weight-right" v-else>
          <text class="weight-diff-placeholder">--</text>
          <text class="weight-compare-label">初始体重对比</text>
        </view>
      </view>
    </view>

    <!-- 底部统计卡片行：左2右1布局 -->
    <view class="stats-row">
      <!-- 左侧：上下两个卡片 -->
      <view class="stats-left">
        <!-- 运动时长卡片 -->
        <view class="stats-card-small" @click="showDurationModal">
          <text class="stats-title-small">已跑步</text>
          <view class="stats-value-row-small">
            <text class="stats-number-small">{{ todayDuration || 0 }}</text>
            <text class="stats-unit-small">分钟</text>
          </view>
        </view>

        <!-- 步数卡片 -->
        <view class="stats-card-small" @click="showStepsModal">
          <text class="stats-title-small">已行走</text>
          <view class="stats-value-row-small">
            <text class="stats-number-small">{{ todaySteps || 0 }}</text>
            <text class="stats-unit-small">步</text>
          </view>
        </view>
      </view>

      <!-- 右侧：统计分析卡片 -->
      <!-- 右侧：统计分析卡片 -->
      <view class="stats-right" @click="navigateToRecipeAnalyze">
        <view class="gauge-ring">
          <view class="ring-bg"></view>
          <view class="ring-fill"></view>
          <text class="analyze-title">预测<br>分析</text>
        </view>
      </view>
    </view>

    <!-- 运动时长输入弹窗 -->
    <view class="modal-mask" v-if="showDurationModalFlag" @click="closeDurationModal">
      <view class="modal-container" @click.stop>
        <view class="modal-header">
          <text class="modal-title">记录运动时长</text>
          <text class="modal-close" @click="closeDurationModal">✕</text>
        </view>
        <view class="modal-body">
          <view class="form-item">
            <text class="form-label">运动时长</text>
            <view class="input-group">
              <input 
                class="form-input" 
                type="number" 
                v-model="durationInput" 
                placeholder="请输入分钟数" 
                placeholder-style="color:#ccc"
                :focus="durationFocus"
              />
              <text class="input-unit">分钟</text>
            </view>
          </view>
        </view>
        <view class="modal-footer">
          <button class="cancel-btn" @click="closeDurationModal">取消</button>
          <button class="confirm-btn" @click="saveDuration">确认</button>
        </view>
      </view>
    </view>

    <!-- 步数输入弹窗 -->
    <view class="modal-mask" v-if="showStepsModalFlag" @click="closeStepsModal">
      <view class="modal-container" @click.stop>
        <view class="modal-header">
          <text class="modal-title">记录步数</text>
          <text class="modal-close" @click="closeStepsModal">✕</text>
        </view>
        <view class="modal-body">
          <view class="form-item">
            <text class="form-label">步数</text>
            <view class="input-group">
              <input 
                class="form-input" 
                type="number" 
                v-model="stepsInput" 
                placeholder="请输入步数" 
                placeholder-style="color:#ccc"
                :focus="stepsFocus"
              />
              <text class="input-unit">步</text>
            </view>
          </view>
        </view>
        <view class="modal-footer">
          <button class="cancel-btn" @click="closeStepsModal">取消</button>
          <button class="confirm-btn" @click="saveSteps">确认</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import DateSelector from '@/components/DateSelector.vue';
import { getWeightRecord, getInitialWeight } from '@/utils/storage.js';
import { getPlanByDate, getCompletedDaysCount, getFirstPlanDate } from '@/utils/storage.js';

export default {
  components: { DateSelector },
  data() {
    return {
      selectedDate: this.getToday(),
      currentWeight: null,
      initialWeight: null,
      weightDiff: 0,
      todayPlanName: 'N',
      completedDays: 0,
      持续天数: 0,
      // 运动数据
      todayDuration: 0,
      todaySteps: 0,
      // 弹窗控制
      showDurationModalFlag: false,
      showStepsModalFlag: false,
      durationInput: '',
      stepsInput: '',
      durationFocus: false,
      stepsFocus: false
    };
  },
  computed: {
    weightDiffSymbol() {
      if (this.weightDiff > 0) return '+';
      if (this.weightDiff < 0) return '-';
      return '';
    },
    weightDiffClass() {
      if (this.weightDiff > 0) return 'diff-up';
      if (this.weightDiff < 0) return 'diff-down';
      return 'diff-equal';
    }
  },
  onShow() {
    this.loadWeightData();
    this.loadPlanData();
    this.loadStatsData();
    // 刷新日期选择器的打卡状态
    if (this.$refs.dateSelector) {
      this.$refs.dateSelector.refreshCompletionStatus();
    }
  },
  methods: {
    getToday() {
      const date = new Date();
      return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
    },
    onDateChange(date) {
      this.selectedDate = date;
      this.loadPlanData();
      this.loadStatsData();
    },
    navigateTo(url, params = {}) {
      let query = Object.keys(params).map(key => `${key}=${params[key]}`).join('&');
      uni.navigateTo({ url: query ? `${url}?${query}` : url });
    },
    navigateToRecipeAnalyze() {
      uni.navigateTo({
        url: '/pages/recipeAnalyze/recipeAnalyze'
      });
    },
    loadWeightData() {
      const records = getWeightRecord();
      this.initialWeight = getInitialWeight();
      if (records && records.length) {
        const sorted = records.sort((a, b) => new Date(b.date) - new Date(a.date));
        this.currentWeight = sorted[0].weight;
        if (this.initialWeight) {
          this.weightDiff = (this.currentWeight - this.initialWeight).toFixed(1);
        }
      } else {
        this.currentWeight = null;
        this.weightDiff = 0;
      }
    },
    loadPlanData() {
      const plan = getPlanByDate(this.selectedDate);
      if (plan && plan.title && (plan.warmup?.length || plan.main?.length || plan.cooldown?.length)) {
        this.todayPlanName = plan.title;
      } else {
        this.todayPlanName = 'N';
      }
      
      this.completedDays = getCompletedDaysCount();
      
      const firstPlanDate = getFirstPlanDate();
      if (firstPlanDate) {
        try {
          const firstDate = new Date(firstPlanDate.replace(/-/g, '/'));
          const today = new Date();
          firstDate.setHours(0, 0, 0, 0);
          today.setHours(0, 0, 0, 0);
          
          const diffTime = today.getTime() - firstDate.getTime();
          if (diffTime >= 0) {
            this.持续天数 = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
          } else {
            this.持续天数 = 1;
          }
        } catch (e) {
          console.error('日期计算错误:', e);
          this.持续天数 = 0;
        }
      } else {
        this.持续天数 = 0;
      }
    },
    
    // 运动数据相关方法
    loadStatsData() {
      const key = `stats_${this.selectedDate}`;
      const stats = uni.getStorageSync(key);
      if (stats) {
        this.todayDuration = stats.duration || 0;
        this.todaySteps = stats.steps || 0;
      } else {
        this.todayDuration = 0;
        this.todaySteps = 0;
      }
    },
    
    saveStatsData() {
      const key = `stats_${this.selectedDate}`;
      const stats = {
        duration: this.todayDuration,
        steps: this.todaySteps,
        date: this.selectedDate
      };
      uni.setStorageSync(key, stats);
    },
    
    showDurationModal() {
      this.durationInput = String(this.todayDuration);
      this.durationFocus = true;
      this.showDurationModalFlag = true;
    },
    
    closeDurationModal() {
      this.showDurationModalFlag = false;
      this.durationFocus = false;
      this.durationInput = '';
    },
    
    saveDuration() {
      const duration = parseInt(this.durationInput);
      if (isNaN(duration) || duration < 0) {
        uni.showToast({ title: '请输入有效的分钟数', icon: 'none' });
        return;
      }
      this.todayDuration = duration;
      this.saveStatsData();
      this.closeDurationModal();
      uni.showToast({ title: '已记录', icon: 'success' });
    },
    
    showStepsModal() {
      this.stepsInput = String(this.todaySteps);
      this.stepsFocus = true;
      this.showStepsModalFlag = true;
    },
    
    closeStepsModal() {
      this.showStepsModalFlag = false;
      this.stepsFocus = false;
      this.stepsInput = '';
    },
    
    saveSteps() {
      const steps = parseInt(this.stepsInput);
      if (isNaN(steps) || steps < 0) {
        uni.showToast({ title: '请输入有效的步数', icon: 'none' });
        return;
      }
      this.todaySteps = steps;
      this.saveStatsData();
      this.closeStepsModal();
      uni.showToast({ title: '已记录', icon: 'success' });
    }
  }
};
</script>

<style scoped>
.container {
  padding: 10rpx;
  background: #f5f6fa;
  min-height: 100vh;
}

/* 入口卡片行 */
.card-row {
  display: flex;
  justify-content: space-between;
  margin: 15rpx 0;
  gap: 15rpx;
}

.card {
  flex: 1;
  background: white;
  border-radius: 24rpx;
  padding: 30rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);
  transition: all 0.3s;
  min-height: 220rpx;
  display: flex;
  flex-direction: column;
  margin: 20rpx;
}

.card:active {
  transform: scale(0.98);
}

/* 健身计划卡片 */
.plan-card {
  justify-content: flex-start;
}

.plan-title {
  font-size: 38rpx;
  font-weight: bold;
  color: #333;
  line-height: 1.4;
  margin-bottom: 20rpx;
  display: block;
}
.plan-titles {
  font-size: 36rpx;
  font-weight: bold;
  color: #ff9a56;
  line-height: 1.4;
  margin-bottom: 20rpx;
  display: block;
}

.plan-stat {
  font-size: 32rpx;
  font-weight: bold;
  color: #999;
  line-height: 1.5;
  margin-bottom: 12rpx;
  display: block;
}

.plan-stat:last-child {
  margin-bottom: 0;
}

/* 今日食谱卡片 */
.recipe-card {
  justify-content: flex-start;
}

.recipe-title {
  font-size: 38rpx;
  font-weight: bold;
  color: #333;
  line-height: 1.4;
  margin-bottom: 20rpx;
  display: block;
}

.recipe-item {
  font-size: 32rpx;
  font-weight: bold;
  color: #999;
  line-height: 1.5;
  margin-bottom: 12rpx;
  display: block;
}

.recipe-item:last-child {
  margin-bottom: 0;
}

/* 体重记录卡片 */
.weight-card {
  background: white;
  border-radius: 24rpx;
  padding: 30rpx;
  margin-top: 20rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);
}

.weight-header {
  margin-bottom: 30rpx;
}

.weight-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.weight-content {
  display: flex;
  justify-content: center;
  align-items: center;
}

.weight-left {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.weight-label {
  font-size: 26rpx;
  color: #999;
  margin-bottom: 12rpx;
}

.weight-value {
  font-size: 60rpx;
  font-weight: bold;
  color: #333;
  line-height: 1;
  margin-bottom: 8rpx;
}

.weight-unit {
  font-size: 26rpx;
  color: #999;
}

.weight-right {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.weight-diff {
  font-size: 60rpx;
  font-weight: bold;
  margin-bottom: 12rpx;
  line-height: 1;
}

.weight-diff-placeholder {
  font-size: 60rpx;
  font-weight: bold;
  color: #ccc;
  margin-bottom: 12rpx;
  line-height: 1;
}

.diff-up {
  color: #ff3366;
}

.diff-down {
  color: #4caf50;
}

.diff-equal {
  color: #999;
}

.weight-compare-label {
  font-size: 26rpx;
  color: #999;
}

/* 底部统计行 - 左2右1布局 */
.stats-row {
  display: flex;
  gap: 20rpx;
  margin-top: 20rpx;
}

.stats-left {
  flex: 2;
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

/* 右侧统计分析卡片 */
.stats-right {
  flex: 3;
  background: white;
  border-radius: 24rpx;
  padding: 30rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
  margin: 10rpx;
}

.stats-right:active {
  transform: scale(0.98);
}

/* 仪表盘圆环容器 */
.gauge-ring {
  width: 200rpx;
  height: 200rpx;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 背景圆环*/
.ring-bg {
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 20rpx solid #e0e0e0;
  box-sizing: border-box;
}

/* 前景圆环*/
.ring-fill {
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 20rpx solid transparent;
  border-top-color: #333;
  border-right-color: #333;
  box-sizing: border-box;
  transform: rotate(45deg);
}

/* 中心文字 */
.analyze-title {
  font-size: 38rpx;
  font-weight: bold;
  color: #333;
  text-align: center;
  line-height: 1.3;
  z-index: 1;
}

/* 左侧小卡片 */
.stats-card-small {
  background: white;
  border-radius: 24rpx;
  padding: 26rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  justify-content: center;
  transition: all 0.3s;
  margin: 10rpx;
}

.stats-card-small:active {
  transform: scale(0.98);
}

.stats-title-small {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 15rpx;
}

.stats-value-row-small {
  display: flex;
  align-items: baseline;
  gap: 8rpx;
}

.stats-number-small {
  font-size: 56rpx;
  font-weight: bold;
  color: #333;
}

.stats-unit-small {
  font-size: 28rpx;
  color: #999;
}

/* 弹窗样式 */
.modal-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-container {
  width: 550rpx;
  background: white;
  border-radius: 40rpx;
  overflow: hidden;
}

.modal-header {
  padding: 40rpx 30rpx 20rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1rpx solid #f0f0f0;
}

.modal-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
}

.modal-close {
  font-size: 40rpx;
  color: #999;
  padding: 10rpx;
}

.modal-body {
  padding: 40rpx 30rpx;
}

.form-item {
  margin-bottom: 20rpx;
}

.form-label {
  font-size: 30rpx;
  color: #333;
  font-weight: 500;
  display: block;
  margin-bottom: 20rpx;
}

.input-group {
  display: flex;
  align-items: center;
  border: 2rpx solid #e0e0e0;
  border-radius: 16rpx;
  background: white;
  padding-right: 20rpx;
}

.form-input {
  flex: 1;
  padding: 25rpx 20rpx;
  font-size: 30rpx;
  border: none;
  background: transparent;
}

.input-unit {
  font-size: 28rpx;
  color: #999;
}

.modal-footer {
  display: flex;
  border-top: 1rpx solid #f0f0f0;
}

.cancel-btn, .confirm-btn {
  flex: 1;
  height: 100rpx;
  line-height: 100rpx;
  text-align: center;
  border: none;
  border-radius: 0;
  font-size: 32rpx;
  background: white;
}

.cancel-btn {
  color: #999;
  border-right: 1rpx solid #f0f0f0;
}

.confirm-btn {
  background: #333;
  color: white;
}

.cancel-btn::after,
.confirm-btn::after {
  border: none;
}
</style>