<template>
  <view class="weight-page">
    <!-- 顶部卡片：当前体重和记录按钮 -->
    <view class="top-card">
      <view class="current-weight-section">
        <text class="label">当前体重</text>
        <view class="weight-value">
          <text class="number">{{ currentWeight || '--' }}</text>
          <text class="unit">kg</text>
        </view>
        <text class="compare" v-if="initialWeight && currentWeight">
          {{ weightDiff > 0 ? '↑' : weightDiff < 0 ? '↓' : '→' }} {{ Math.abs(weightDiff) }}kg
        </text>
      </view>
      <view class="record-btn" @click="showRecordModal">
        <text>记录体重</text>
      </view>
    </view>

    <!-- 趋势图区域 -->
    <view class="chart-card">
      <view class="chart-header">
        <text class="chart-title">体重趋势</text>
      </view>
      <view class="chart-container">
        <canvas 
          canvas-id="weightChart" 
          class="weight-chart"
        ></canvas>
        <view class="chart-placeholder" v-if="weightRecords.length === 0">
          <text class="placeholder-text">暂无体重数据</text>
        </view>
      </view>
    </view>

    <!-- 初始体重信息卡片 -->
    <view class="info-card" v-if="initialWeight">
      <view class="info-title">数据参考</view>
      <view class="info-row">
        <text class="info-label">初始体重</text>
        <text class="info-value">{{ initialWeight }} kg</text>
      </view>
      <view class="info-row">
        <text class="info-label">初始记录日期</text>
        <text class="info-value">{{ initialDate }}</text>
      </view>
      <view class="info-row">
        <text class="info-label">已记录天数</text>
        <text class="info-value highlight">{{ daysPassed }} 天</text>
      </view>
    </view>

    <!-- 记录体重弹窗 -->
    <view class="modal-mask" v-if="showModal" @click="closeModal">
      <view class="modal-container" @click.stop>
        <view class="modal-header">
          <text class="modal-title">记录体重</text>
          <text class="modal-close" @click="closeModal">✕</text>
        </view>
        <view class="modal-body">
          <view class="form-item">
            <text class="form-label">日期</text>
            <picker mode="date" :value="selectedDate" @change="onDateChange">
              <view class="date-picker">{{ selectedDate }}</view>
            </picker>
          </view>
          
          <view class="form-item">
            <text class="form-label">体重</text>
            <view class="weight-input-group">
              <input 
                class="weight-input" 
                type="digit" 
                v-model="newWeight" 
                placeholder="例如：50.5" 
                placeholder-style="color:#ccc"
                :focus="inputFocus"
              />
              <text class="weight-unit">kg</text>
            </view>
          </view>
        </view>
        <view class="modal-footer">
          <button class="cancel-btn" @click="closeModal">取消</button>
          <button class="confirm-btn" @click="saveWeight">确认记录</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { getWeightRecord, saveWeightRecord, getInitialWeight, setInitialWeight } from '@/utils/storage.js';

export default {
  data() {
    return {
      weightRecords: [],
      currentWeight: null,
      initialWeight: null,
      initialDate: '',
      daysPassed: 0,
      weightDiff: 0,
      showModal: false,
      newWeight: '',
      selectedDate: '',
      inputFocus: false
    };
  },
  onShow() {
    this.loadData();
  },
  methods: {
    loadData() {
      this.weightRecords = getWeightRecord();
      this.initialWeight = getInitialWeight();
      this.updateCurrentWeight();
      this.calculateInitialInfo();
      setTimeout(() => {
        this.drawChart();
      }, 200);
    },
    
    updateCurrentWeight() {
      if (this.weightRecords.length > 0) {
        const sorted = [...this.weightRecords].sort((a, b) => new Date(b.date) - new Date(a.date));
        this.currentWeight = sorted[0].weight;
        if (this.initialWeight) {
          this.weightDiff = (this.currentWeight - this.initialWeight).toFixed(1);
        }
      } else {
        this.currentWeight = null;
        this.weightDiff = 0;
      }
    },
    
    calculateInitialInfo() {
      if (this.weightRecords.length > 0 && this.initialWeight) {
        // 找到第一条记录（最早的日期）
        const sortedByDate = [...this.weightRecords].sort((a, b) => new Date(a.date) - new Date(b.date));
        const firstRecord = sortedByDate[0];
        this.initialDate = this.formatDate(firstRecord.date);
        
        // 计算从第一次记录到今天的天数
        const firstDate = new Date(firstRecord.date);
        const today = new Date();
        const diffTime = Math.abs(today - firstDate);
        this.daysPassed = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      } else {
        this.initialDate = '';
        this.daysPassed = 0;
      }
    },
    
    formatDate(dateStr) {
      const date = new Date(dateStr);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}.${month}.${day}`;
    },
    
    showRecordModal() {
      this.selectedDate = this.getToday();
      this.newWeight = '';
      this.inputFocus = true;
      this.showModal = true;
    },
    
    closeModal() {
      this.showModal = false;
      this.inputFocus = false;
    },
    
    onDateChange(e) {
      this.selectedDate = e.detail.value;
    },
    
    saveWeight() {
      if (!this.newWeight || isNaN(this.newWeight) || this.newWeight <= 0) {
        uni.showToast({
          title: '请输入有效的数值',
          icon: 'none'
        });
        return;
      }
      
      const weight = parseFloat(this.newWeight);
      const date = this.selectedDate;
      
      const existingIndex = this.weightRecords.findIndex(record => record.date === date);
      if (existingIndex !== -1) {
        uni.showModal({
          title: '提示',
          content: '该日期已记录过体重，是否覆盖？',
          success: (res) => {
            if (res.confirm) {
              this.weightRecords[existingIndex].weight = weight;
              this.saveAndRefresh();
            }
          }
        });
      } else {
        this.weightRecords.push({ date: date, weight: weight });
        this.saveAndRefresh();
      }
      
      this.closeModal();
    },
    
    saveAndRefresh() {
      saveWeightRecord(this.weightRecords);
      
      if (this.weightRecords.length === 1 && !this.initialWeight) {
        setInitialWeight(this.weightRecords[0].weight);
      }
      
      this.loadData();
      uni.showToast({
        title: '记录成功',
        icon: 'success'
      });
    },
    
    drawChart() {
      const query = uni.createSelectorQuery();
      query.select('.weight-chart').boundingClientRect(data => {
        if (!data || data.width === 0) return;
        
        const ctx = uni.createCanvasContext('weightChart');
        const width = data.width;
        const height = data.height;
        
        const padding = { top: 20, right: 30, bottom: 30, left: 30 };
        const chartWidth = width - padding.left - padding.right;
        const chartHeight = height - padding.top - padding.bottom;
        
        ctx.clearRect(0, 0, width, height);
        ctx.setFillStyle('#ffffff');
        ctx.fillRect(0, 0, width, height);
        
        // 绘制浅灰色网格线
        ctx.setStrokeStyle('#e8e8e8');
        ctx.setLineWidth(1);
        
        const ySteps = 4;
        for (let i = 0; i <= ySteps; i++) {
          const y = padding.top + (chartHeight / ySteps) * i;
          ctx.beginPath();
          ctx.moveTo(padding.left, y);
          ctx.lineTo(width - padding.right, y);
          ctx.stroke();
        }
        
        // 绘制X轴和Y轴
        ctx.beginPath();
        ctx.setStrokeStyle('#d0d0d0');
        ctx.setLineWidth(1.5);
        ctx.moveTo(padding.left, padding.top);
        ctx.lineTo(padding.left, height - padding.bottom);
        ctx.lineTo(width - padding.right, height - padding.bottom);
        ctx.stroke();
        
        // 绘制数据折线（不带圆点）
        if (this.weightRecords.length >= 2) {
          const sortedByDate = [...this.weightRecords].sort((a, b) => new Date(a.date) - new Date(b.date));
          const weights = sortedByDate.map(r => r.weight);
          const maxWeight = Math.max(...weights);
          const minWeight = Math.min(...weights);
          const range = maxWeight - minWeight || 1;
          
          ctx.beginPath();
          ctx.setStrokeStyle('#ff9a56');
          ctx.setLineWidth(3);
          
          sortedByDate.forEach((record, index) => {
            const x = padding.left + (chartWidth / (sortedByDate.length - 1)) * index;
            const y = padding.top + chartHeight - ((record.weight - minWeight) / range) * chartHeight;
            
            const finalX = Math.min(Math.max(x, padding.left), width - padding.right);
            const finalY = Math.min(Math.max(y, padding.top), height - padding.bottom);
            
            if (index === 0) {
              ctx.moveTo(finalX, finalY);
            } else {
              ctx.lineTo(finalX, finalY);
            }
          });
          ctx.stroke();
        }
        
        ctx.draw();
      }).exec();
    },
    
    getToday() {
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  }
};
</script>

<style scoped>
.weight-page {
  min-height: 100vh;
  background: #f5f6fa;
  padding: 30rpx;
}

.top-card {
  background: #333;
  border-radius: 30rpx;
  padding: 40rpx;
  margin-bottom: 30rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 10rpx 30rpx rgba(102, 126, 234, 0.3);
}

.current-weight-section {
  flex: 1;
}

.current-weight-section .label {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.8);
  display: block;
  margin-bottom: 10rpx;
}

.weight-value {
  display: flex;
  align-items: baseline;
  gap: 10rpx;
  margin-bottom: 10rpx;
}

.weight-value .number {
  font-size: 64rpx;
  font-weight: bold;
  color: white;
}

.weight-value .unit {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.8);
}

.compare {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.9);
}

.record-btn {
  background: rgba(255, 255, 255, 0.2);
  padding: 20rpx 30rpx;
  border-radius: 60rpx;
  backdrop-filter: blur(10px);
}

.record-btn text {
  color: white;
  font-size: 28rpx;
}

.chart-card {
  background: white;
  border-radius: 30rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
}

.chart-header {
  margin-bottom: 30rpx;
}

.chart-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.chart-container {
  position: relative;
  width: 100%;
  overflow: hidden;
}

.weight-chart {
  width: 100%;
  height: 400rpx;
  background: white;
}

.chart-placeholder {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: white;
  pointer-events: none;
}

.placeholder-icon {
  font-size: 80rpx;
  margin-bottom: 20rpx;
}

.placeholder-text {
  font-size: 26rpx;
  color: #999;
}

/* 信息卡片 */
.info-card {
  background: white;
  border-radius: 30rpx;
  padding: 30rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
}

.info-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 30rpx;
  padding-bottom: 20rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 0;
}

.info-label {
  font-size: 28rpx;
  color: #999;
}

.info-value {
  font-size: 30rpx;
  color: #333;
  font-weight: 500;
}

.info-value.highlight {
  color: #333;
  font-size: 32rpx;
  font-weight: bold;
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
  z-index: 100;
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
  margin-bottom: 40rpx;
}

.form-item:last-child {
  margin-bottom: 0;
}

.form-label {
  font-size: 30rpx;
  color: #333;
  font-weight: 500;
  display: block;
  margin-bottom: 20rpx;
}

.date-picker {
  border: 2rpx solid #e0e0e0;
  border-radius: 16rpx;
  padding: 25rpx 20rpx;
  font-size: 30rpx;
  background: white;
  color: #333;
}

.weight-input-group {
  display: flex;
  align-items: center;
  border: 2rpx solid #e0e0e0;
  border-radius: 16rpx;
  background: white;
  padding-right: 20rpx;
}

.weight-input {
  flex: 1;
  padding: 25rpx 20rpx;
  font-size: 30rpx;
  border: none;
  background: transparent;
}

.weight-unit {
  font-size: 28rpx;
  color: #999;
}

.modal-footer {
  display: flex;
  border-top: 1rpx solid #f0f0f0;
}

.cancel-btn,
.confirm-btn {
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