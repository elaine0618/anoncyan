<template>
  <view class="workout-page">
    <!-- 头部 -->
    <view class="plan-header">
      <view class="plan-title-section">
        <text class="plan-title">{{ currentPlan.title || 'N' }}</text>
        <view class="header-actions">
          <text class="header-btn" @click="showAssociateModal">🔗</text>
          <text class="header-btn" @click="clearPlan">🗑️</text>
        </view>
      </view>
      <view class="empty-tip" v-if="!hasActions">
        <text>休息</text>
      </view>
    </view>

    <!-- 开始训练按钮 / 训练已完成 -->
    <view class="start-btn-wrapper" v-if="hasActions && isToday">
      <button v-if="!isTodayCompleted" class="start-btn" @click="startTraining">开始训练</button>
      <view v-else class="completed-tip">
        <text>训练已完成</text>
      </view>
    </view>
    
    <!-- 非当天日期的提示 -->
    <view class="disabled-tip" v-if="hasActions && !isToday">
      <text>请完成今日训练计划</text>
    </view>

    <!-- 训练内容列表 -->
    <view class="plan-content" v-if="hasActions">
      <!-- 热身训练 -->
      <view class="section" v-if="currentPlan.warmup && currentPlan.warmup.length">
        <view class="section-title">热身训练</view>
        <WorkoutCard 
          v-for="item in currentPlan.warmup" 
          :key="item.id" 
          :data="item" 
          @click="toDetail(item)" 
        />
      </view>

      <!-- 正式训练 -->
      <view class="section" v-if="currentPlan.main && currentPlan.main.length">
        <view class="section-title">正式训练</view>
        <WorkoutCard 
          v-for="item in currentPlan.main" 
          :key="item.id" 
          :data="item" 
          @click="toDetail(item)" 
        />
      </view>

      <!-- 冷身训练 -->
      <view class="section" v-if="currentPlan.cooldown && currentPlan.cooldown.length">
        <view class="section-title">冷身训练</view>
        <WorkoutCard 
          v-for="item in currentPlan.cooldown" 
          :key="item.id" 
          :data="item" 
          @click="toDetail(item)" 
        />
      </view>
    </view>

    <!-- 应用计划弹窗 -->
    <view class="modal-mask" v-if="showModal" @click="closeModal">
      <view class="modal-container" @click.stop>
        <view class="modal-header">
          <text class="modal-title">点击应用</text>
          <text class="modal-close" @click="closeModal">✕</text>
        </view>
        <view class="modal-body">
          <scroll-view scroll-y class="plan-list-scroll">
            <view 
              class="plan-item" 
              v-for="plan in planList" 
              :key="plan.id"
              @click="associatePlan(plan)"
            >
              <text class="plan-item-title">{{ plan.title }}</text>
            </view>
            <view class="empty-plans" v-if="planList.length === 0">
              <text>暂无训练计划，请先创建</text>
            </view>
          </scroll-view>
        </view>
        <view class="modal-footer">
          <button class="cancel-btn" @click="closeModal">取消</button>
          <button class="confirm-btn" @click="goToPlanManage">去创建</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import WorkoutCard from '@/components/WorkoutCard.vue';
import { getPlanByDate, savePlanByDate, getPlanList, getWorkoutCompletionStatus } from '@/utils/storage.js';

export default {
  components: { WorkoutCard },
  data() {
    return {
      currentPlan: { 
        title: '', 
        warmup: [], 
        main: [], 
        cooldown: [] 
      },
      currentDate: '',
      showModal: false,
      planList: []
    };
  },
  computed: {
    hasActions() {
      return (this.currentPlan.warmup && this.currentPlan.warmup.length) ||
             (this.currentPlan.main && this.currentPlan.main.length) ||
             (this.currentPlan.cooldown && this.currentPlan.cooldown.length);
    },
    isToday() {
      const today = this.getToday();
      return this.currentDate === today;
    },
    isTodayCompleted() {
      return getWorkoutCompletionStatus(this.currentDate);
    }
  },
  onLoad(options) {
    this.currentDate = options.date || this.getToday();
    this.loadPlan();
  },
  onShow() {
    this.loadPlanList();
  },
  methods: {
    getToday() {
      const date = new Date();
      return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
    },
    loadPlan() {
      const plan = getPlanByDate(this.currentDate);
      if (plan) {
        this.currentPlan = plan;
      } else {
        this.currentPlan = { 
          title: '', 
          warmup: [], 
          main: [], 
          cooldown: [] 
        };
      }
    },
    loadPlanList() {
      this.planList = getPlanList();
    },
    showAssociateModal() {
      this.loadPlanList();
      this.showModal = true;
    },
    closeModal() {
      this.showModal = false;
    },
    goToPlanManage() {
      this.closeModal();
      uni.navigateTo({
        url: '/pages/planManage/planManage'
      });
    },
    associatePlan(plan) {
      savePlanByDate(this.currentDate, plan);
      this.loadPlan();
      this.closeModal();
      uni.showToast({ 
        title: `已应用：${plan.title}`, 
        icon: 'success' 
      });
    },
    clearPlan() {
      if (!this.hasActions) {
        uni.showToast({ title: '当前无训练计划', icon: 'none' });
        return;
      }
      uni.showModal({
        title: '确认删除',
        content: '确定要清空当前训练计划吗？',
        success: (res) => {
          if (res.confirm) {
            const emptyPlan = { 
              title: 'N', 
              warmup: [], 
              main: [], 
              cooldown: [] 
            };
            savePlanByDate(this.currentDate, emptyPlan);
            this.loadPlan();
            uni.showToast({ title: '已清空', icon: 'success' });
          }
        }
      });
    },
    startTraining() {
      if (!this.hasActions) {
        uni.showToast({ title: '请先应用训练计划', icon: 'none' });
        return;
      }
      if (!this.isToday) {
        uni.showToast({ title: '请完成今日训练计划', icon: 'none' });
        return;
      }
      if (this.isTodayCompleted) {
        uni.showToast({ title: '已完成训练', icon: 'none' });
        return;
      }
      const allActions = [
        ...(this.currentPlan.warmup || []),
        ...(this.currentPlan.main || []),
        ...(this.currentPlan.cooldown || [])
      ];
      const trainingPlan = {
        title: this.currentPlan.title,
        actions: allActions
      };
      uni.navigateTo({ 
        url: `/pages/training/training?plan=${encodeURIComponent(JSON.stringify(trainingPlan))}`
      });
    },
    toDetail(item) {
      const planData = {
        title: this.currentPlan.title,
        actions: [
          ...(this.currentPlan.warmup || []),
          ...(this.currentPlan.main || []),
          ...(this.currentPlan.cooldown || [])
        ]
      };
      uni.navigateTo({ 
        url: `/pages/workoutDetail/workoutDetail?data=${encodeURIComponent(JSON.stringify(item))}&planData=${encodeURIComponent(JSON.stringify(planData))}`
      });
    }
  }
};
</script>

<style scoped>
.workout-page {
  min-height: 100vh;
  background: #f5f6fa;
  padding: 30rpx;
  padding-bottom: 120rpx;
}

.plan-header {
  background: white;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}

.plan-title-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.plan-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
}

.header-actions {
  display: flex;
  gap: 20rpx;
}

.header-btn {
  font-size: 40rpx;
  padding: 10rpx;
}

.empty-tip {
  margin-top: 20rpx;
  padding-top: 20rpx;
  border-top: 1rpx solid #f0f0f0;
  text-align: center;
}

.empty-tip text {
  font-size: 28rpx;
  color: #999;
}

/* 开始训练按钮 */
.start-btn-wrapper {
  margin-bottom: 30rpx;
}

.start-btn {
  background: #333;
  color: white;
  border-radius: 60rpx;
  border: none;
  font-size: 32rpx;
  height: 90rpx;
  line-height: 90rpx;
  width: 100%;
}

/* 训练已完成提示 */
.completed-tip {
  background: #666;
  border-radius: 60rpx;
  padding: 25rpx;
  text-align: center;
}

.completed-tip text {
  color: white;
  font-size: 32rpx;
  font-weight: bold;
}

/* 非当天提示 */
.disabled-tip {
  background: #f5f5f5;
  border-radius: 20rpx;
  padding: 30rpx;
  text-align: center;
  margin-bottom: 30rpx;
}

.disabled-tip text {
  font-size: 28rpx;
  color: #999;
}

/* 训练内容 */
.plan-content {
  background: white;
  border-radius: 20rpx;
  padding: 30rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}

.section {
  margin-bottom: 30rpx;
}

.section:last-child {
  margin-bottom: 0;
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 20rpx;
  padding-left: 10rpx;

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
  width: 600rpx;
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
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.modal-close {
  font-size: 40rpx;
  color: #999;
  padding: 10rpx;
}

.modal-body {
  padding: 20rpx;
  max-height: 500rpx;
}

.plan-list-scroll {
  max-height: 500rpx;
}

.plan-item {
  padding: 25rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.plan-item:active {
  background: #f5f5f5;
}

.plan-item-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 8rpx;
}

.plan-item-date {
  font-size: 24rpx;
  color: #999;
}

.empty-plans {
  text-align: center;
  padding: 40rpx;
  color: #999;
  font-size: 28rpx;
}

.modal-footer {
  display: flex;
  border-top: 1rpx solid #f0f0f0;
}

.cancel-btn, .confirm-btn {
  flex: 1;
  height: 90rpx;
  line-height: 90rpx;
  text-align: center;
  border: none;
  border-radius: 0;
  font-size: 30rpx;
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
</style>