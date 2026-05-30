<template>
  <view class="settings-container">
    <view class="settings-group">
      <view class="group-title">全局设置</view>
      <view class="setting-item">
        <text class="label">组间休息时间</text>
        <view class="control">
          <input 
            type="number" 
            v-model="restSeconds" 
            @blur="saveRest"
            class="input-number"
          />
          <text class="unit">秒</text>
        </view>
      </view>
      <view class="setting-item">
        <text class="label">训练提示音效</text>
        <switch :checked="soundEnabled" @change="toggleSound" color="#333" />
      </view>
    </view>

    <view class="settings-group">
      <view class="group-title">数据调试</view>
      <view class="setting-item" @click="clearAllData">
        <text class="label">清除所有数据</text>
        <text class="label">清空</text>
      </view>
      <view class="setting-item" @click="exportData">
        <text class="label">导出数据</text>
        <text>导出</text>
      </view>
    </view>

    <view class="settings-group">
      <view class="group-title">训练设置</view>
      <button type="primary" @click="toPlanManage" class="manage-btn">训练计划管理</button>
    </view>
	
	<view class="settings-group">
	  <view class="group-title">使用说明</view>
	  <view class="setting-item">
	    <text class="unit">1. 初次使用请开关一次音效确保正常播放，\n2. 编辑记录时请填写正常值正常操作，\n3. 录入图片推荐100x100，可重复应用，\n4. 饮食记录仅作参考复盘，吃多吃少靠自觉</text>
	  </view>
	</view>
  </view>
</template>

<script>
import { getRestSeconds, setRestSeconds, getSoundEnabled, setSoundEnabled } from '@/utils/settings.js';

export default {
  data() {
    return {
      restSeconds: 30,
      soundEnabled: true
    };
  },
  onLoad() {
    this.loadSettings();
  },
  methods: {
    loadSettings() {
      this.restSeconds = getRestSeconds();
      this.soundEnabled = getSoundEnabled();
    },
    saveRest() {
      setRestSeconds(this.restSeconds);
      uni.showToast({
        title: '已保存',
        icon: 'success'
      });
    },
    toggleSound(e) {
      this.soundEnabled = e.detail.value;
      setSoundEnabled(this.soundEnabled);
      uni.showToast({
        title: this.soundEnabled ? '已开启音效' : '已关闭音效',
        icon: 'success'
      });
    },
    toPlanManage() {
      uni.navigateTo({
        url: '/pages/planManage/planManage'
      });
    },
    clearAllData() {
      uni.showModal({
        title: '警告',
        content: '清除所有数据后将无法恢复，确定继续吗？',
        success: (res) => {
          if (res.confirm) {
            uni.clearStorageSync();
            this.loadSettings();
            uni.showToast({
              title: '已清除所有数据',
              icon: 'success'
            });
          }
        }
      });
    },
    exportData() {
      const allData = {
        weightRecords: uni.getStorageSync('weight_records'),
        planList: uni.getStorageSync('plan_list'),
        settings: {
          restSeconds: this.restSeconds,
          soundEnabled: this.soundEnabled
        }
      };
      const dataStr = JSON.stringify(allData, null, 2);
      console.log('导出数据:', dataStr);
      uni.showModal({
        title: '导出数据',
        content: '数据已复制到控制台，可自行保存',
        showCancel: false
      });
      // 实际项目中可以保存到文件或分享
    }
  }
};
</script>

<style scoped>
.settings-container {
  padding: 30rpx;
  background: #f5f6fa;
  min-height: 100vh;
}

.settings-group {
  background: white;
  border-radius: 20rpx;
  margin-bottom: 40rpx;
  overflow: hidden;
}

.group-title {
  padding: 30rpx;
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  border-bottom: 1rpx solid #f0f0f0;
  background: #fafafa;
}

.setting-item {
  padding: 30rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1rpx solid #f0f0f0;
}

.setting-item:last-child {
  border-bottom: none;
}

.label {
  font-size: 30rpx;
  color: #333;
}

.control {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.input-number {
  width: 120rpx;
  text-align: center;
  border: 1rpx solid #ddd;
  border-radius: 10rpx;
  padding: 10rpx;
  font-size: 28rpx;
}

.unit {
  font-size: 28rpx;
  color: #999;
}

.manage-btn {
  margin: 30rpx;
  background: #333;
  color: white;
  border-radius: 60rpx;
}

</style>