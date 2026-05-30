<template>
  <view class="recipe-page">
    <!-- 早餐 -->
    <view class="meal-card" v-for="meal in meals" :key="meal.name">
      <view class="meal-header">
        <text class="meal-name">{{ meal.name }}</text>
        <!-- 已录入状态显示编辑按钮 -->
        <text class="edit-btn" v-if="meal.isRecorded" @click="startEdit(meal)">编辑</text>
        <!-- 不吃状态也显示编辑按钮 -->
        <text class="edit-btn" v-else-if="meal.isNotEat" @click="startEditFromNotEat(meal)">编辑</text>
      </view>

      <!-- 已录入状态：显示已录入的食物信息 -->
      <view class="recorded-state" v-if="meal.isRecorded">
        <view class="food-list">
          <view class="food-item-display" v-for="(item, idx) in meal.items" :key="idx">
            <text class="food-name">{{ item.name }}</text>
            <text class="food-quantity">{{ item.quantity }} {{ item.unit }}</text>
          </view>
        </view>
      </view>

      <!-- 不吃状态：显示不吃文本 -->
      <view class="not-eat-state" v-else-if="meal.isNotEat">
        <text class="not-eat-text">今日不吃</text>
      </view>

      <!-- 编辑状态：显示表单 -->
      <view class="edit-state" v-else>
        <!-- 食物列表输入框 -->
        <view class="food-input-list">
          <view class="food-input-row" v-for="(food, idx) in meal.editingFoods" :key="idx">
            <input 
              class="food-name-input" 
              v-model="food.name" 
              placeholder="食物名称" 
              placeholder-style="color:#ccc"
            />
            <input 
              class="food-quantity-input" 
              type="digit" 
              v-model="food.quantity" 
              placeholder="份量" 
              placeholder-style="color:#ccc"
            />
            <picker :range="units" @change="(e) => food.unit = units[e.detail.value]" :value="units.indexOf(food.unit)">
              <view class="unit-picker">{{ food.unit }}</view>
            </picker>
            <!-- 删除项按钮 -->
            <text class="delete-food-btn" @click="removeFoodItem(meal, idx)">🗑️</text>
          </view>
        </view>

        <!-- 按钮组 -->
        <view class="button-group">
          <button class="btn-add" @click="addFoodItem(meal)" size="mini">增加一项</button>
          <button class="btn-not-eat" @click="setNotEat(meal)" size="mini">不吃</button>
          <button class="btn-confirm" @click="confirmMeal(meal)" size="mini" type="primary">确认录入</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { getRecipe, saveRecipe } from '@/utils/storage.js';

export default {
  data() {
    return {
      units: ['份', 'g', '个'],
      meals: [
        { 
          name: '早餐', 
          items: [],
          isNotEat: false,
          isRecorded: false,
          editingFoods: [{ name: '', quantity: '', unit: '份' }]
        },
        { 
          name: '午餐', 
          items: [],
          isNotEat: false,
          isRecorded: false,
          editingFoods: [{ name: '', quantity: '', unit: '份' }]
        },
        { 
          name: '晚餐', 
          items: [],
          isNotEat: false,
          isRecorded: false,
          editingFoods: [{ name: '', quantity: '', unit: '份' }]
        }
      ],
      currentDate: ''
    };
  },
  onLoad(options) {
    this.currentDate = options.date || this.getToday();
    this.loadRecipe();
  },
  methods: {
    getToday() {
      const date = new Date();
      return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
    },
    
    loadRecipe() {
      const savedData = getRecipe(this.currentDate);
      if (savedData && savedData.meals) {
        this.meals = savedData.meals;
      }
    },
    
    startEdit(meal) {
      // 从已录入状态进入编辑
      meal.editingFoods = JSON.parse(JSON.stringify(meal.items));
      if (meal.editingFoods.length === 0) {
        meal.editingFoods = [{ name: '', quantity: '', unit: '份' }];
      }
      meal.isRecorded = false;
      meal.isNotEat = false;
    },
    
    startEditFromNotEat(meal) {
      // 从不吃状态进入编辑
      meal.editingFoods = [{ name: '', quantity: '', unit: '份' }];
      meal.isNotEat = false;
      meal.isRecorded = false;
    },
    
    addFoodItem(meal) {
      meal.editingFoods.push({ name: '', quantity: '', unit: '份' });
    },
    
    removeFoodItem(meal, index) {
      if (meal.editingFoods.length === 1) {
        // 如果只有一项，清空内容而不是删除
        meal.editingFoods[0] = { name: '', quantity: '', unit: '份' };
      } else {
        meal.editingFoods.splice(index, 1);
      }
    },
    
    setNotEat(meal) {
      meal.isNotEat = true;
      meal.isRecorded = false;
      meal.items = [];
      meal.editingFoods = [{ name: '', quantity: '', unit: '份' }];
      this.saveAllMeals();
      
      uni.showToast({
        title: `${meal.name}已设为不吃`,
        icon: 'none',
        duration: 1500
      });
    },
    
    confirmMeal(meal) {
      // 过滤掉名称为空的行
      const validFoods = meal.editingFoods.filter(food => food.name.trim() !== '');
      
      if (validFoods.length === 0) {
        uni.showToast({
          title: '请至少录入一项食物',
          icon: 'none'
        });
        return;
      }
      
      // 保存录入的信息
      meal.items = validFoods;
      meal.isNotEat = false;
      meal.isRecorded = true;
      
      this.saveAllMeals();
      
      uni.showToast({
        title: `${meal.name}已保存`,
        icon: 'success',
        duration: 1500
      });
    },
    
    saveAllMeals() {
      const dataToSave = {
        meals: this.meals,
        date: this.currentDate
      };
      saveRecipe(this.currentDate, dataToSave);
    }
  }
};
</script>

<style scoped>
.recipe-page {
  padding: 30rpx;
  background: #f5f6fa;
  min-height: 100vh;
}

/* 餐次卡片 */
.meal-card {
  background: white;
  border-radius: 30rpx;
  margin-bottom: 40rpx;
  overflow: hidden;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.08);
}

.meal-header {
  background: #333;
  padding: 30rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.meal-name {
  font-size: 40rpx;
  font-weight: bold;
  color: white;
}

.edit-btn {
  font-size: 28rpx;
  color: white;
  background: rgba(255, 255, 255, 0.3);
  padding: 10rpx 30rpx;
  border-radius: 30rpx;
}

/* 已录入状态样式 */
.recorded-state {
  padding: 30rpx;
}

.food-list {
  margin-bottom: 0;
}

.food-item-display {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.food-item-display:last-child {
  border-bottom: none;
}

.food-name {
  font-size: 30rpx;
  color: #333;
  font-weight: 500;
}

.food-quantity {
  font-size: 28rpx;
  color: #333;
  background: #f0f0f0;
  padding: 8rpx 30rpx;
  border-radius: 30rpx;
}

/* 不吃状态样式 */
.not-eat-state {
  padding: 60rpx 30rpx;
  text-align: center;
}

.not-eat-text {
  font-size: 32rpx;
  color: #999;
  font-style: italic;
}

/* 编辑状态样式 */
.edit-state {
  padding: 30rpx;
}

.food-input-list {
  margin-bottom: 30rpx;
}

.food-input-row {
  display: flex;
  align-items: center;
  gap: 15rpx;
  margin-bottom: 20rpx;
  padding: 15rpx;
  border-radius: 16rpx;
}

.food-name-input {
  flex: 2;
  border: 1rpx solid #f0f0f0;
  border-radius: 12rpx;
  padding: 15rpx 20rpx;
  font-size: 28rpx;
  background: white;
  margin: 10rpx;
}

.food-quantity-input {
  flex: 1;
  border: 1rpx solid #f0f0f0;
  border-radius: 12rpx;
  padding: 15rpx 20rpx;
  font-size: 28rpx;
  background: white;
  margin: 10rpx;
}

.unit-picker {
  background: #f0f0f0;
  padding: 15rpx 25rpx;
  border-radius: 12rpx;
  font-size: 26rpx;
  color: #666;
  text-align: center;
  min-width: 80rpx;
    margin: 10rpx;
}

.delete-food-btn {
  font-size: 36rpx;
  padding: 10rpx;
    margin: 10rpx;
}

/* 按钮组 */
.button-group {
  display: flex;
  gap: 15rpx;
  flex-wrap: wrap;
  
}

.btn-add {
  flex: 1;
  background: #f0f0f0;
  color: #333;
  font-size: 26rpx;
  height: 70rpx;
  line-height: 70rpx;
    margin: 10rpx;
}

.btn-not-eat {
  flex: 1;
  background: #f0f0f0;
  color: #333;
  font-size: 26rpx;
  height: 70rpx;
  line-height: 70rpx;
    margin: 10rpx;
}

.btn-confirm {
  flex: 1;
  background: #333;
  color: white;
  border: none;
  font-size: 26rpx;
  height: 70rpx;
  line-height: 70rpx;
    margin: 10rpx;
}

/* 按钮点击效果 */
button {
  transition: all 0.2s;
}

button:active {
  transform: scale(0.96);
  opacity: 0.8;
}
</style>