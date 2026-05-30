<template>
  <view class="workout-item" @click="$emit('click')">
    <view class="item-left">
      <image v-if="data.image" :src="data.image" mode="aspectFill" class="item-image"></image>
      <view v-else class="item-image-placeholder">
        <text></text>
      </view>
    </view>
    <view class="item-info">
      <text class="item-name">{{ data.name }}</text>
		<text class="item-params" v-if="data.times && data.times > 0">
		  {{ data.sets }}组 x {{ data.times }}次
		</text>
		<text class="item-params" v-else>
		  {{ data.sets }}组 x {{ data.duration }}秒
		</text>
    </view>
  </view>
</template>

<script>
export default {
  props: {
    data: {
      type: Object,
      required: true,
      default: () => ({
        name: '动作名称',
        sets: 0,
        duration: 0,
        image: ''
      })
    }
  }
};
</script>

<style scoped>
.workout-item {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.workout-item:last-child {
  border-bottom: none;
}

.item-left {
  margin-right: 24rpx;
}

.item-image {
  width: 100rpx;
  height: 100rpx;
  border-radius: 16rpx;
  background: #f0f0f0;
}

.item-image-placeholder {
  width: 100rpx;
  height: 100rpx;
  border-radius: 16rpx;
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 50rpx;
}

.item-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.item-name {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 8rpx;
}

.item-params {
  font-size: 26rpx;
  color: #999;
  font-weight: 500;
}
</style>