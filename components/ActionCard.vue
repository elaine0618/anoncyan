<template>
  <view class="action-card">
    <view class="action-left">
      <image v-if="action.image" :src="action.image" mode="aspectFill" class="action-image"></image>
      <view v-else class="action-image-placeholder">
        <text></text>
      </view>
    </view>
    <view class="action-info">
      <text class="action-name">{{ action.name }}</text>
      <!-- 如果有次数且大于0，显示次数，否则显示秒数 -->
      <text class="action-params" v-if="action.times && action.times > 0">
        {{ action.sets }}组 x {{ action.times }}次
      </text>
      <text class="action-params" v-else>
        {{ action.sets }}组 x {{ action.duration }}秒
      </text>
    </view>
    <view class="action-actions" v-if="!readonly">
      <text class="edit-icon" @click="$emit('edit')">✏️</text>
      <text class="delete-icon" @click="$emit('delete')">🗑️</text>
    </view>
  </view>
</template>

<script>
export default {
  props: {
    action: {
      type: Object,
      required: true
    },
    readonly: {
      type: Boolean,
      default: false
    }
  }
};
</script>

<style scoped>
.action-card {
  border-radius: 16rpx;
  padding: 20rpx;
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.action-left {
  width: 100rpx;
  height: 100rpx;
  border-radius: 12rpx;
  overflow: hidden;
  background: #f0f0f0;
  margin-right: 15rpx;
}

.action-image {
  width: 100%;
  height: 100%;
}

.action-image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0f0f0;
  font-size: 50rpx;
}

.action-info {
  flex: 1;
}

.action-name {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 8rpx;
}

.action-params {
  font-size: 24rpx;
  color: #999;
}

.action-actions {
  display: flex;
  gap: 20rpx;
}

.edit-icon, .delete-icon {
  font-size: 36rpx;
  padding: 10rpx;
}
</style>