<template>
  <view class="plan-manage">
    <!-- 新建计划按钮 -->
    <view class="create-btn-wrapper">
      <button class="create-btn" @click="createNewPlan">新建训练计划</button>
    </view>

    <!-- 计划列表 -->
    <view class="plan-list">
      <view class="plan-card" v-for="plan in planList" :key="plan.id" @click="viewPlanDetail(plan)">
        <view class="plan-info">
          <text class="plan-title">{{ plan.title || '未命名计划' }}</text>
        </view>
        <view class="plan-actions" @click.stop>
          <text class="action-icon" @click="editPlan(plan)">✏️</text>
          <text class="action-icon" @click="deletePlan(plan)">🗑️</text>
          <text class="action-icon" @click="associatePlan(plan)">🔗</text>
        </view>
      </view>
    </view>

    <!-- 空状态 -->
    <view class="empty-state" v-if="planList.length === 0">
      <text class="empty-text">暂无训练计划，点击上方按钮创建</text>
    </view>
  </view>
</template>

<script>
import { getPlanList, savePlanList, savePlanByDate } from '@/utils/storage.js';

export default {
  data() {
    return {
      planList: []
    };
  },
  onShow() {
    this.loadPlans();
  },
  methods: {
    loadPlans() {
      this.planList = getPlanList();
    },
    createNewPlan() {
      const newPlan = {
        id: Date.now(),
        title: 'XX训练',
        createDate: this.getToday(),
        warmup: [],      // 热身训练
        main: [],        // 正式训练
        cooldown: []     // 冷身训练
      };
      uni.navigateTo({
        url: `/pages/planEdit/planEdit?plan=${encodeURIComponent(JSON.stringify(newPlan))}&isNew=true`
      });
    },
    viewPlanDetail(plan) {
      uni.navigateTo({
        url: `/pages/planEdit/planEdit?plan=${encodeURIComponent(JSON.stringify(plan))}&readonly=true`
      });
    },
    editPlan(plan) {
      uni.navigateTo({
        url: `/pages/planEdit/planEdit?plan=${encodeURIComponent(JSON.stringify(plan))}`
      });
    },
    deletePlan(plan) {
      uni.showModal({
        title: '确认删除',
        content: `确定要删除"${plan.title}"吗？`,
        success: (res) => {
          if (res.confirm) {
            const index = this.planList.findIndex(p => p.id === plan.id);
            if (index !== -1) {
              this.planList.splice(index, 1);
              savePlanList(this.planList);
              this.loadPlans();
              uni.showToast({ title: '已删除', icon: 'success' });
            }
          }
        }
      });
    },
    associatePlan(plan) {
      // 获取首页当前选择的日期
      const pages = getCurrentPages();
      const prevPage = pages[pages.length - 2];
      const selectedDate = prevPage?.data?.selectedDate || this.getToday();
      
      savePlanByDate(selectedDate, plan);
      uni.showToast({ 
        title: `已应用到${selectedDate}`,
        icon: 'success'
      });
      setTimeout(() => {
        uni.navigateBack();
      }, 1500);
    },
    getToday() {
      const date = new Date();
      return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
    }
  }
};
</script>

<style scoped>
.plan-manage {
  min-height: 100vh;
  background: #f5f6fa;
  padding: 30rpx;
}

.create-btn-wrapper {
  margin-bottom: 30rpx;
}

.create-btn {
  background: #333;
  color: white;
  border-radius: 60rpx;
  border: none;
  font-size: 32rpx;
  height: 90rpx;
  line-height: 90rpx;
}

.plan-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.plan-card {
  background: white;
  border-radius: 20rpx;
  padding: 30rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}

.plan-info {
  flex: 1;
}

.plan-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 8rpx;
}

.plan-date {
  font-size: 24rpx;
  color: #999;
}

.plan-actions {
  display: flex;
  gap: 20rpx;
}

.action-icon {
  font-size: 40rpx;
  padding: 10rpx;
}

.empty-state {
  text-align: center;
  padding: 120rpx 0;
}

.empty-icon {
  font-size: 80rpx;
  display: block;
  margin-bottom: 20rpx;
}

.empty-text {
  font-size: 28rpx;
  color: #999;
}
</style>