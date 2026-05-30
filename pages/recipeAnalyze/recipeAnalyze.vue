<template>
  <view class="analyze-container">
    <!-- 经期预测卡片 -->
    <view class="period-card">

      <!-- 日历 -->
      <view class="calendar">
        <view class="calendar-header">
          <text class="month-prev" @click="prevMonth">◀</text>
          <text class="current-month">{{ currentYear }}年 {{ currentMonth }}月</text>
          <text class="month-next" @click="nextMonth">▶</text>
        </view>
        
        <view class="weekdays">
          <text class="weekday">日</text>
          <text class="weekday">一</text>
          <text class="weekday">二</text>
          <text class="weekday">三</text>
          <text class="weekday">四</text>
          <text class="weekday">五</text>
          <text class="weekday">六</text>
        </view>
        
        <view class="calendar-days">
          <view 
            v-for="(day, idx) in calendarDays" 
            :key="idx"
            class="calendar-day"
            :class="{
              'other-month': !day.isCurrentMonth,
              'period-record': day.isPeriodRecord,
              'period-predict': day.isPeriodPredict,
              'period-start-highlight': day.isStartHighlight,
              'selected': day.isSelected
            }"
            @click="selectDate(day)"
          >
            <text class="day-num">{{ day.day }}</text>
          </view>
        </view>
      </view>

      <view class="period-buttons">
        <button 
          class="period-btn" 
          :class="{ 'start-btn': !pendingStartDate, 'end-btn': pendingStartDate }"
          @click="handlePeriodRecord"
        >
          {{ pendingStartDate ? '标记结束' : '标记开始' }}
        </button>
      </view>

      <view class="predict-info" v-if="nextPeriodStart">
        <text class="predict-text">预测下次经期：{{ nextPeriodStart }} ~ {{ nextPeriodEnd }}</text>
      </view>
      
      <view class="cycle-config" v-if="periodRecords.length > 0">
        <text class="cycle-label">平均周期：{{ avgCycleDays }} 天</text>
        <text class="cycle-label">平均经期：{{ avgPeriodDays }} 天</text>
      </view>
    </view>

    <!-- 饮食统计卡片 -->
    <view class="stat-card" v-if="!noData">
      <view class="card-title">
        <text class="card-title-text">饮食统计</text>
      </view>
      <!-- 单位"个"最多的食物 -->
      <view class="stat-section" v-if="topGeItems.length > 0">
        <view class="stat-list">
          <view class="stat-item" v-for="(item, idx) in topGeItems" :key="idx">
            <text class="stat-name">{{ item.name }}</text>
            <text class="stat-value">{{ item.totalQuantity }} 个</text>
          </view>
        </view>
        <view class="divider"></view>
      </view>

      <!-- 单位"份"最多的食物 -->
      <view class="stat-section" v-if="topFenItems.length > 0">
        <view class="stat-list">
          <view class="stat-item" v-for="(item, idx) in topFenItems" :key="idx">
            <text class="stat-name">{{ item.name }}</text>
            <text class="stat-value">{{ item.totalQuantity }} 份</text>
          </view>
        </view>
        <view class="divider"></view>
      </view>

      <!-- 单位"g"最多的食物 -->
      <view class="stat-section" v-if="topGItems.length > 0">
        <view class="stat-list">
          <view class="stat-item" v-for="(item, idx) in topGItems" :key="idx">
            <text class="stat-name">{{ item.name }}</text>
            <text class="stat-value">{{ item.totalQuantity }} g</text>
          </view>
        </view>
        <view class="divider"></view>
      </view>

      <!-- 不吃次数 -->
      <view class="stat-section">
        <view class="stat-list">
          <view class="stat-item">
            <text class="stat-name">不吃饭次数</text>
            <text class="stat-value">{{ notEatCount }} 次</text>
          </view>
        </view>
      </view>
    </view>

    <view class="empty-state" v-if="noData">
      <text class="empty-text">暂无饮食统计数据</text>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      periodRecords: [],
      pendingStartDate: null,
      selectedDate: null,
      currentYear: 2024,
      currentMonth: 1,
      calendarDays: [],
      nextPeriodStart: null,
      nextPeriodEnd: null,
      avgCycleDays: 28,
      avgPeriodDays: 5,
      topGeItems: [],
      topFenItems: [],
      topGItems: [],
      notEatCount: 0,
      noData: false,
      calendarCache: {}
    };
  },
  onShow() {
    this.loadPeriodData();
    this.initCalendar();
    this.loadAnalyzeData();
  },
  methods: {
    loadPeriodData() {
      const stored = uni.getStorageSync('period_records');
      if (stored && stored.length) {
        this.periodRecords = stored;
      }
      
      const unfinished = this.periodRecords.find(r => r.start && !r.end);
      this.pendingStartDate = unfinished ? unfinished.start : null;
      
      this.calculateAvgCycle();
      this.predictNextPeriod();
      this.updateCalendarHighlights();
    },
    
    savePeriodData() {
      uni.setStorageSync('period_records', this.periodRecords);
      const unfinished = this.periodRecords.find(r => r.start && !r.end);
      this.pendingStartDate = unfinished ? unfinished.start : null;
      this.calculateAvgCycle();
      this.predictNextPeriod();
      this.updateCalendarHighlights();
    },
    
    calculateAvgCycle() {
      const completed = this.periodRecords.filter(r => r.start && r.end);
      if (completed.length < 2) return;
      
      let totalCycle = 0;
      let totalPeriod = 0;
      
      for (let i = 1; i < completed.length; i++) {
        const prevStart = new Date(completed[i-1].start);
        const currStart = new Date(completed[i].start);
        const cycleDiff = Math.ceil((currStart - prevStart) / (1000 * 60 * 60 * 24));
        totalCycle += cycleDiff;
        
        const prevEnd = new Date(completed[i-1].end);
        const periodDiff = Math.ceil((prevEnd - prevStart) / (1000 * 60 * 60 * 24)) + 1;
        totalPeriod += periodDiff;
      }
      
      this.avgCycleDays = Math.round(totalCycle / (completed.length - 1));
      this.avgPeriodDays = Math.round(totalPeriod / (completed.length - 1));
    },
    
    predictNextPeriod() {
      const completed = this.periodRecords.filter(r => r.start && r.end);
      if (completed.length === 0) {
        this.nextPeriodStart = null;
        this.nextPeriodEnd = null;
        return;
      }
      
      const sorted = [...completed].sort((a, b) => new Date(b.start) - new Date(a.start));
      const lastRecord = sorted[0];
      const lastStart = new Date(lastRecord.start);
      
      const nextStart = new Date(lastStart);
      nextStart.setDate(lastStart.getDate() + this.avgCycleDays);
      
      const nextEnd = new Date(nextStart);
      nextEnd.setDate(nextStart.getDate() + this.avgPeriodDays - 1);
      
      this.nextPeriodStart = this.formatDate(nextStart);
      this.nextPeriodEnd = this.formatDate(nextEnd);
    },
    
    initCalendar() {
      if (this.selectedDate) {
        const [year, month] = this.selectedDate.split('-');
        this.currentYear = parseInt(year);
        this.currentMonth = parseInt(month);
      } else {
        const now = new Date();
        this.currentYear = now.getFullYear();
        this.currentMonth = now.getMonth() + 1;
      }
      this.buildCalendar();
    },
    
    buildCalendar() {
      const cacheKey = `${this.currentYear}-${this.currentMonth}`;
      
      if (this.calendarCache[cacheKey]) {
        this.calendarDays = JSON.parse(JSON.stringify(this.calendarCache[cacheKey]));
        this.updateCalendarHighlights();
        return;
      }
      
      const firstDayOfMonth = new Date(this.currentYear, this.currentMonth - 1, 1);
      const startWeekday = firstDayOfMonth.getDay();
      const daysInMonth = new Date(this.currentYear, this.currentMonth, 0).getDate();
      const prevMonthDate = new Date(this.currentYear, this.currentMonth - 1, 0);
      const daysInPrevMonth = prevMonthDate.getDate();
      
      const calendar = [];
      
      for (let i = startWeekday - 1; i >= 0; i--) {
        const day = daysInPrevMonth - i;
        const dateStr = this.getDateStr(this.currentYear, this.currentMonth - 1, day);
        calendar.push({
          day: day,
          isCurrentMonth: false,
          date: dateStr,
          isPeriodRecord: false,
          isPeriodPredict: false,
          isStartHighlight: false,
          isSelected: false
        });
      }
      
      for (let i = 1; i <= daysInMonth; i++) {
        const dateStr = this.getDateStr(this.currentYear, this.currentMonth, i);
        calendar.push({
          day: i,
          isCurrentMonth: true,
          date: dateStr,
          isPeriodRecord: false,
          isPeriodPredict: false,
          isStartHighlight: false,
          isSelected: false
        });
      }
      
      const remainingDays = 42 - calendar.length;
      for (let i = 1; i <= remainingDays; i++) {
        const dateStr = this.getDateStr(this.currentYear, this.currentMonth + 1, i);
        calendar.push({
          day: i,
          isCurrentMonth: false,
          date: dateStr,
          isPeriodRecord: false,
          isPeriodPredict: false,
          isStartHighlight: false,
          isSelected: false
        });
      }
      
      this.calendarCache[cacheKey] = JSON.parse(JSON.stringify(calendar));
      this.calendarDays = calendar;
      this.updateCalendarHighlights();
    },
    
    updateCalendarHighlights() {
      this.calendarDays.forEach(day => {
        day.isPeriodRecord = this.isDateInCompletedPeriod(day.date);
        day.isPeriodPredict = this.isDateInPredict(day.date);
        day.isStartHighlight = this.isStartDate(day.date);
      });
    },
    
    getDateStr(year, month, day) {
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    },
    
    isDateInCompletedPeriod(dateStr) {
      return this.periodRecords.some(record => {
        return record.start && record.end && dateStr >= record.start && dateStr <= record.end;
      });
    },
    
    isDateInPredict(dateStr) {
      if (!this.nextPeriodStart) return false;
      return dateStr >= this.nextPeriodStart && dateStr <= this.nextPeriodEnd;
    },
    
    isStartDate(dateStr) {
      return this.pendingStartDate === dateStr;
    },
    
    selectDate(day) {
      this.calendarDays.forEach(d => {
        d.isSelected = false;
      });
      this.selectedDate = day.date;
      day.isSelected = true;
    },
    
    prevMonth() {
      if (this.currentMonth === 1) {
        this.currentMonth = 12;
        this.currentYear--;
      } else {
        this.currentMonth--;
      }
      this.buildCalendar();
    },
    
    nextMonth() {
      if (this.currentMonth === 12) {
        this.currentMonth = 1;
        this.currentYear++;
      } else {
        this.currentMonth++;
      }
      this.buildCalendar();
    },
    
    handlePeriodRecord() {
      if (!this.selectedDate) {
        uni.showToast({ title: '请先选择一个日期', icon: 'none' });
        return;
      }
      
      if (!this.pendingStartDate) {
        this.startPeriod(this.selectedDate);
      } else {
        this.endPeriod(this.selectedDate);
      }
    },
    
    startPeriod(startDate) {
      if (this.pendingStartDate) {
        uni.showToast({ title: '请标记结束日期', icon: 'none' });
        return;
      }
      
      const hasOverlap = this.periodRecords.some(record => {
        return record.start && record.end && startDate >= record.start && startDate <= record.end;
      });
      
      if (hasOverlap) {
        uni.showToast({ title: '已存在记录', icon: 'none' });
        return;
      }
      
      this.periodRecords.push({
        start: startDate,
        end: null
      });
      this.savePeriodData();
      this.selectedDate = null;
      uni.showToast({ title: '已标记开始', icon: 'success' });
    },
    
    endPeriod(endDate) {
      if (!this.pendingStartDate) {
        uni.showToast({ title: '没有进行中的经期', icon: 'none' });
        return;
      }
      
      if (endDate < this.pendingStartDate) {
        uni.showToast({ title: '结束日期不能早于开始日期', icon: 'none' });
        return;
      }
      
      const record = this.periodRecords.find(r => r.start === this.pendingStartDate);
      if (record) {
        record.end = endDate;
        this.savePeriodData();
        this.selectedDate = null;
        uni.showToast({ title: '已标记结束', icon: 'success' });
      }
    },
    
    formatDate(date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    },
    
    loadAnalyzeData() {
      const allKeys = uni.getStorageInfoSync().keys;
      const recipeKeys = allKeys.filter(key => key.startsWith('recipe_'));
      
      const geMap = new Map();
      const fenMap = new Map();
      const gMap = new Map();
      let notEatTotal = 0;
      let hasData = false;
      
      recipeKeys.forEach(key => {
        const recipeData = uni.getStorageSync(key);
        if (recipeData && recipeData.meals) {
          recipeData.meals.forEach(meal => {
            if (meal.isNotEat) {
              notEatTotal++;
              hasData = true;
            }
            if (meal.items && meal.items.length) {
              meal.items.forEach(item => {
                hasData = true;
                const quantity = parseFloat(item.quantity) || 0;
                switch (item.unit) {
                  case '个':
                    geMap.set(item.name, (geMap.get(item.name) || 0) + quantity);
                    break;
                  case '份':
                    fenMap.set(item.name, (fenMap.get(item.name) || 0) + quantity);
                    break;
                  case 'g':
                    gMap.set(item.name, (gMap.get(item.name) || 0) + quantity);
                    break;
                }
              });
            }
          });
        }
      });
      
      this.topGeItems = this.getTopItems(geMap, 3);
      this.topFenItems = this.getTopItems(fenMap, 3);
      this.topGItems = this.getTopItems(gMap, 3);
      this.notEatCount = notEatTotal;
      this.noData = !hasData;
    },
    
    getTopItems(map, limit) {
      if (map.size === 0) return [];
      
      const items = [];
      for (let [name, value] of map) {
        items.push({ name, totalQuantity: value });
      }
      items.sort((a, b) => b.totalQuantity - a.totalQuantity);
      
      const result = [];
      let rank = 1;
      let lastValue = null;
      
      for (let i = 0; i < items.length && rank <= limit; i++) {
        const item = items[i];
        if (i === 0) {
          result.push(item);
          lastValue = item.totalQuantity;
        } else if (item.totalQuantity === lastValue) {
          result.push(item);
        } else {
          rank++;
          if (rank <= limit) {
            result.push(item);
            lastValue = item.totalQuantity;
          } else {
            break;
          }
        }
      }
      
      return result;
    }
  }
};
</script>

<style scoped>
.analyze-container {
  min-height: 100vh;
  background: #f5f6fa;
  padding: 30rpx;
}

/* 经期卡片 */
.period-card {
  background: white;
  border-radius: 24rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);
}

.card-title {
  text-align: center;
  margin-bottom: 30rpx;
}

.card-title-text {
  font-size: 40rpx;
  font-weight: bold;
  color: #333;
}

/* 日历样式 */
.calendar {
  background: white;
  border-radius: 16rpx;
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 0;
  margin-bottom: 20rpx;
}

.month-prev, .month-next {
  font-size: 32rpx;
  color: #333;
  padding: 10rpx 20rpx;
}

.current-month {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.weekdays {
  display: flex;
  margin-bottom: 10rpx;
}

.weekday {
  flex: 1;
  text-align: center;
  font-size: 26rpx;
  color: #999;
  padding: 10rpx 0;
}

.calendar-days {
  display: flex;
  flex-wrap: wrap;
}

.calendar-day {
  width: 14.28%;
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.day-num {
  font-size: 28rpx;
  color: #333;
  width: 60rpx;
  height: 60rpx;
  line-height: 60rpx;
  text-align: center;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.other-month .day-num {
  color: #ccc;
}

/* 已完成的经期记录 - 红色背景 */
.period-record .day-num {
  background-color: #ff6b6b;
  color: white;
}

/* 预测经期 - 灰色背景 */
.period-predict .day-num {
  background-color: #e0e0e0;
  color: #666;
}

/* 未结束的开始日期 - 橙色边框 */
.period-start-highlight .day-num {
  border: 2rpx solid #ff9a56;
  background-color: transparent;
  color: #ff9a56;
  font-weight: bold;
  line-height: 56rpx;
}

/* 选中日期 - 浅橙色背景 */
.selected .day-num {
  background-color: rgba(255, 154, 86, 0.2);
  color: #ff9a56;
  font-weight: bold;
}

/* 操作按钮 */
.period-buttons {
  margin-top: 30rpx;
  text-align: center;
}

.period-btn {
  width: 80%;
  border-radius: 60rpx;
  height: 80rpx;
  line-height: 80rpx;
  font-size: 32rpx;
  font-weight: bold;
  border: none;
  margin-bottom: 15rpx;
}

.start-btn {
  background: #333;
  color: white;
}

.end-btn {
  background: #4caf50;
  color: white;
}

.period-tip {
  font-size: 24rpx;
  color: #999;
}

.predict-info {
  margin-top: 20rpx;
  padding-top: 20rpx;
  border-top: 1rpx solid #f0f0f0;
  text-align: center;
}

.predict-text {
  font-size: 26rpx;
  color: #333;
}

.cycle-config {
  margin-top: 15rpx;
  display: flex;
  justify-content: center;
  gap: 30rpx;
}

.cycle-label {
  font-size: 24rpx;
  color: #999;
}

/* 饮食统计卡片 */
.stat-card {
  background: white;
  border-radius: 24rpx;
  padding: 30rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);
}

.stat-section {
  margin-bottom: 0;
}

.stat-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  padding: 10rpx 0;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-name {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.stat-value {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.divider {
  height: 1rpx;
  background: #f0f0f0;
  margin: 15rpx 20rpx;
}

.empty-state {
  text-align: center;
  padding: 100rpx 0;
}

.empty-text {
  font-size: 28rpx;
  color: #ccc;
}
</style>