<template>
  <div class="campaign-header">
    <div class="header-left">
      <span class="campaign-key">캠페인 키: {{ campaign?.campaignKey }}</span>
      <span class="status-badge" :class="statusClass">{{ statusLabel }}</span>
    </div>
    <div class="header-center">
      <h1 class="campaign-name">{{ campaign?.name || '새 캠페인' }}</h1>
      <p class="campaign-desc">{{ campaign?.description || '설명을 추가해주세요.' }}</p>
      <div class="tags" v-if="campaign?.tags?.length">
        <span class="tag" v-for="tag in campaign.tags" :key="tag">{{ tag }}</span>
      </div>
    </div>
    <div class="header-right">
      <button class="btn btn-secondary" @click="$emit('save')" :disabled="!isDirty">
        💾 저장하기
      </button>
      <button
        class="btn btn-primary"
        @click="$emit('activate')"
        :disabled="campaign?.status === 'ACTIVE'"
      >
        ▶️ 시작하기
      </button>
    </div>
  </div>
  <div v-if="isDirty" class="unsaved-banner">
    ⚠️ 저장하지 않은 변경사항이 있습니다.
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Campaign } from '@/types/campaign'

const props = defineProps<{
  campaign: Campaign | null
  isDirty: boolean
}>()

defineEmits<{
  save: []
  activate: []
}>()

const statusClass = computed(() => {
  switch (props.campaign?.status) {
    case 'ACTIVE': return 'active'
    case 'PAUSED': return 'paused'
    case 'COMPLETED': return 'completed'
    default: return 'draft'
  }
})

const statusLabel = computed(() => {
  switch (props.campaign?.status) {
    case 'ACTIVE': return '운영'
    case 'PAUSED': return '일시정지'
    case 'COMPLETED': return '완료'
    default: return '초안'
  }
})
</script>

<style scoped>
.campaign-header {
  display: flex;
  align-items: center;
  padding: 12px 20px;
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
  gap: 20px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.campaign-key {
  font-size: 12px;
  color: #6b7280;
  background: #f3f4f6;
  padding: 4px 8px;
  border-radius: 4px;
}

.status-badge {
  font-size: 11px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 12px;
}

.status-badge.draft { background: #f3f4f6; color: #6b7280; }
.status-badge.active { background: #ecfdf5; color: #059669; }
.status-badge.paused { background: #fffbeb; color: #d97706; }
.status-badge.completed { background: #eff6ff; color: #2563eb; }

.header-center {
  flex: 1;
  min-width: 0;
}

.campaign-name {
  font-size: 18px;
  font-weight: 700;
  color: #111827;
  margin: 0;
}

.campaign-desc {
  font-size: 13px;
  color: #9ca3af;
  margin: 2px 0 0;
}

.tags {
  display: flex;
  gap: 4px;
  margin-top: 4px;
}

.tag {
  font-size: 11px;
  background: #e5e7eb;
  color: #4b5563;
  padding: 2px 8px;
  border-radius: 4px;
}

.header-right {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.btn {
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: all 0.15s;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
}

.btn-secondary:hover:not(:disabled) {
  background: #e5e7eb;
}

.btn-primary {
  background: #2563eb;
  color: #fff;
}

.btn-primary:hover:not(:disabled) {
  background: #1d4ed8;
}

.unsaved-banner {
  background: #fef9c3;
  color: #854d0e;
  padding: 8px 20px;
  font-size: 13px;
  border-bottom: 1px solid #fde68a;
}
</style>
