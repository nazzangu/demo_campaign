<template>
  <div class="ops-page">
    <div class="ops-header">
      <div>
        <h1>캠페인 운영 현황</h1>
        <p class="desc">캠페인 상태를 확인하고 시작, 일시정지, 중지할 수 있습니다.</p>
      </div>
      <div class="header-actions">
        <button class="btn btn-secondary" @click="loadCampaigns">새로고침</button>
      </div>
    </div>

    <!-- 상태 요약 카드 -->
    <div class="summary-cards">
      <div class="summary-card">
        <span class="summary-count">{{ totalCount }}</span>
        <span class="summary-label">전체</span>
      </div>
      <div class="summary-card active">
        <span class="summary-count">{{ activeCount }}</span>
        <span class="summary-label">운영 중</span>
      </div>
      <div class="summary-card paused">
        <span class="summary-count">{{ pausedCount }}</span>
        <span class="summary-label">일시정지</span>
      </div>
      <div class="summary-card draft">
        <span class="summary-count">{{ draftCount }}</span>
        <span class="summary-label">초안</span>
      </div>
      <div class="summary-card completed">
        <span class="summary-count">{{ completedCount }}</span>
        <span class="summary-label">완료</span>
      </div>
      <div class="summary-card archived">
        <span class="summary-count">{{ archivedCount }}</span>
        <span class="summary-label">폐기</span>
      </div>
    </div>

    <!-- 필터 -->
    <div class="filter-bar">
      <select v-model="statusFilter" class="filter-select">
        <option value="ALL">전체 상태</option>
        <option value="ACTIVE">운영 중</option>
        <option value="PAUSED">일시정지</option>
        <option value="DRAFT">초안</option>
        <option value="COMPLETED">완료</option>
        <option value="ARCHIVED">폐기</option>
      </select>
      <input v-model="searchQuery" class="filter-input" placeholder="캠페인명 검색..." />
    </div>

    <!-- 캠페인 테이블 -->
    <table class="ops-table">
      <thead>
        <tr>
          <th>캠페인 키</th>
          <th>캠페인명</th>
          <th>상태</th>
          <th>시작일</th>
          <th>최종 수정</th>
          <th class="col-actions">운영 관리</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="c in filteredCampaigns" :key="c.id">
          <td><code>{{ c.campaignKey }}</code></td>
          <td>
            <span class="campaign-name" @click="$router.push({ name: 'campaign-builder', params: { id: c.id } })">{{ c.name }}</span>
          </td>
          <td>
            <span class="status-badge" :class="c.status.toLowerCase()">{{ statusLabel(c.status) }}</span>
          </td>
          <td class="date-cell">{{ c.activatedAt ? formatDateTime(c.activatedAt) : '-' }}</td>
          <td class="date-cell">{{ formatDateTime(c.updatedAt) }}</td>
          <td class="col-actions">
            <div class="action-btns">
              <!-- DRAFT: 시작, 폐기 -->
              <button
                v-if="c.status === 'DRAFT'"
                class="action-btn start"
                @click="handleActivate(c)"
                :disabled="actionLoading === c.id"
              >시작</button>
              <button
                v-if="c.status === 'DRAFT'"
                class="action-btn discard"
                @click="handleDiscard(c)"
                :disabled="actionLoading === c.id"
              >폐기</button>

              <!-- ACTIVE: 일시정지, 중지 -->
              <button
                v-if="c.status === 'ACTIVE'"
                class="action-btn pause"
                @click="handlePause(c)"
                :disabled="actionLoading === c.id"
              >일시정지</button>
              <button
                v-if="c.status === 'ACTIVE'"
                class="action-btn stop"
                @click="handleStop(c)"
                :disabled="actionLoading === c.id"
              >중지</button>

              <!-- PAUSED: 재시작, 중지 -->
              <button
                v-if="c.status === 'PAUSED'"
                class="action-btn start"
                @click="handleActivate(c)"
                :disabled="actionLoading === c.id"
              >재시작</button>
              <button
                v-if="c.status === 'PAUSED'"
                class="action-btn stop"
                @click="handleStop(c)"
                :disabled="actionLoading === c.id"
              >중지</button>

              <!-- COMPLETED: 조회 -->
              <button
                v-if="c.status === 'COMPLETED'"
                class="action-btn edit"
                @click="$router.push({ name: 'campaign-builder', params: { id: c.id } })"
              >조회</button>

              <!-- ARCHIVED: 조회만 (폐기 상태) -->
              <button
                v-if="c.status === 'ARCHIVED'"
                class="action-btn edit"
                @click="$router.push({ name: 'campaign-builder', params: { id: c.id } })"
              >조회</button>
            </div>
          </td>
        </tr>
        <tr v-if="filteredCampaigns.length === 0">
          <td colspan="6" class="empty">조건에 맞는 캠페인이 없습니다.</td>
        </tr>
      </tbody>
    </table>

    <!-- 확인 모달 -->
    <Teleport to="body">
      <div v-if="confirmModal" class="modal-overlay" @click.self="confirmModal = null">
        <div class="confirm-modal">
          <h3>{{ confirmModal.title }}</h3>
          <p>{{ confirmModal.message }}</p>
          <div class="confirm-actions">
            <button class="btn btn-secondary" @click="confirmModal = null">취소</button>
            <button class="btn" :class="confirmModal.btnClass" @click="confirmModal.action()">
              {{ confirmModal.btnText }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 토스트 -->
    <Transition name="fade">
      <div v-if="toast" class="toast" :class="toast.type">{{ toast.message }}</div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { campaignApi } from '@/api/campaignApi'
import type { Campaign, CampaignStatus } from '@/types/campaign'

const campaigns = ref<Campaign[]>([])
const statusFilter = ref('ALL')
const searchQuery = ref('')
const actionLoading = ref<number | null>(null)
const toast = ref<{ type: string; message: string } | null>(null)
const confirmModal = ref<{
  title: string
  message: string
  btnText: string
  btnClass: string
  action: () => void
} | null>(null)

onMounted(loadCampaigns)

async function loadCampaigns() {
  try {
    const res = await campaignApi.list()
    campaigns.value = res.data.data
  } catch (e) {
    console.error('Failed to load campaigns:', e)
  }
}

const totalCount = computed(() => campaigns.value.length)
const activeCount = computed(() => campaigns.value.filter((c) => c.status === 'ACTIVE').length)
const pausedCount = computed(() => campaigns.value.filter((c) => c.status === 'PAUSED').length)
const draftCount = computed(() => campaigns.value.filter((c) => c.status === 'DRAFT').length)
const completedCount = computed(() => campaigns.value.filter((c) => c.status === 'COMPLETED').length)
const archivedCount = computed(() => campaigns.value.filter((c) => c.status === 'ARCHIVED').length)

const filteredCampaigns = computed(() => {
  let list = campaigns.value
  if (statusFilter.value !== 'ALL') {
    list = list.filter((c) => c.status === statusFilter.value)
  }
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter((c) =>
      c.name.toLowerCase().includes(q) || c.campaignKey.toLowerCase().includes(q),
    )
  }
  return list
})

function statusLabel(status: CampaignStatus) {
  const labels: Record<CampaignStatus, string> = {
    DRAFT: '초안', ACTIVE: '운영', PAUSED: '일시정지', COMPLETED: '완료', ARCHIVED: '폐기',
  }
  return labels[status]
}

function formatDateTime(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('ko-KR') + ' ' + d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
}

function showToast(message: string, type = 'success') {
  toast.value = { type, message }
  setTimeout(() => { toast.value = null }, 2500)
}

async function handleActivate(c: Campaign) {
  confirmModal.value = {
    title: '캠페인 시작',
    message: `"${c.name}" 캠페인을 시작하시겠습니까?`,
    btnText: '시작',
    btnClass: 'btn-start',
    action: () => doAction(c.id, 'activate', '캠페인이 시작되었습니다.'),
  }
}

async function handlePause(c: Campaign) {
  confirmModal.value = {
    title: '캠페인 일시정지',
    message: `"${c.name}" 캠페인을 일시정지하시겠습니까?\n진행 중인 발송은 완료 후 정지됩니다.`,
    btnText: '일시정지',
    btnClass: 'btn-pause',
    action: () => doAction(c.id, 'pause', '캠페인이 일시정지되었습니다.'),
  }
}

async function handleDiscard(c: Campaign) {
  confirmModal.value = {
    title: '캠페인 폐기',
    message: `"${c.name}" 캠페인을 폐기하시겠습니까?\n폐기된 캠페인은 조회만 가능합니다.`,
    btnText: '폐기',
    btnClass: 'btn-stop',
    action: async () => {
      confirmModal.value = null
      actionLoading.value = c.id
      try {
        await campaignApi.delete(c.id)
        await loadCampaigns()
        showToast('캠페인이 폐기되었습니다.')
      } catch (e) {
        showToast('폐기에 실패했습니다.', 'error')
      } finally {
        actionLoading.value = null
      }
    },
  }
}

async function handleStop(c: Campaign) {
  confirmModal.value = {
    title: '캠페인 중지',
    message: `"${c.name}" 캠페인을 중지하시겠습니까?\n중지된 캠페인은 다시 시작할 수 없습니다.`,
    btnText: '중지',
    btnClass: 'btn-stop',
    action: () => doAction(c.id, 'stop', '캠페인이 중지되었습니다.'),
  }
}

async function doAction(id: number, action: 'activate' | 'pause' | 'stop', successMsg: string) {
  confirmModal.value = null
  actionLoading.value = id
  try {
    const apiCall = action === 'activate' ? campaignApi.activate
      : action === 'pause' ? campaignApi.pause
      : campaignApi.stop
    await apiCall(id)
    await loadCampaigns()
    showToast(successMsg)
  } catch (e) {
    showToast('작업에 실패했습니다.', 'error')
  } finally {
    actionLoading.value = null
  }
}
</script>

<style scoped>
.ops-page { max-width: 1060px; margin: 0 auto; padding: 40px 20px; flex: 1; overflow-y: auto; }

.ops-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 24px; }
.ops-header h1 { font-size: 24px; font-weight: 700; color: #111827; }
.desc { font-size: 14px; color: #6b7280; margin-top: 4px; }
.header-actions { display: flex; gap: 8px; }

.btn { padding: 8px 16px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; border: none; transition: all 0.15s; }
.btn-secondary { background: #f3f4f6; color: #374151; border: 1px solid #d1d5db; }
.btn-secondary:hover { background: #e5e7eb; }
.btn-start { background: #059669; color: #fff; }
.btn-start:hover { background: #047857; }
.btn-pause { background: #d97706; color: #fff; }
.btn-pause:hover { background: #b45309; }
.btn-stop { background: #dc2626; color: #fff; }
.btn-stop:hover { background: #b91c1c; }

/* Summary */
.summary-cards { display: flex; gap: 12px; margin-bottom: 20px; }
.summary-card { flex: 1; background: #fff; border: 1px solid #e5e7eb; border-radius: 10px; padding: 16px; text-align: center; }
.summary-count { display: block; font-size: 28px; font-weight: 800; color: #111827; }
.summary-label { font-size: 12px; color: #6b7280; font-weight: 500; }
.summary-card.active { border-color: #a7f3d0; background: #ecfdf5; }
.summary-card.active .summary-count { color: #059669; }
.summary-card.paused { border-color: #fde68a; background: #fffbeb; }
.summary-card.paused .summary-count { color: #d97706; }
.summary-card.draft { border-color: #e5e7eb; }
.summary-card.draft .summary-count { color: #6b7280; }
.summary-card.completed { border-color: #bfdbfe; background: #eff6ff; }
.summary-card.completed .summary-count { color: #2563eb; }
.summary-card.archived { border-color: #e5e7eb; background: #f9fafb; }
.summary-card.archived .summary-count { color: #9ca3af; }

/* Filter */
.filter-bar { display: flex; gap: 10px; margin-bottom: 16px; }
.filter-select { padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 13px; background: #fff; }
.filter-input { flex: 1; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 13px; }
.filter-input:focus { outline: none; border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }

/* Table */
.ops-table { width: 100%; border-collapse: collapse; background: #fff; border: 1px solid #e5e7eb; border-radius: 10px; overflow: hidden; }
.ops-table thead { background: #f9fafb; }
.ops-table th { padding: 12px 16px; text-align: left; font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.03em; border-bottom: 1px solid #e5e7eb; }
.ops-table td { padding: 14px 16px; font-size: 13px; color: #374151; border-bottom: 1px solid #f3f4f6; }
.ops-table tr:last-child td { border-bottom: none; }
.ops-table code { background: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-size: 11px; color: #6b7280; }
.col-actions { width: 180px; text-align: right; }

.campaign-name { color: #2563eb; cursor: pointer; font-weight: 500; }
.campaign-name:hover { text-decoration: underline; }
.date-cell { font-size: 12px; color: #9ca3af; white-space: nowrap; }

.status-badge { font-size: 11px; font-weight: 600; padding: 3px 10px; border-radius: 10px; }
.status-badge.draft { background: #f3f4f6; color: #6b7280; }
.status-badge.active { background: #ecfdf5; color: #059669; }
.status-badge.paused { background: #fffbeb; color: #d97706; }
.status-badge.completed { background: #eff6ff; color: #2563eb; }
.status-badge.archived { background: #f3f4f6; color: #9ca3af; }

.action-btns { display: flex; gap: 4px; justify-content: flex-end; }
.action-btn { padding: 5px 12px; border: none; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.15s; }
.action-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.action-btn.start { background: #ecfdf5; color: #059669; }
.action-btn.start:hover:not(:disabled) { background: #d1fae5; }
.action-btn.pause { background: #fffbeb; color: #d97706; }
.action-btn.pause:hover:not(:disabled) { background: #fef3c7; }
.action-btn.stop { background: #fef2f2; color: #dc2626; }
.action-btn.stop:hover:not(:disabled) { background: #fee2e2; }
.action-btn.discard { background: #f3f4f6; color: #6b7280; }
.action-btn.discard:hover:not(:disabled) { background: #e5e7eb; }
.action-btn.edit { background: #eff6ff; color: #2563eb; }
.action-btn.edit:hover { background: #dbeafe; }

.empty { text-align: center; color: #9ca3af; padding: 40px 0 !important; }

/* Confirm modal */
.modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.4); z-index: 1000; display: flex; align-items: center; justify-content: center; }
.confirm-modal { background: #fff; border-radius: 14px; width: 400px; padding: 24px; box-shadow: 0 20px 60px rgba(0,0,0,0.2); }
.confirm-modal h3 { font-size: 16px; font-weight: 700; color: #111827; margin: 0 0 8px; }
.confirm-modal p { font-size: 13px; color: #6b7280; margin: 0 0 20px; white-space: pre-line; line-height: 1.5; }
.confirm-actions { display: flex; gap: 8px; justify-content: flex-end; }

/* Toast */
.toast { position: fixed; top: 60px; right: 24px; z-index: 200; padding: 12px 20px; border-radius: 8px; font-size: 13px; font-weight: 600; box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
.toast.success { background: #ecfdf5; color: #059669; border: 1px solid #a7f3d0; }
.toast.error { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
