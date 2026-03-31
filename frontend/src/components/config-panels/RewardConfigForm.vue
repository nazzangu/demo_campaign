<template>
  <div class="reward-config">
    <div class="form-group">
      <label class="form-label">리워드 유형</label>
      <div class="type-badge" :class="rewardType">
        {{ rewardType === 'COUPON' ? '🎟️ 쿠폰' : '💰 포인트' }}
      </div>
    </div>

    <div class="form-group">
      <label class="form-label">리워드 선택</label>
      <select class="form-select" :value="localConfig.rewardId" @change="selectReward">
        <option value="">선택하세요</option>
        <option
          v-for="item in availableRewards"
          :key="item.id"
          :value="item.id"
        >
          {{ item.name }} ({{ item.value }})
        </option>
      </select>
    </div>

    <div v-if="localConfig.rewardId" class="selected-reward">
      <div class="reward-detail-card">
        <div class="detail-row">
          <span class="detail-label">이름</span>
          <span class="detail-value">{{ localConfig.rewardName }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">값</span>
          <span class="detail-value-badge" :class="rewardType">{{ localConfig.value }}</span>
        </div>
        <div class="detail-row" v-if="selectedReward?.description">
          <span class="detail-label">설명</span>
          <span class="detail-value desc">{{ selectedReward.description }}</span>
        </div>
      </div>
    </div>

    <div class="form-group">
      <label class="form-label">지급 조건 메모</label>
      <textarea
        class="form-textarea"
        :value="localConfig.memo || ''"
        placeholder="지급 조건이나 참고사항을 입력하세요"
        @input="updateMemo"
        rows="3"
      ></textarea>
    </div>

    <div class="form-actions">
      <button class="btn-confirm" @click="confirmConfig" :disabled="!localConfig.rewardId">확인</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed } from 'vue'
import { useSettingsStore } from '@/stores/settingsStore'

const props = defineProps<{
  config: any
}>()

const emit = defineEmits<{
  update: [config: any]
}>()

const store = useSettingsStore()

const rewardType = computed(() => props.config?.rewardType || 'COUPON')

const availableRewards = computed(() => {
  return store.rewards.filter((r) => r.type === rewardType.value && r.enabled)
})

const localConfig = reactive({
  ...props.config,
})

const selectedReward = computed(() => {
  return store.rewards.find((r) => r.id === localConfig.rewardId)
})

function selectReward(e: Event) {
  const id = (e.target as HTMLSelectElement).value
  const reward = store.rewards.find((r) => r.id === id)
  if (reward) {
    localConfig.rewardId = reward.id
    localConfig.rewardName = reward.name
    localConfig.value = reward.value
  } else {
    localConfig.rewardId = ''
    localConfig.rewardName = ''
    localConfig.value = ''
  }
}

function updateMemo(e: Event) {
  localConfig.memo = (e.target as HTMLTextAreaElement).value
}

function confirmConfig() {
  emit('update', { ...localConfig, configured: true })
}
</script>

<style scoped>
.reward-config {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-size: 12px;
  font-weight: 600;
  color: #374151;
}

.type-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  font-weight: 700;
  padding: 6px 12px;
  border-radius: 8px;
  width: fit-content;
}

.type-badge.COUPON {
  background: #fef3c7;
  color: #92400e;
}

.type-badge.POINT {
  background: #dbeafe;
  color: #1e40af;
}

.form-select {
  padding: 9px 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 13px;
  background: #fff;
  cursor: pointer;
}

.form-select:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.selected-reward {
  margin-top: -8px;
}

.reward-detail-card {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.detail-label {
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  min-width: 36px;
  flex-shrink: 0;
}

.detail-value {
  font-size: 13px;
  color: #111827;
  font-weight: 500;
}

.detail-value.desc {
  font-weight: 400;
  color: #6b7280;
  font-size: 12px;
}

.detail-value-badge {
  font-size: 12px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 6px;
}

.detail-value-badge.COUPON {
  background: #fef3c7;
  color: #92400e;
}

.detail-value-badge.POINT {
  background: #dbeafe;
  color: #1e40af;
}

.form-textarea {
  padding: 9px 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 13px;
  font-family: inherit;
  resize: vertical;
  min-height: 60px;
}

.form-textarea:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.form-actions {
  padding-top: 8px;
}

.btn-confirm {
  width: 100%;
  padding: 10px;
  background: #2563eb;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}

.btn-confirm:hover:not(:disabled) {
  background: #1d4ed8;
}

.btn-confirm:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
