<template>
  <div class="segment-page">
    <div class="segment-header">
      <div>
        <h1>세그먼트 관리</h1>
        <p class="desc">캠페인에서 사용할 사용자 세그먼트와 이벤트 조건을 사전에 정의합니다.</p>
      </div>
      <div class="header-actions">
        <button class="btn btn-primary" @click="openCreateModal">+ 새 세그먼트</button>
      </div>
    </div>

    <!-- 필터 -->
    <div class="filter-bar">
      <button
        v-for="tab in typeTabs"
        :key="tab.value"
        class="tab-btn"
        :class="{ active: filterType === tab.value }"
        @click="filterType = tab.value"
      >{{ tab.label }} ({{ countByType(tab.value) }})</button>
      <input v-model="searchQuery" class="filter-input" placeholder="세그먼트명 검색..." />
    </div>

    <!-- 세그먼트 목록 -->
    <div v-if="filteredSegments.length === 0" class="empty-state">
      <span class="empty-icon">🎯</span>
      <p>세그먼트가 없습니다. 새 세그먼트를 만들어보세요.</p>
    </div>

    <div class="segment-list">
      <div
        v-for="seg in filteredSegments"
        :key="seg.id"
        class="segment-card"
      >
        <div class="card-top">
          <div class="card-top-left">
            <span class="type-badge" :class="seg.type">{{ seg.type === 'USER' ? '사용자 기반' : '이벤트 기반' }}</span>
            <span class="card-date">{{ formatDate(seg.updatedAt) }}</span>
          </div>
          <div class="card-top-right">
            <span v-if="seg.usedCount > 0" class="used-badge">{{ seg.usedCount }}개 캠페인 사용 중</span>
          </div>
        </div>
        <h3 class="card-name">{{ seg.name }}</h3>
        <p class="card-desc">{{ seg.description || '설명 없음' }}</p>

        <!-- 조건 요약 -->
        <div class="condition-summary">
          <template v-if="seg.type === 'USER'">
            <div v-for="(rule, rIdx) in seg.rules.slice(0, 2)" :key="rIdx" class="summary-rule">
              <span class="summary-label">규칙 {{ rIdx + 1 }}:</span>
              <span v-for="(cond, cIdx) in rule.conditions.slice(0, 2)" :key="cIdx" class="summary-tag">
                <span v-if="cIdx > 0" class="summary-op">{{ rule.conditionOperator }}</span>
                {{ eventLabel(cond.eventType) || '(미설정)' }}
                {{ cond.aggregateType === 'COUNT' ? '횟수' : '합계' }}
                {{ cond.aggregateOperator }} {{ cond.aggregateValue }}
              </span>
              <span v-if="rule.conditions.length > 2" class="summary-more">외 {{ rule.conditions.length - 2 }}건</span>
            </div>
            <div v-if="seg.rules.length > 2" class="summary-more">외 {{ seg.rules.length - 2 }}개 규칙</div>
          </template>
          <template v-else>
            <div class="summary-rule">
              <span class="summary-tag">{{ eventLabel(seg.eventCondition.eventName) || '(미설정)' }}</span>
              <span v-if="seg.eventCondition.filters.length > 0" class="summary-tag">
                + 필터 {{ seg.eventCondition.filters.length }}개
              </span>
            </div>
          </template>
        </div>

        <div class="card-actions">
          <button class="btn btn-sm btn-ghost" @click="editSegment(seg)">편집</button>
          <button class="btn btn-sm btn-ghost" @click="duplicateSegment(seg)">복제</button>
          <button class="btn btn-sm btn-danger-ghost" @click="confirmDelete(seg)">삭제</button>
        </div>
      </div>
    </div>

    <!-- 생성/편집 모달 -->
    <Teleport to="body">
      <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal-panel">
          <div class="modal-header">
            <h2>{{ editingSegment ? '세그먼트 편집' : '새 세그먼트' }}</h2>
            <button class="modal-close" @click="closeModal">✕</button>
          </div>

          <div class="modal-body">
            <!-- 기본 정보 -->
            <div class="form-group">
              <label>세그먼트 이름</label>
              <input v-model="form.name" type="text" class="form-input" placeholder="세그먼트 이름을 입력하세요" />
            </div>
            <div class="form-group">
              <label>설명</label>
              <input v-model="form.description" type="text" class="form-input" placeholder="설명 (선택)" />
            </div>

            <!-- 유형 선택 -->
            <div class="form-group">
              <label>세그먼트 유형</label>
              <div class="type-selector">
                <button
                  class="type-btn"
                  :class="{ active: form.type === 'USER' }"
                  @click="form.type = 'USER'"
                  :disabled="!!editingSegment"
                >
                  <span class="type-btn-icon">👤</span>
                  <span class="type-btn-label">사용자 기반</span>
                  <span class="type-btn-desc">코호트 규칙으로 사용자 세그먼트 정의</span>
                </button>
                <button
                  class="type-btn"
                  :class="{ active: form.type === 'EVENT' }"
                  @click="form.type = 'EVENT'"
                  :disabled="!!editingSegment"
                >
                  <span class="type-btn-icon">⚡</span>
                  <span class="type-btn-label">이벤트 기반</span>
                  <span class="type-btn-desc">특정 이벤트 발생 조건 정의</span>
                </button>
              </div>
            </div>

            <!-- 조건 설정: 사용자 기반 -->
            <div v-if="form.type === 'USER'" class="form-group">
              <label>코호트 규칙 설정</label>
              <div class="builder-wrap">
                <CohortRuleBuilder
                  :rules="form.rules"
                  :rules-operator="form.rulesOperator"
                  @update="(rules, op) => { form.rules = rules; form.rulesOperator = op }"
                />
              </div>
            </div>

            <!-- 조건 설정: 이벤트 기반 -->
            <div v-if="form.type === 'EVENT'" class="form-group">
              <label>이벤트 조건 설정</label>
              <div class="builder-wrap">
                <EventBranchBuilder
                  :condition="form.eventCondition"
                  @update="(cond) => { form.eventCondition = cond }"
                />
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn btn-ghost" @click="closeModal">취소</button>
            <button class="btn btn-primary" :disabled="!form.name.trim()" @click="saveSegment">
              {{ editingSegment ? '저장' : '생성' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 삭제 확인 모달 -->
    <Teleport to="body">
      <div v-if="deleteTarget" class="modal-overlay" @click.self="deleteTarget = null">
        <div class="confirm-modal">
          <p>"<strong>{{ deleteTarget.name }}</strong>" 세그먼트를 삭제하시겠습니까?</p>
          <p v-if="deleteTarget.usedCount > 0" class="warn-text">
            이 세그먼트는 {{ deleteTarget.usedCount }}개 캠페인에서 사용 중입니다.
          </p>
          <div class="confirm-actions">
            <button class="btn btn-ghost" @click="deleteTarget = null">취소</button>
            <button class="btn btn-danger" @click="doDelete">삭제</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 토스트 -->
    <Teleport to="body">
      <div v-if="toast" class="toast" :class="toast.type">{{ toast.message }}</div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import CohortRuleBuilder from '@/components/config-panels/CohortRuleBuilder.vue'
import EventBranchBuilder from '@/components/config-panels/EventBranchBuilder.vue'
import { useSettingsStore } from '@/stores/settingsStore'
import type { CohortRule, EventBranchCondition } from '@/types/flow'

const settingsStore = useSettingsStore()

interface Segment {
  id: number
  name: string
  description: string
  type: 'USER' | 'EVENT'
  rules: CohortRule[]
  rulesOperator: 'AND' | 'OR'
  eventCondition: EventBranchCondition
  usedCount: number
  createdAt: string
  updatedAt: string
}

const STORAGE_KEY = 'campaign_segments'

const segments = ref<Segment[]>([])
const filterType = ref<'ALL' | 'USER' | 'EVENT'>('ALL')
const searchQuery = ref('')
const showModal = ref(false)
const editingSegment = ref<Segment | null>(null)
const deleteTarget = ref<Segment | null>(null)
const toast = ref<{ message: string; type: 'success' | 'error' } | null>(null)

const typeTabs = [
  { value: 'ALL' as const, label: '전체' },
  { value: 'USER' as const, label: '사용자 기반' },
  { value: 'EVENT' as const, label: '이벤트 기반' },
]

const defaultForm = () => ({
  name: '',
  description: '',
  type: 'USER' as 'USER' | 'EVENT',
  rules: [{
    conditions: [{
      eventType: '',
      periodType: 'RELATIVE' as const,
      specificStart: '',
      specificEnd: '',
      relativeDays: 7,
      aggregateType: 'COUNT' as const,
      aggregateOperator: '>=' as const,
      aggregateValue: 1,
      filters: [],
    }],
    conditionOperator: 'AND' as const,
  }] as CohortRule[],
  rulesOperator: 'AND' as 'AND' | 'OR',
  eventCondition: { eventName: '', filters: [] } as EventBranchCondition,
})

const form = ref(defaultForm())

onMounted(() => {
  loadFromStorage()
  if (segments.value.length === 0) {
    segments.value = generateDemoSegments()
    saveToStorage()
  }
})

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) segments.value = JSON.parse(raw)
  } catch { /* ignore */ }
}

function saveToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(segments.value))
}

const filteredSegments = computed(() => {
  let list = segments.value
  if (filterType.value !== 'ALL') {
    list = list.filter((s) => s.type === filterType.value)
  }
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter((s) => s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q))
  }
  return list
})

function countByType(type: 'ALL' | 'USER' | 'EVENT') {
  if (type === 'ALL') return segments.value.length
  return segments.value.filter((s) => s.type === type).length
}

function eventLabel(eventName: string) {
  const evt = settingsStore.events.find((e: any) => e.name === eventName)
  return evt ? evt.label : eventName
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('ko-KR')
}

// ---- CRUD ----

function openCreateModal() {
  editingSegment.value = null
  form.value = defaultForm()
  showModal.value = true
}

function editSegment(seg: Segment) {
  editingSegment.value = seg
  form.value = {
    name: seg.name,
    description: seg.description,
    type: seg.type,
    rules: JSON.parse(JSON.stringify(seg.rules)),
    rulesOperator: seg.rulesOperator,
    eventCondition: JSON.parse(JSON.stringify(seg.eventCondition)),
  }
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editingSegment.value = null
}

function saveSegment() {
  const now = new Date().toISOString()
  if (editingSegment.value) {
    const seg = segments.value.find((s) => s.id === editingSegment.value!.id)
    if (seg) {
      seg.name = form.value.name
      seg.description = form.value.description
      seg.rules = JSON.parse(JSON.stringify(form.value.rules))
      seg.rulesOperator = form.value.rulesOperator
      seg.eventCondition = JSON.parse(JSON.stringify(form.value.eventCondition))
      seg.updatedAt = now
    }
    showToast('세그먼트가 수정되었습니다.', 'success')
  } else {
    const newId = segments.value.length > 0 ? Math.max(...segments.value.map((s) => s.id)) + 1 : 1
    segments.value.unshift({
      id: newId,
      name: form.value.name,
      description: form.value.description,
      type: form.value.type,
      rules: JSON.parse(JSON.stringify(form.value.rules)),
      rulesOperator: form.value.rulesOperator,
      eventCondition: JSON.parse(JSON.stringify(form.value.eventCondition)),
      usedCount: 0,
      createdAt: now,
      updatedAt: now,
    })
    showToast('세그먼트가 생성되었습니다.', 'success')
  }
  saveToStorage()
  closeModal()
}

function duplicateSegment(seg: Segment) {
  const now = new Date().toISOString()
  const newId = Math.max(...segments.value.map((s) => s.id)) + 1
  segments.value.unshift({
    ...JSON.parse(JSON.stringify(seg)),
    id: newId,
    name: seg.name + ' (복제)',
    usedCount: 0,
    createdAt: now,
    updatedAt: now,
  })
  saveToStorage()
  showToast('세그먼트가 복제되었습니다.', 'success')
}

function confirmDelete(seg: Segment) {
  deleteTarget.value = seg
}

function doDelete() {
  if (!deleteTarget.value) return
  segments.value = segments.value.filter((s) => s.id !== deleteTarget.value!.id)
  saveToStorage()
  showToast('세그먼트가 삭제되었습니다.', 'success')
  deleteTarget.value = null
}

function showToast(message: string, type: 'success' | 'error') {
  toast.value = { message, type }
  setTimeout(() => { toast.value = null }, 3000)
}

// ---- 데모 데이터 ----

function generateDemoSegments(): Segment[] {
  return [
    {
      id: 1,
      name: '최근 30일 구매 고객',
      description: '지난 30일 이내 1회 이상 구매한 활성 고객',
      type: 'USER',
      rules: [{
        conditions: [{
          eventType: 'order_complete',
          periodType: 'RELATIVE',
          specificStart: '',
          specificEnd: '',
          relativeDays: 30,
          aggregateType: 'COUNT',
          aggregateOperator: '>=',
          aggregateValue: 1,
          filters: [],
        }],
        conditionOperator: 'AND',
      }],
      rulesOperator: 'AND',
      eventCondition: { eventName: '', filters: [] },
      usedCount: 3,
      createdAt: '2026-02-10T09:00:00Z',
      updatedAt: '2026-03-25T14:30:00Z',
    },
    {
      id: 2,
      name: '휴면 고객 (60일 미접속)',
      description: '최근 60일 이내 로그인 횟수가 0인 사용자',
      type: 'USER',
      rules: [{
        conditions: [{
          eventType: 'login',
          periodType: 'RELATIVE',
          specificStart: '',
          specificEnd: '',
          relativeDays: 60,
          aggregateType: 'COUNT',
          aggregateOperator: '<=',
          aggregateValue: 0,
          filters: [],
        }],
        conditionOperator: 'AND',
      }],
      rulesOperator: 'AND',
      eventCondition: { eventName: '', filters: [] },
      usedCount: 2,
      createdAt: '2026-01-20T09:00:00Z',
      updatedAt: '2026-03-20T10:00:00Z',
    },
    {
      id: 3,
      name: 'VIP 고객 (월 3회 이상 구매)',
      description: '최근 30일 이내 3회 이상 구매한 충성 고객',
      type: 'USER',
      rules: [{
        conditions: [{
          eventType: 'order_complete',
          periodType: 'RELATIVE',
          specificStart: '',
          specificEnd: '',
          relativeDays: 30,
          aggregateType: 'COUNT',
          aggregateOperator: '>=',
          aggregateValue: 3,
          filters: [],
        }],
        conditionOperator: 'AND',
      }],
      rulesOperator: 'AND',
      eventCondition: { eventName: '', filters: [] },
      usedCount: 1,
      createdAt: '2026-02-01T09:00:00Z',
      updatedAt: '2026-03-15T11:00:00Z',
    },
    {
      id: 4,
      name: '장바구니 담기 이벤트',
      description: '상품을 장바구니에 담은 사용자를 감지하는 이벤트 조건',
      type: 'EVENT',
      rules: [],
      rulesOperator: 'AND',
      eventCondition: {
        eventName: 'add_to_cart',
        filters: [
          { property: 'price', operator: '>', value: '10000' },
        ],
      },
      usedCount: 2,
      createdAt: '2026-03-01T09:00:00Z',
      updatedAt: '2026-03-28T16:00:00Z',
    },
    {
      id: 5,
      name: '앱 설치 후 미구매',
      description: '앱을 열었지만 구매 이력이 없는 신규 사용자',
      type: 'USER',
      rules: [
        {
          conditions: [{
            eventType: 'app_open',
            periodType: 'RELATIVE',
            specificStart: '',
            specificEnd: '',
            relativeDays: 14,
            aggregateType: 'COUNT',
            aggregateOperator: '>=',
            aggregateValue: 1,
            filters: [],
          }],
          conditionOperator: 'AND',
        },
        {
          conditions: [{
            eventType: 'order_complete',
            periodType: 'RELATIVE',
            specificStart: '',
            specificEnd: '',
            relativeDays: 14,
            aggregateType: 'COUNT',
            aggregateOperator: '<=',
            aggregateValue: 0,
            filters: [],
          }],
          conditionOperator: 'AND',
        },
      ],
      rulesOperator: 'AND',
      eventCondition: { eventName: '', filters: [] },
      usedCount: 1,
      createdAt: '2026-02-20T09:00:00Z',
      updatedAt: '2026-03-22T09:00:00Z',
    },
    {
      id: 6,
      name: '쿠폰 다운로드 이벤트',
      description: '쿠폰 다운로드를 감지하여 후속 액션 트리거',
      type: 'EVENT',
      rules: [],
      rulesOperator: 'AND',
      eventCondition: {
        eventName: 'download_coupon',
        filters: [],
      },
      usedCount: 0,
      createdAt: '2026-03-10T09:00:00Z',
      updatedAt: '2026-03-10T09:00:00Z',
    },
  ]
}
</script>

<style scoped>
.segment-page { max-width: 1100px; margin: 0 auto; padding: 40px 20px 60px; }

.segment-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 24px; flex-wrap: wrap; gap: 16px; }
.segment-header h1 { font-size: 24px; font-weight: 700; color: #111827; }
.desc { font-size: 14px; color: #6b7280; margin-top: 4px; }
.header-actions { display: flex; gap: 8px; }

.btn { padding: 8px 18px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; border: none; transition: all 0.15s; }
.btn-primary { background: #6366f1; color: #fff; }
.btn-primary:hover { background: #4f46e5; }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-ghost { background: transparent; color: #6b7280; border: 1px solid #e5e7eb; }
.btn-ghost:hover { background: #f9fafb; color: #374151; }
.btn-danger { background: #ef4444; color: #fff; }
.btn-danger:hover { background: #dc2626; }
.btn-danger-ghost { background: transparent; color: #ef4444; border: 1px solid #fecaca; }
.btn-danger-ghost:hover { background: #fef2f2; }
.btn-sm { padding: 5px 12px; font-size: 12px; }

/* Filter bar */
.filter-bar { display: flex; align-items: center; gap: 8px; margin-bottom: 20px; flex-wrap: wrap; }
.tab-btn { padding: 6px 14px; border-radius: 8px; font-size: 12px; font-weight: 600; border: 1px solid #e5e7eb; background: #fff; color: #6b7280; cursor: pointer; transition: all 0.15s; }
.tab-btn.active { background: #6366f1; color: #fff; border-color: #6366f1; }
.tab-btn:hover:not(.active) { background: #f9fafb; }
.filter-input { flex: 1; min-width: 180px; padding: 7px 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 13px; }

/* Empty */
.empty-state { text-align: center; padding: 60px 20px; color: #9ca3af; }
.empty-icon { font-size: 40px; display: block; margin-bottom: 10px; }

/* Segment list */
.segment-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 16px; }
.segment-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; transition: all 0.15s; }
.segment-card:hover { border-color: #c7d2fe; box-shadow: 0 2px 12px rgba(99,102,241,0.06); }

.card-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
.card-top-left { display: flex; align-items: center; gap: 8px; }
.type-badge { font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 8px; text-transform: uppercase; }
.type-badge.USER { background: #ede9fe; color: #7c3aed; }
.type-badge.EVENT { background: #fef3c7; color: #d97706; }
.card-date { font-size: 11px; color: #9ca3af; }
.used-badge { font-size: 10px; color: #059669; background: #ecfdf5; padding: 2px 8px; border-radius: 8px; font-weight: 600; }

.card-name { font-size: 16px; font-weight: 700; color: #111827; margin: 0 0 4px; }
.card-desc { font-size: 13px; color: #6b7280; margin: 0 0 12px; }

/* Condition summary */
.condition-summary { margin-bottom: 14px; padding: 10px 12px; background: #f9fafb; border-radius: 8px; display: flex; flex-direction: column; gap: 4px; }
.summary-rule { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.summary-label { font-size: 11px; font-weight: 600; color: #6b7280; }
.summary-tag { font-size: 11px; color: #374151; background: #fff; border: 1px solid #e5e7eb; padding: 2px 8px; border-radius: 4px; }
.summary-op { font-size: 10px; font-weight: 700; color: #6366f1; margin: 0 2px; }
.summary-more { font-size: 10px; color: #9ca3af; }

.card-actions { display: flex; gap: 6px; }

/* Modal */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 9000; }
.modal-panel { background: #fff; border-radius: 16px; width: 680px; max-width: 95vw; max-height: 90vh; display: flex; flex-direction: column; box-shadow: 0 20px 60px rgba(0,0,0,0.15); }
.modal-header { display: flex; align-items: center; justify-content: space-between; padding: 20px 24px 16px; border-bottom: 1px solid #f3f4f6; }
.modal-header h2 { font-size: 18px; font-weight: 700; color: #111827; }
.modal-close { background: none; border: none; font-size: 20px; color: #9ca3af; cursor: pointer; }
.modal-close:hover { color: #374151; }
.modal-body { padding: 20px 24px; overflow-y: auto; flex: 1; display: flex; flex-direction: column; gap: 18px; }
.modal-footer { padding: 16px 24px; border-top: 1px solid #f3f4f6; display: flex; justify-content: flex-end; gap: 8px; }

.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-group label { font-size: 13px; font-weight: 600; color: #374151; }
.form-input { padding: 9px 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 13px; }

/* Type selector */
.type-selector { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.type-btn { display: flex; flex-direction: column; align-items: flex-start; gap: 2px; padding: 14px 16px; border: 2px solid #e5e7eb; border-radius: 10px; background: #fff; cursor: pointer; text-align: left; transition: all 0.15s; }
.type-btn:hover:not(:disabled) { border-color: #c7d2fe; }
.type-btn.active { border-color: #6366f1; background: #eef2ff; }
.type-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.type-btn-icon { font-size: 20px; }
.type-btn-label { font-size: 14px; font-weight: 700; color: #111827; }
.type-btn-desc { font-size: 11px; color: #6b7280; }

.builder-wrap { border: 1px solid #e5e7eb; border-radius: 10px; padding: 16px; background: #fafafa; }

/* Confirm modal */
.confirm-modal { background: #fff; border-radius: 14px; padding: 28px; width: 400px; max-width: 90vw; box-shadow: 0 10px 40px rgba(0,0,0,0.15); }
.confirm-modal p { font-size: 14px; color: #374151; margin: 0 0 12px; }
.warn-text { color: #d97706; font-size: 13px; }
.confirm-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 16px; }

/* Toast */
.toast { position: fixed; bottom: 32px; left: 50%; transform: translateX(-50%); padding: 12px 28px; border-radius: 10px; font-size: 14px; font-weight: 600; color: #fff; z-index: 9999; box-shadow: 0 4px 20px rgba(0,0,0,0.15); animation: toast-in 0.3s ease; }
.toast.success { background: #059669; }
.toast.error { background: #ef4444; }
@keyframes toast-in { from { opacity: 0; transform: translateX(-50%) translateY(12px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }

@media (max-width: 768px) {
  .segment-list { grid-template-columns: 1fr; }
  .type-selector { grid-template-columns: 1fr; }
}
</style>
