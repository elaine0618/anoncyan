<template>
  <view class="detail-container">
    <!-- 动作图片区域 -->
    <view class="image-section">
      <image 
        v-if="actionData.image" 
        :src="actionData.image" 
        mode="aspectFit" 
        class="action-image"
      ></image>
      <view v-else class="image-placeholder">
      </view>
    </view>

    <!-- 参数卡片区域 -->
	<view class="params-section">
	  <view class="param-card">
		<text class="param-value">{{ actionData.sets || 0 }} 组</text>
	  </view>
	  <view class="param-card">
		<text class="param-value" v-if="actionData.times && actionData.times > 0">
		  {{ actionData.times }} 次/组
		</text>
		<text class="param-value" v-else>
		  {{ actionData.duration || 0 }} 秒/组
		</text>
	  </view>
	</view>

    <!-- 标题与描述卡片 -->
    <view class="info-card">
      <text class="action-name">{{ actionData.name || '动作名称' }}</text>
      <text class="action-description">{{ actionData.description || '暂无详细描述' }}</text>
    </view>
  </view>
</template>

<script>
import { getRestSeconds } from '@/utils/settings.js';

export default {
  data() {
    return {
      actionData: {
        name: '',
        sets: 0,
        duration: 0,
		times: 0,
        image: '',
        description: ''
      },
      restSeconds: 30
    };
  },
  onLoad(options) {
    if (options.data) {
      try {
        const decodedData = decodeURIComponent(options.data);
        this.actionData = JSON.parse(decodedData);
      } catch (e) {
        console.error('解析动作数据失败', e);
      }
    }
    this.restSeconds = getRestSeconds();
  }
};
</script>

<style scoped>
.detail-container {
  min-height: 100vh;
  background: #f5f6fa;
  padding: 30rpx;
}

/* 图片区域 */
.image-section {
  background: white;
  border-radius: 30rpx;
  padding: 60rpx;
  text-align: center;
  margin-bottom: 30rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
}

.action-image {
  width: 500rpx;
  height: 500rpx;
  border-radius: 30rpx;
  background: #f0f0f0;
}

.image-placeholder {
  width: 500rpx;
  height: 500rpx;
  margin: 0 auto;
  border-radius: 30rpx;
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.placeholder-icon {
  font-size: 200rpx;
  color: white;
}

/* 参数卡片区域 */
.params-section {
  display: flex;
  gap: 30rpx;
  margin-bottom: 30rpx;
}

.param-card {
  flex: 1;
  background: white;
  border-radius: 20rpx;
  padding: 40rpx 30rpx;
  text-align: center;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
  margin: 10rpx;
}

.param-label {
  font-size: 26rpx;
  color: #999;
  display: block;
  margin-bottom: 15rpx;
}

.param-value {
  font-size: 40rpx;
  font-weight: bold;
  color: #333;
  display: block;
}

/* 标题与描述卡片 */
.info-card {
  background: white;
  border-radius: 20rpx;
  padding: 40rpx 30rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
}

.action-name {
  font-size: 40rpx;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 25rpx;
  padding-bottom: 20rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.action-description {
  font-size: 28rpx;
  color: #666;
  line-height: 1.8;
  display: block;
}
</style>