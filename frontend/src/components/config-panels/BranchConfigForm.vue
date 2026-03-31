<template>
  <div class="form">
    <!-- EVENT: 대기 시간 -->
    <div class="form-group" v-if="localConfig.branchType === 'EVENT'">
      <label>대기 시간</label>
      <div class="wait-desc">
        이벤트가 발생할 때까지
        <input type="number" v-model.number="localConfig.waitDuration.value" min="1" class="input-inline" @input="emitUpdate" />
        <select v-model="localConfig.waitDuration.unit" class="select-inline" @change="emitUpdate">
          <option value="MINUTE">분</option>
          <option value="HOUR">시간</option>
          <option value="DAY">일</option>
        </select>
        동안 대기합니다.
      </div>
    </div>

    <div class="branches-section">
      <div v-for="(branch, idx) in localConfig.branches" :key="idx" class="branch-block">
        <!-- Branch header -->
        <div class="branch-header">
          <span class="branch-idx">{{ branch.index }}</span>
          <input
            v-if="!branch.isDefault"
            type="text"
            v-model="branch.label"
            class="branch-name-input"
            @input="emitUpdate"
          />
          <span v-else class="branch-name-text">{{ branch.label }}</span>
          <!-- 세그먼트 가져오기 버튼 -->
          <button
            v-if="!branch.isDefault"
            class="import-btn"
            @click="openImportModal(idx)"
          >세그먼트 가져오기</button>
          <button
            v-if="!branch.isDefault && normalBranchCount > 1"
            class="remove-btn"
            @click="removeBranch(idx)"
          >✕</button>
        </div>

        <!-- USER branch: cohort rules -->
        <div v-if="localConfig.branchType === 'USER' && !branch.isDefault" class="branch-body">
          <CohortRuleBuilder
            :rules="branch.rules || []"
            :rules-operator="branch.rulesOperator || 'AND'"
            @update="(rules, op) => updateBranchRules(idx, rules, op)"
          />
        </div>

        <!-- EVENT branch: event condition -->
        <div v-if="localConfig.branchType === 'EVENT' && !branch.isDefault" class="branch-body">
          <EventBranchBuilder
            :condition="branch.eventCondition || { eventName: '', filters: [] }"
            @update="(cond) => updateEventCondition(idx, cond)"
          />
        </div>

        <!-- Default branch -->
        <div v-if="branch.isDefault" class="default-label">
          위 조건에 해당하지 않는 그 외 모든 사용자입니다.
        </div>
      </div>

      <!-- 그 외 사용자 그룹 토글 -->
      <div class="default-toggle">
        <label class="toggle-label">
          <input
            type="checkbox"
            :checked="hasDefaultBranch"
            @change="toggleDefaultBranch"
          />
          <span>그 외 사용자 그룹 사용</span>
        </label>
        <span class="toggle-desc">어떤 조건에도 해당하지 않는 사용자를 별도로 분기합니다.</span>
      </div>

      <button class="add-group-btn" @click="addBranch">+ 사용자 그룹 추가하기</button>
    </div>

    <!-- 세그먼트 가져오기 모달 -->
    <Teleport to="body">
      <div v-if="importModalOpen" class="seg-modal-overlay" @click.self="importModalOpen = false">
        <div class="seg-modal">
          <div class="seg-modal-header">
            <h3>세그먼트 가져오기</h3>
            <button class="seg-modal-close" @click="importModalOpen = false">✕</button>
          </div>
          <div class="seg-modal-search">
            <input v-model="segSearch" class="seg-search-input" placeholder="세그먼트 검색..." />
          </div>
          <div class="seg-modal-body">
            <div v-if="filteredSavedSegments.length === 0" class="seg-empty">
              해당 유형의 저장된 세그먼트가 없습니다.
            </div>
            <div
              v-for="seg in filteredSavedSegments"
              :key="seg.id"
              class="seg-item"
              @click="applySegment(seg)"
            >
              <div class="seg-item-top">
                <span class="seg-item-name">{{ seg.name }}</span>
                <span class="seg-item-badge" :class="seg.type">{{ seg.type === 'USER' ? '사용자' : '이벤트' }}</span>
              </div>
              <p class="seg-item-desc">{{ seg.description || '설명 없음' }}</p>
              <div class="seg-item-summary">
                <template v-if="seg.type === 'USER'">
                  규칙 {{ seg.rules.length }}개
                  <span v-if="seg.rules.length > 0">
                    · 조건 {{ seg.rules.reduce((sum: number, r: any) => sum + r.conditions.length, 0) }}개
                  </span>
                </template>
                <template v-else>
                  이벤트: {{ seg.eventCondition.eventName || '(미설정)' }}
                  <span v-if="seg.eventCondition.filters.length > 0">
                    · 필터 {{ seg.eventCondition.filters.length }}개
                  </span>
                </template>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, watch } from 'vue'
import CohortRuleBuilder from './CohortRuleBuilder.vue'
import EventBranchBuilder from './EventBranchBuilder.vue'

const SEGMENT_STORAGE_KEY = 'campaign_segments'

const props = defineProps<{ config: any }>()
const emit = defineEmits<{ update: [config: any] }>()

// 세그먼트 가져오기 상태
const importModalOpen = ref(false)
const importTargetIdx = ref<number>(0)
const segSearch = ref('')

interface SavedSegment {
  id: number
  name: string
  description: string
  type: 'USER' | 'EVENT'
  rules: any[]
  rulesOperator: 'AND' | 'OR'
  eventCondition: { eventName: string; filters: any[] }
}

function loadSavedSegments(): SavedSegment[] {
  try {
    const raw = localStorage.getItem(SEGMENT_STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

const filteredSavedSegments = computed(() => {
  const all = loadSavedSegments()
  const targetType = localConfig.branchType // USER or EVENT
  let list = all.filter((s) => s.type === targetType)
  if (segSearch.value.trim()) {
    const q = segSearch.value.toLowerCase()
    list = list.filter((s) => s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q))
  }
  return list
})

function openImportModal(branchIdx: number) {
  importTargetIdx.value = branchIdx
  segSearch.value = ''
  importModalOpen.value = true
}

function applySegment(seg: SavedSegment) {
  const branch = localConfig.branches[importTargetIdx.value]
  if (!branch || branch.isDefault) return

  branch.label = seg.name

  if (seg.type === 'USER') {
    branch.rules = JSON.parse(JSON.stringify(seg.rules))
    branch.rulesOperator = seg.rulesOperator
  } else {
    branch.eventCondition = JSON.parse(JSON.stringify(seg.eventCondition))
  }

  importModalOpen.value = false
  emitUpdate()
}

const localConfig = reactive({
  branchType: props.config?.branchType || 'USER',
  waitDuration: props.config?.waitDuration || { value: 1, unit: 'DAY' },
  branches: props.config?.branches || [
    { index: 1, label: '그룹 1', condition: {}, rules: [], rulesOperator: 'AND', eventCondition: { eventName: '', filters: [] } },
    { index: 2, label: '그 외 사용자', condition: {}, isDefault: true },
  ],
})

watch(() => props.config, (val) => {
  if (val) {
    localConfig.branchType = val.branchType || 'USER'
    localConfig.waitDuration = val.waitDuration || { value: 1, unit: 'DAY' }
    localConfig.branches = val.branches || []
  }
}, { deep: true })

const hasDefaultBranch = computed(() =>
  localConfig.branches.some((b: any) => b.isDefault),
)

const normalBranchCount = computed(() =>
  localConfig.branches.filter((b: any) => !b.isDefault).length,
)

function toggleDefaultBranch() {
  if (hasDefaultBranch.value) {
    // 기본 그룹 제거
    localConfig.branches = localConfig.branches.filter((b: any) => !b.isDefault)
  } else {
    // 기본 그룹 추가 (맨 마지막)
    localConfig.branches.push({
      index: localConfig.branches.length + 1,
      label: '그 외 사용자',
      condition: {},
      isDefault: true,
    })
  }
  reindex()
  emitUpdate()
}

function addBranch() {
  const defaultBranch = localConfig.branches.find((b: any) => b.isDefault)
  const newIndex = defaultBranch ? defaultBranch.index : localConfig.branches.length + 1

  const newBranch: any = {
    index: newIndex,
    label: localConfig.branchType === 'EVENT' ? `그룹 ${newIndex}` : `그룹 ${newIndex}`,
    condition: {},
    rules: [],
    rulesOperator: 'AND',
    eventCondition: { eventName: '', filters: [] },
  }

  if (defaultBranch) {
    const defIdx = localConfig.branches.indexOf(defaultBranch)
    localConfig.branches.splice(defIdx, 0, newBranch)
    defaultBranch.index = newIndex + 1
  } else {
    localConfig.branches.push(newBranch)
  }
  reindex()
  emitUpdate()
}

// 일반 그룹은 최소 1개 유지
const minNormalBranches = 1

function removeBranch(idx: number) {
  const normalCount = localConfig.branches.filter((b: any) => !b.isDefault).length
  if (normalCount <= minNormalBranches) return
  localConfig.branches.splice(idx, 1)
  reindex()
  emitUpdate()
}

function reindex() {
  localConfig.branches.forEach((b: any, i: number) => {
    b.index = i + 1
  })
}

function updateBranchRules(idx: number, rules: any[], rulesOperator: 'AND' | 'OR') {
  localConfig.branches[idx].rules = rules
  localConfig.branches[idx].rulesOperator = rulesOperator
  emitUpdate()
}

function updateEventCondition(idx: number, condition: any) {
  localConfig.branches[idx].eventCondition = condition
  emitUpdate()
}

function emitUpdate() {
  emit('update', {
    branchType: localConfig.branchType,
    waitDuration: { ...localConfig.waitDuration },
    branches: localConfig.branches.map((b: any) => ({ ...b })),
  })
}
</script>

<style scoped>
.form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.form-group label {
  font-size: 12px;
  font-weight: 600;
  color: #374151;
}

.wait-desc {
  font-size: 13px;
  color: #374151;
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.input-inline {
  width: 52px;
  padding: 5px 8px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 13px;
  text-align: center;
}

.select-inline {
  padding: 5px 8px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 13px;
}

.branches-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.branch-block {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 12px;
  background: #fff;
}

.branch-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.branch-idx {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #8b5cf6;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  flex-shrink: 0;
}

.branch-name-input {
  flex: 1;
  padding: 5px 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
}

.branch-name-text {
  flex: 1;
  font-size: 13px;
  font-weight: 600;
  color: #374151;
}

.branch-body {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #f3f4f6;
}

.default-label {
  font-size: 12px;
  color: #9ca3af;
  margin-top: 4px;
}

.remove-btn {
  background: none;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  font-size: 16px;
  padding: 2px 4px;
}

.remove-btn:hover {
  color: #ef4444;
}

/* 그 외 사용자 그룹 토글 */
.default-toggle {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 12px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.toggle-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  cursor: pointer;
}

.toggle-label input[type="checkbox"] {
  width: 16px;
  height: 16px;
  accent-color: #6366f1;
  cursor: pointer;
}

.toggle-desc {
  font-size: 11px;
  color: #9ca3af;
  padding-left: 24px;
}

.add-group-btn {
  width: 100%;
  padding: 10px;
  background: #fff;
  border: 2px solid #2563eb;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #2563eb;
  cursor: pointer;
  transition: background 0.2s;
}

.add-group-btn:hover {
  background: #eff6ff;
}

/* 세그먼트 가져오기 버튼 */
.import-btn {
  padding: 3px 10px;
  border: 1px solid #c7d2fe;
  border-radius: 6px;
  background: #eef2ff;
  color: #6366f1;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s;
}

.import-btn:hover {
  background: #6366f1;
  color: #fff;
}

/* 세그먼트 가져오기 모달 */
.seg-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9100;
}

.seg-modal {
  background: #fff;
  border-radius: 14px;
  width: 480px;
  max-width: 92vw;
  max-height: 70vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.18);
}

.seg-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px 12px;
  border-bottom: 1px solid #f3f4f6;
}

.seg-modal-header h3 {
  font-size: 16px;
  font-weight: 700;
  color: #111827;
  margin: 0;
}

.seg-modal-close {
  background: none;
  border: none;
  font-size: 18px;
  color: #9ca3af;
  cursor: pointer;
}

.seg-modal-close:hover {
  color: #374151;
}

.seg-modal-search {
  padding: 12px 20px 8px;
}

.seg-search-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 13px;
}

.seg-modal-body {
  padding: 8px 20px 16px;
  overflow-y: auto;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.seg-empty {
  text-align: center;
  padding: 32px 0;
  color: #9ca3af;
  font-size: 13px;
}

.seg-item {
  padding: 12px 14px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.15s;
}

.seg-item:hover {
  border-color: #6366f1;
  background: #faf5ff;
}

.seg-item-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}

.seg-item-name {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
}

.seg-item-badge {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 6px;
}

.seg-item-badge.USER {
  background: #ede9fe;
  color: #7c3aed;
}

.seg-item-badge.EVENT {
  background: #fef3c7;
  color: #d97706;
}

.seg-item-desc {
  font-size: 12px;
  color: #6b7280;
  margin: 0 0 6px;
}

.seg-item-summary {
  font-size: 11px;
  color: #9ca3af;
}
</style>
