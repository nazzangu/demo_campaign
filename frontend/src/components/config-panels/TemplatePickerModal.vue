<template>
  <Teleport to="body">
    <div v-if="visible" class="tpicker-overlay" @click.self="$emit('close')">
      <div class="tpicker-modal">
        <div class="tpicker-header">
          <h3>템플릿 불러오기</h3>
          <span class="tpicker-channel">{{ channelIcon }} {{ channelLabel }}</span>
          <button class="tpicker-close" @click="$emit('close')">✕</button>
        </div>
        <div class="tpicker-body">
          <!-- 좌측: 검색 + 목록 -->
          <div class="tpicker-list">
            <input type="text" v-model="search" class="tpicker-input" placeholder="템플릿 검색..." />
            <div class="tpicker-items">
              <div
                v-for="tpl in filtered"
                :key="tpl.id"
                class="tpicker-item"
                :class="{ active: selected?.id === tpl.id }"
                @click="selected = tpl"
              >
                <div class="tpicker-item-name">{{ tpl.name }}</div>
                <div class="tpicker-item-badge" :class="{ configured: tpl.channelConfig }">
                  {{ tpl.channelConfig ? '설정됨' : '미설정' }}
                </div>
              </div>
              <div v-if="!filtered.length" class="tpicker-empty">해당 채널의 템플릿이 없습니다.</div>
            </div>
          </div>

          <!-- 우측: 미리보기 -->
          <div class="tpicker-preview">
            <template v-if="selected">
              <div class="tpicker-preview-title">{{ selected.name }}</div>
              <div class="tpicker-preview-info" v-if="selected.title">
                <span class="tpicker-label">제목</span>
                <span>{{ selected.title }}</span>
              </div>
              <div class="tpicker-preview-info" v-if="selected.body">
                <span class="tpicker-label">내용</span>
                <span class="tpicker-body-text">{{ selected.body }}</span>
              </div>
              <div v-if="selected.channelConfig" class="tpicker-config-badge">
                채널 상세 설정이 포함되어 있습니다
              </div>
              <div v-else class="tpicker-config-badge warn">
                기본 정보만 포함되어 있습니다
              </div>
            </template>
            <div v-else class="tpicker-empty-preview">
              좌측에서 템플릿을 선택하세요
            </div>
          </div>
        </div>
        <div class="tpicker-footer">
          <button class="tpicker-btn cancel" @click="$emit('close')">취소</button>
          <button class="tpicker-btn confirm" :disabled="!selected" @click="confirm">템플릿 적용</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useSettingsStore } from '@/stores/settingsStore'
import type { TemplateItem } from '@/stores/settingsStore'

const props = defineProps<{
  visible: boolean
  channelType: string
}>()

const emit = defineEmits<{
  close: []
  select: [template: TemplateItem]
}>()

const store = useSettingsStore()

const search = ref('')
const selected = ref<TemplateItem | null>(null)

const channelIcon = computed(() => store.channels.find((c) => c.type === props.channelType)?.icon || '📨')
const channelLabel = computed(() => store.channels.find((c) => c.type === props.channelType)?.label || props.channelType)

const filtered = computed(() => {
  const list = store.templates.filter((t) => t.channelType === props.channelType)
  if (!search.value) return list
  const q = search.value.toLowerCase()
  return list.filter((t) => t.name.toLowerCase().includes(q) || t.title?.toLowerCase().includes(q))
})

function confirm() {
  if (selected.value) {
    emit('select', selected.value)
    selected.value = null
    search.value = ''
  }
}
</script>

<style scoped>
.tpicker-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tpicker-modal {
  background: #fff;
  border-radius: 14px;
  width: 680px;
  max-width: 90vw;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0,0,0,0.2);
  overflow: hidden;
}

.tpicker-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
}

.tpicker-header h3 {
  font-size: 15px;
  font-weight: 700;
  color: #111827;
  margin: 0;
}

.tpicker-channel {
  font-size: 12px;
  color: #6b7280;
  background: #e5e7eb;
  padding: 2px 8px;
  border-radius: 6px;
}

.tpicker-close {
  margin-left: auto;
  background: none;
  border: none;
  font-size: 18px;
  color: #6b7280;
  cursor: pointer;
}

.tpicker-body {
  display: flex;
  flex: 1;
  overflow: hidden;
  min-height: 350px;
}

.tpicker-list {
  width: 260px;
  border-right: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.tpicker-input {
  margin: 12px;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 13px;
  background: #fff;
}

.tpicker-input:focus {
  outline: none;
  border-color: #2563eb;
}

.tpicker-items {
  flex: 1;
  overflow-y: auto;
  padding: 0 8px 8px;
}

.tpicker-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.1s;
  gap: 8px;
}

.tpicker-item:hover {
  background: #f3f4f6;
}

.tpicker-item.active {
  background: #eff6ff;
  color: #1d4ed8;
}

.tpicker-item-name {
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  min-width: 0;
}

.tpicker-item-badge {
  font-size: 10px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 4px;
  background: #fef3c7;
  color: #92400e;
  flex-shrink: 0;
}

.tpicker-item-badge.configured {
  background: #ecfdf5;
  color: #059669;
}

.tpicker-preview {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.tpicker-preview-title {
  font-size: 16px;
  font-weight: 700;
  color: #111827;
}

.tpicker-preview-info {
  display: flex;
  gap: 10px;
  font-size: 13px;
}

.tpicker-label {
  font-weight: 600;
  color: #6b7280;
  min-width: 36px;
  flex-shrink: 0;
}

.tpicker-body-text {
  color: #374151;
  line-height: 1.5;
  white-space: pre-wrap;
}

.tpicker-config-badge {
  font-size: 12px;
  font-weight: 600;
  padding: 8px 12px;
  border-radius: 8px;
  background: #ecfdf5;
  color: #059669;
  text-align: center;
}

.tpicker-config-badge.warn {
  background: #fef3c7;
  color: #92400e;
}

.tpicker-empty {
  padding: 30px 12px;
  text-align: center;
  color: #9ca3af;
  font-size: 13px;
}

.tpicker-empty-preview {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  font-size: 13px;
}

.tpicker-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 14px 20px;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
}

.tpicker-btn {
  padding: 8px 20px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: all 0.15s;
}

.tpicker-btn.cancel {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
}

.tpicker-btn.cancel:hover {
  background: #e5e7eb;
}

.tpicker-btn.confirm {
  background: #2563eb;
  color: #fff;
}

.tpicker-btn.confirm:hover:not(:disabled) {
  background: #1d4ed8;
}

.tpicker-btn.confirm:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
