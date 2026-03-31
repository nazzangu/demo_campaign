<template>
  <div class="campaign-header">
    <div class="header-left">
      <span class="campaign-label">캠페인 키</span>
      <span class="campaign-key">{{ campaign?.id }}</span>
      <span class="status-dot" :class="statusClass"></span>
      <span class="status-badge" :class="statusClass">{{ statusLabel }}</span>
    </div>
    <div class="header-center">
      <input
        class="campaign-name-input"
        :value="campaign?.name || ''"
        placeholder="캠페인 제목을 입력하세요"
        :readonly="isReadonly"
        :class="{ readonly: isReadonly }"
        @input="$emit('updateName', ($event.target as HTMLInputElement).value)"
      />
      <input
        class="campaign-desc-input"
        :value="campaign?.description || ''"
        placeholder="설명을 추가해주세요."
        :readonly="isReadonly"
        :class="{ readonly: isReadonly }"
        @input="$emit('updateDesc', ($event.target as HTMLInputElement).value)"
      />
      <div class="tags" v-if="campaign?.tags?.length">
        <span class="tag" v-for="tag in campaign.tags" :key="tag">{{ tag }}</span>
      </div>
    </div>
    <div class="header-right">
      <!-- DRAFT: 저장 + 시작 -->
      <template v-if="!campaign || campaign.status === 'DRAFT'">
        <button class="btn btn-secondary" @click="$emit('save')" :disabled="!isDirty">
          저장하기
        </button>
        <button class="btn btn-primary" @click="$emit('activate')">
          시작하기
        </button>
      </template>

      <!-- ACTIVE: 수정(저장) + 일시정지 + 종료 -->
      <template v-else-if="campaign.status === 'ACTIVE'">
        <button class="btn btn-secondary" @click="$emit('save')" :disabled="!isDirty">
          수정하기
        </button>
        <button class="btn btn-pause" @click="$emit('pause')">
          일시정지
        </button>
        <button class="btn btn-stop" @click="$emit('stop')">
          종료하기
        </button>
      </template>

      <!-- PAUSED: 수정(저장) + 재시작 + 종료 -->
      <template v-else-if="campaign.status === 'PAUSED'">
        <button class="btn btn-secondary" @click="$emit('save')" :disabled="!isDirty">
          수정하기
        </button>
        <button class="btn btn-primary" @click="$emit('activate')">
          재시작
        </button>
        <button class="btn btn-stop" @click="$emit('stop')">
          종료하기
        </button>
      </template>

      <!-- COMPLETED: 저장만 -->
      <template v-else-if="campaign.status === 'COMPLETED'">
        <button class="btn btn-secondary" @click="$emit('save')" :disabled="!isDirty">
          저장하기
        </button>
      </template>

      <!-- ARCHIVED: 조회 전용 -->
      <template v-else-if="campaign.status === 'ARCHIVED'">
        <span class="readonly-badge">조회 전용 (폐기된 캠페인)</span>
      </template>
    </div>
  </div>
  <div v-if="isDirty" class="unsaved-banner">
    저장하지 않은 변경사항이 있습니다.
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
  pause: []
  stop: []
  updateName: [name: string]
  updateDesc: [desc: string]
}>()

const isReadonly = computed(() => {
  return props.campaign?.status === 'ARCHIVED' || props.campaign?.status === 'COMPLETED'
})

const statusClass = computed(() => {
  switch (props.campaign?.status) {
    case 'ACTIVE': return 'active'
    case 'PAUSED': return 'paused'
    case 'COMPLETED': return 'completed'
    case 'ARCHIVED': return 'archived'
    default: return 'draft'
  }
})

const statusLabel = computed(() => {
  switch (props.campaign?.status) {
    case 'ACTIVE': return '활성'
    case 'PAUSED': return '일시정지'
    case 'COMPLETED': return '완료'
    case 'ARCHIVED': return '폐기'
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
  gap: 8px;
  flex-shrink: 0;
}

.campaign-label {
  font-size: 12px;
  color: #9ca3af;
}

.campaign-key {
  font-size: 12px;
  color: #6b7280;
  background: #f3f4f6;
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: 600;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-left: 4px;
}

.status-dot.draft { background: #9ca3af; }
.status-dot.active { background: #059669; animation: pulse 2s infinite; }
.status-dot.paused { background: #d97706; }
.status-dot.completed { background: #2563eb; }
.status-dot.archived { background: #9ca3af; }

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
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
.status-badge.archived { background: #f3f4f6; color: #9ca3af; }

.header-center {
  flex: 1;
  min-width: 0;
}

.campaign-name-input {
  font-size: 18px;
  font-weight: 700;
  color: #111827;
  border: none;
  background: transparent;
  outline: none;
  width: 100%;
  padding: 2px 0;
  border-bottom: 1px solid transparent;
}

.campaign-name-input:hover {
  border-bottom-color: #d1d5db;
}

.campaign-name-input:focus {
  border-bottom-color: #2563eb;
}

.campaign-desc-input {
  font-size: 13px;
  color: #6b7280;
  border: none;
  background: transparent;
  outline: none;
  width: 100%;
  padding: 2px 0;
  margin-top: 2px;
  border-bottom: 1px solid transparent;
}

.campaign-desc-input:hover {
  border-bottom-color: #d1d5db;
}

.campaign-desc-input:focus {
  border-bottom-color: #2563eb;
  color: #111827;
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

.btn-pause {
  background: #fffbeb;
  color: #d97706;
  border: 1px solid #fde68a;
}

.btn-pause:hover {
  background: #fef3c7;
}

.btn-stop {
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
}

.btn-stop:hover {
  background: #fee2e2;
}

.readonly-badge {
  font-size: 12px;
  color: #9ca3af;
  background: #f3f4f6;
  padding: 6px 14px;
  border-radius: 8px;
  font-weight: 600;
}

.campaign-name-input.readonly,
.campaign-desc-input.readonly {
  cursor: default;
  color: #9ca3af;
}

.campaign-name-input.readonly:hover,
.campaign-desc-input.readonly:hover {
  border-bottom-color: transparent;
}

.unsaved-banner {
  background: #fef9c3;
  color: #854d0e;
  padding: 8px 20px;
  font-size: 13px;
  border-bottom: 1px solid #fde68a;
}
</style>
