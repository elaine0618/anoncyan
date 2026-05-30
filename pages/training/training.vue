<template>
  <view class="training-container">
    <!-- 准备倒计时状态 -->
    <view class="prepare-state" v-if="isPreparing">
      <view class="prepare-timer">
        <text class="prepare-number">{{ timeLeft }}</text>
        <text class="prepare-text">准备开始</text>
      </view>
    </view>

    <!-- 训练状态 -->
    <view class="training-state" v-else-if="currentAction">
      <!-- 训练状态头部 -->
      <view class="training-header">
        <text class="plan-title">{{ plan.title }}</text>
        <text class="action-progress">{{ currentActionIdx + 1 }} / {{ actions.length }}</text>
      </view>

      <!-- 动作展示区域 -->
      <view class="action-display">
        <image 
          v-if="currentAction.image" 
          :src="currentAction.image" 
          mode="aspectFit" 
          class="action-img"
        ></image>
        <view v-else class="action-img-placeholder">
          <text class="placeholder-icon"></text>
        </view>
        <text class="action-name">{{ currentAction.name }}</text>
		<text class="action-params" v-if="currentAction.times && currentAction.times > 0">
		    {{ currentAction.sets }}组 x {{ currentAction.times }}次
		  </text>
		  <text class="action-params" v-else>
		    {{ currentAction.sets }}组 x {{ currentAction.duration }}秒
		  </text>
        <view class="status-badge" v-if="isResting">
          <text>休息</text>
        </view>
        <view class="status-badge action" v-else>
          <text>训练</text>
        </view>
      </view>

      <!-- 计时器区域 -->
      <view class="timer-area">
        <text class="timer-number">{{ timeLeft }}</text>
      </view>

      <!-- 组数信息 -->
      <view class="sets-info">
        <text>{{ currentSet }} / {{ currentAction.sets }} 组</text>
      </view>
    </view>
  </view>
</template>

<script>
import { getRestSeconds, getSoundEnabled } from '@/utils/settings.js';
import { setWorkoutCompletionStatus } from '@/utils/storage.js';

export default {
  data() {
    return {
      plan: null,
      actions: [],
      currentActionIdx: 0,
      currentAction: null,
      currentSet: 1,
      timer: null,
      timeLeft: 0,
      isRunning: true,
      isResting: false,
      isPreparing: true,
      prepareSeconds: 10,
      restSeconds: 30,
      soundEnabled: true
    };
  },
  onLoad(options) {
    if (options.plan) {
      this.plan = JSON.parse(decodeURIComponent(options.plan));
      this.actions = this.plan.actions || [];
      this.restSeconds = getRestSeconds();
      this.soundEnabled = getSoundEnabled();
      
      if (this.actions.length === 0) {
        uni.showToast({ title: '暂无训练动作', icon: 'none' });
        setTimeout(() => uni.navigateBack(), 1500);
        return;
      }
      
      this.initTraining();
    } else {
      uni.showToast({ title: '加载失败', icon: 'none' });
      setTimeout(() => uni.navigateBack(), 1500);
    }
  },
  methods: {
    initTraining() {
      this.isPreparing = true;
      this.isResting = false;
      this.timeLeft = this.prepareSeconds;
      this.startTimer();
    },
    startTimer() {
      this.timer = setInterval(() => {
        if (this.timeLeft <= 0) {
          this.handleTimerComplete();
        } else {
		  if (this.timeLeft <= 5 && this.timeLeft > 0 && this.soundEnabled) {
			this.playKonSound();
		  }
		  this.timeLeft--;
        }
      }, 1000);
    },
    handleTimerComplete() {
      // 最后一秒播报 biu.mp3
      if (this.soundEnabled) {
        this.playChinSound();
      }
      
      if (this.isPreparing) {
        // 准备倒计时结束，开始第一个动作的第一组
        this.isPreparing = false;
        this.currentAction = this.actions[0];
        this.currentActionIdx = 0;
        this.currentSet = 1;
        this.timeLeft = this.currentAction.duration;
        return;
      }
      
      if (this.isResting) {
        // 休息结束，开始当前动作的下一组
        this.isResting = false;
        this.timeLeft = this.currentAction.duration;
        return;
      }
      
      // 动作倒计时结束
      if (this.currentSet < this.currentAction.sets) {
        // 还有下一组，进入休息，显示当前动作信息
        this.currentSet++;
        this.isResting = true;
        this.timeLeft = this.restSeconds;
      } else {
        // 当前动作的所有组完成，切换到下一个动作
        if (this.currentActionIdx + 1 < this.actions.length) {
          // 先切换到下一个动作，再进入休息
          this.currentActionIdx++;
          this.currentAction = this.actions[this.currentActionIdx];
          this.currentSet = 1;
          this.isResting = true;
          this.timeLeft = this.restSeconds;
        } else {
          // 所有动作完成
          this.finishTraining();
        }
      }
    },
    playKonSound() {
      const innerAudioContext = uni.createInnerAudioContext();
      innerAudioContext.src = '/static/kon.mp3';
      innerAudioContext.play();
      innerAudioContext.onEnded(() => {
        innerAudioContext.destroy();
      });
    },
    playChinSound() {
      const innerAudioContext = uni.createInnerAudioContext();
      innerAudioContext.src = '/static/biu.mp3';
      innerAudioContext.play();
      innerAudioContext.onEnded(() => {
        innerAudioContext.destroy();
      });
    },
    finishTraining() {
      this.stopTimer();
      const today = this.getToday();
      setWorkoutCompletionStatus(today, true);
      
      uni.showModal({
        title: '训练完成',
        content: '恭喜你完成了今天的训练计划！',
        confirmText: '完成',
        showCancel: false,
        success: () => {
          uni.navigateBack();
        }
      });
    },
    stopTimer() {
      if (this.timer) {
        clearInterval(this.timer);
        this.timer = null;
      }
    },
    getToday() {
      const date = new Date();
      return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
    }
  },
  onUnload() {
    this.stopTimer();
  }
};
</script>

<style scoped>
.training-container {
  min-height: 100vh;
  background: white;
  padding: 40rpx 30rpx;
}

/* 准备倒计时样式 */
.prepare-state {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}
.action-params {
  font-size: 28rpx;
  color: #333;
  display: block;
  margin-bottom: 20rpx;
}

.prepare-timer {
  text-align: center;
}

.prepare-number {
  font-size: 200rpx;
  font-weight: bold;
  color: #333;
  font-family: monospace;
  display: block;
  margin-bottom: 40rpx;
}

.prepare-text {
  font-size: 48rpx;
  color: #333;
}

/* 训练状态样式 */
.training-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 60rpx;
}

.plan-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
}

.action-progress {
  font-size: 28rpx;
  color: #999;
}

.action-display {
  background: white;
  border-radius: 40rpx;
  padding: 60rpx 40rpx;
  margin-bottom: 60rpx;
  text-align: center;
  box-shadow: 0 10rpx 30rpx rgba(0,0,0,0.1);
}

.action-img {
  width: 400rpx;
  height: 400rpx;
  margin: 0 auto 30rpx;
  border-radius: 30rpx;
  background: #f5f5f5;
}

.action-img-placeholder {
  width: 400rpx;
  height: 400rpx;
  margin: 0 auto 30rpx;
  border-radius: 30rpx;
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.placeholder-icon {
  font-size: 120rpx;
  color: #ccc;
}

.action-name {
  font-size: 48rpx;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 20rpx;
}

.status-badge {
  display: inline-block;
  padding: 10rpx 40rpx;
  border-radius: 40rpx;
  font-size: 28rpx;
  font-weight: bold;
}

.status-badge.rest {
  background: #4caf50;
  color: white;
}

.status-badge.action {
  background: #333;
  color: white;
}

/* 计时器区域 */
.timer-area {
  text-align: center;
  margin-bottom: 60rpx;
}

.timer-number {
  font-size: 200rpx;
  font-weight: bold;
  color: #333;
  font-family: monospace;
}

/* 组数信息 */
.sets-info {
  text-align: center;
  margin-bottom: 80rpx;
}

.sets-info text {
  font-size: 32rpx;
  color: #333;
  background: #f0f0f0;
  padding: 15rpx 40rpx;
  border-radius: 60rpx;
}
</style>