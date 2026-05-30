<template>
  <view class="plan-edit">
    <!-- 计划标题 -->
    <view class="title-section">
      <input class="plan-title-input" v-model="plan.title" placeholder="训练计划标题" :disabled="readonly" />
    </view>

    <!-- 热身训练 -->
    <view class="section">
      <view class="section-header">
        <text class="section-title">热身训练</text>
        <text class="add-action" @click="addAction('warmup')" v-if="!readonly">+ 新增动作</text>
      </view>
      <view class="action-list">
        <ActionCard 
          v-for="(action, idx) in plan.warmup" 
          :key="idx"
          :action="action"
          :readonly="readonly"
          @edit="editAction('warmup', idx)"
          @delete="deleteAction('warmup', idx)"
        />
      </view>
    </view>

    <!-- 正式训练 -->
    <view class="section">
      <view class="section-header">
        <text class="section-title">正式训练</text>
        <text class="add-action" @click="addAction('main')" v-if="!readonly">+ 新增动作</text>
      </view>
      <view class="action-list">
        <ActionCard 
          v-for="(action, idx) in plan.main" 
          :key="idx"
          :action="action"
          :readonly="readonly"
          @edit="editAction('main', idx)"
          @delete="deleteAction('main', idx)"
        />
      </view>
    </view>

    <!-- 冷身训练 -->
    <view class="section">
      <view class="section-header">
        <text class="section-title">冷身训练</text>
        <text class="add-action" @click="addAction('cooldown')" v-if="!readonly">+ 新增动作</text>
      </view>
      <view class="action-list">
        <ActionCard 
          v-for="(action, idx) in plan.cooldown" 
          :key="idx"
          :action="action"
          :readonly="readonly"
          @edit="editAction('cooldown', idx)"
          @delete="deleteAction('cooldown', idx)"
        />
      </view>
    </view>

    <!-- 保存按钮 -->
    <view class="save-btn-wrapper" v-if="!readonly">
      <button class="save-btn" @click="savePlan">保存计划</button>
    </view>

    <!-- 动作编辑弹窗 -->
    <view class="modal-mask" v-if="showModal" @click="closeModal">
      <view class="modal-container" @click.stop>
        <view class="modal-header">
          <text class="modal-title">编辑动作</text>
          <text class="modal-close" @click="closeModal">✕</text>
        </view>
        <view class="modal-body">
          <!-- 图片选择 -->
          <view class="form-item">
            <view class="image-picker" @click="chooseImage">
              <image v-if="currentAction.image" :src="currentAction.image" mode="aspectFill" class="action-preview"></image>
              <view v-else class="image-placeholder">
                <text>选择本地图片</text>
              </view>
            </view>
          </view>
          
          <!-- 动作名称 -->
          <view class="form-item">
            <text class="form-label">动作名称</text>
            <input class="form-input" v-model="currentAction.name" placeholder="动作名称（必填）" />
          </view>
          
          <!-- 组数 -->
          <view class="form-item">
            <text class="form-label">组数</text>
            <input class="form-input" type="number" v-model="currentAction.sets" placeholder="组数（必填）" />
          </view>
          
          <!-- 时长 -->
          <view class="form-item">
            <text class="form-label">时长(秒)</text>
            <input class="form-input" type="number" v-model="currentAction.duration" placeholder="秒数（必填）" />
          </view>
          <view class="form-item">
            <text class="form-label">次数</text>
            <input class="form-input" type="number" v-model="currentAction.times" placeholder="次数（仅作显示）" />
          </view>
          <!-- 动作描述 -->
          <view class="form-item">
            <text class="form-label">动作描述</text>
            <textarea class="form-textarea" v-model="currentAction.description" placeholder="动作描述" />
          </view>
        </view>
        <view class="modal-footer">
          <button class="cancel-btn" @click="closeModal">取消</button>
          <button class="confirm-btn" @click="confirmEdit">确认</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { getPlanList, savePlanList } from '@/utils/storage.js';
import ActionCard from '@/components/ActionCard.vue';

export default {
  components: { ActionCard },
  data() {
    return {
      plan: {
        id: null,
        title: '',
        createDate: '',
        warmup: [],
        main: [],
        cooldown: []
      },
      readonly: false,
      isNew: false,
      showModal: false,
      currentSection: '',
      currentIndex: -1,
      currentAction: {
        name: '',
        sets: 0,
        duration: 0,
		times: 0,
        image: '',
        description: ''
      }
    };
  },
  onLoad(options) {
    if (options.plan) {
      const planData = JSON.parse(decodeURIComponent(options.plan));
      this.plan = planData;
      this.isNew = options.isNew === 'true';
      this.readonly = options.readonly === 'true';
    }
  },
  methods: {
    addAction(section) {
      this.currentSection = section;
      this.currentIndex = -1;
      this.currentAction = {
        name: '',
        sets: 3,
        duration: 30,
		times: 0,
        image: '',
        description: ''
      };
      this.showModal = true;
    },
    editAction(section, index) {
      this.currentSection = section;
      this.currentIndex = index;
      this.currentAction = JSON.parse(JSON.stringify(this.plan[section][index]));
      this.showModal = true;
    },
    deleteAction(section, index) {
      uni.showModal({
        title: '确认删除',
        content: '确定要删除这个动作吗？',
        success: (res) => {
          if (res.confirm) {
            this.plan[section].splice(index, 1);
          }
        }
      });
    },
    chooseImage() {
      uni.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
        success: (res) => {
          this.currentAction.image = res.tempFilePaths[0];
        }
      });
    },
    confirmEdit() {
      if (!this.currentAction.name) {
        uni.showToast({ title: '请输入动作名称', icon: 'none' });
        return;
      }
      if (!this.currentAction.sets || this.currentAction.sets <= 0) {
        uni.showToast({ title: '请输入有效的组数', icon: 'none' });
        return;
      }
      if (!this.currentAction.duration || this.currentAction.duration <= 0) {
        uni.showToast({ title: '请输入有效的时长', icon: 'none' });
        return;
      }
      
        const actionData = {
          id: Date.now() + Math.random(),
          name: this.currentAction.name,
          sets: parseInt(this.currentAction.sets),
          duration: parseInt(this.currentAction.duration),
          times: (this.currentAction.times && parseInt(this.currentAction.times) > 0) ? parseInt(this.currentAction.times) : 0,
          image: this.currentAction.image,
          description: this.currentAction.description
        };
        
        if (this.currentIndex === -1) {
          this.plan[this.currentSection].push(actionData);
        } else {
          this.plan[this.currentSection][this.currentIndex] = actionData;
        }
        
        this.closeModal();
    },
    closeModal() {
      this.showModal = false;
      this.currentAction = {
        name: '',
        sets: 0,
        duration: 0,
        image: '',
        description: ''
      };
    },
    savePlan() {
      if (!this.plan.title) {
        uni.showToast({ title: '请输入计划标题', icon: 'none' });
        return;
      }
      
      const planList = getPlanList();
      
      if (this.isNew || !this.plan.id) {
        this.plan.id = Date.now();
        this.plan.createDate = this.getToday();
        planList.push(this.plan);
      } else {
        const index = planList.findIndex(p => p.id === this.plan.id);
        if (index !== -1) {
          planList[index] = this.plan;
        }
      }
      
      savePlanList(planList);
      uni.showToast({ title: '保存成功', icon: 'success' });
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
.plan-edit {
  min-height: 100vh;
  background: #f5f6fa;
  padding: 30rpx;
  padding-bottom: 120rpx;
}

.title-section {
  background: white;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
}

.plan-title-input {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
  padding: 10rpx;
  border-bottom: 2rpx solid #eee;
}

.section {
  background: white;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
  padding-bottom: 15rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.add-action {
  font-size: 26rpx;
  color: white;
  padding: 10rpx 20rpx;
  background: #333;
  border-radius: 30rpx;
}

.action-list {
  display: flex;
  flex-direction: column;
  gap: 15rpx;
}

.save-btn-wrapper {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 20rpx 30rpx;
  background: white;
  box-shadow: 0 -4rpx 20rpx rgba(0,0,0,0.05);
}

.save-btn {
  background: #333;
  color: white;
  border-radius: 60rpx;
  border: none;
  font-size: 32rpx;
  height: 90rpx;
  line-height: 90rpx;
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
  z-index: 1000;
}

.modal-container {
  width: 650rpx;
  max-height: 80vh;
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
  padding: 30rpx;
  max-height: 60vh;
  overflow-y: auto;
}

.form-item {
  margin-bottom: 30rpx;
}

.form-label {
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
  display: block;
  margin-bottom: 15rpx;
}

.form-input {
  border: 2rpx solid #e0e0e0;
  border-radius: 16rpx;
  padding: 20rpx;
  font-size: 28rpx;
}

.form-textarea {
  border: 2rpx solid #e0e0e0;
  border-radius: 16rpx;
  padding: 20rpx;
  font-size: 28rpx;
  height: 150rpx;
}

.image-picker {
  border: 2rpx dashed #e0e0e0;
  border-radius: 16rpx;
  padding: 20rpx;
  text-align: center;
}

.action-preview {
  width: 200rpx;
  height: 200rpx;
  margin: 0 auto;
  border-radius: 16rpx;
}

.image-placeholder {
  padding: 40rpx;
  text-align: center;
}

.image-placeholder text {
  font-size: 28rpx;
  display: block;
}

.modal-footer {
  display: flex;
  border-top: 1rpx solid #f0f0f0;
}

.cancel-btn, .confirm-btn {
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
</style>