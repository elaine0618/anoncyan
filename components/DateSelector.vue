<template>
  <scroll-view scroll-x class="date-scroll" :scroll-into-view="scrollToView" scroll-with-animation show-scrollbar="false">
    <view class="date-list">
      <view 
        v-for="(item, idx) in dateList" 
        :key="idx" 
        class="date-item" 
        :class="{ active: item.date === currentDate, completed: item.completed }"
        :id="`date-${idx}`"
        @click="selectDate(item.date)"
      >
        <text class="week">{{ item.week }}</text>
        <text class="day">{{ item.day }}</text>
      </view>
    </view>
  </scroll-view>
</template>

<script>
import { getWorkoutCompletionStatus } from '@/utils/storage.js';

export default {
  data() {
    return {
      dateList: [],
      currentDate: '',
      scrollToView: ''
    };
  },
  mounted() {
    this.initDateList();
    this.scrollToCurrentDate();
  },
  methods: {
    getToday() {
      const date = new Date();
      return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
    },
    getMondayOfCurrentWeek() {
      const today = new Date();
      const day = today.getDay();
      const diff = day === 0 ? 6 : day - 1;
      const monday = new Date(today);
      monday.setDate(today.getDate() - diff);
      return monday;
    },
    initDateList() {
      const list = [];
      const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
      const monday = this.getMondayOfCurrentWeek();
      
      for (let i = 0; i < 14; i++) {
        const date = new Date(monday);
        date.setDate(monday.getDate() + i);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const dateStr = `${year}-${month}-${day}`;
        
        list.push({
          date: dateStr,
          week: weekDays[date.getDay()],
          day: day,
          completed: getWorkoutCompletionStatus(dateStr)
        });
      }
      
      this.dateList = list;
      this.currentDate = this.getToday();
      this.$emit('dateChange', this.currentDate);
    },
    selectDate(date) {
      this.currentDate = date;
      this.$emit('dateChange', date);
    },
    scrollToCurrentDate() {
      const index = this.dateList.findIndex(item => item.date === this.currentDate);
      if (index !== -1) {
        this.scrollToView = `date-${index}`;
      }
    },
    refreshCompletionStatus() {
      // 刷新所有日期的打卡状态
      this.dateList.forEach(item => {
        item.completed = getWorkoutCompletionStatus(item.date);
      });
    }
  }
};
</script>

<style scoped>
.date-scroll {
  white-space: nowrap;
  background: white;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #eee;
  width: 100%;
}

.date-list {
  display: inline-flex;
  padding: 0 20rpx;
}

.date-item {
  width: 100rpx;
  text-align: center;
  margin: 0 5rpx;
  padding: 15rpx 0;
  border-radius: 60rpx;
  position: relative;
  transition: all 0.3s;
}

.date-item.active {
  background: #333;
  color: white;
  box-shadow: 0 4rpx 12rpx rgba(255, 107, 107, 0.3);
}

/* 打卡成功的日期显示绿色背景 */
.date-item.completed {
  background: #4caf50;
  color: white;
}

.date-item.completed.active {
  background: #358f50;
}

.week {
  font-size: 24rpx;
  display: block;
  margin-bottom: 8rpx;
}

.day {
  font-size: 36rpx;
  font-weight: bold;
  display: block;
}

.check {
  position: absolute;
  top: 5rpx;
  right: 10rpx;
  color: white;
  font-size: 28rpx;
  font-weight: bold;
}
</style>