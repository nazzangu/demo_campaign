<template>
  <div class="rewards-page">
    <div class="rewards-header">
      <div>
        <h1>리워드 관리</h1>
        <p class="desc">캠페인에서 제공할 쿠폰과 포인트 리워드를 관리합니다.</p>
      </div>
    </div>

    <!-- 탭 필터 -->
    <div class="tabs">
      <button class="tab" :class="{ active: filter === 'ALL' }" @click="filter = 'ALL'">
        전체 <span class="tab-badge">{{ store.rewards.length }}</span>
      </button>
      <button class="tab" :class="{ active: filter === 'COUPON' }" @click="filter = 'COUPON'">
        🎟️ 쿠폰 <span class="tab-badge">{{ couponCount }}</span>
      </button>
      <button class="tab" :class="{ active: filter === 'POINT' }" @click="filter = 'POINT'">
        💰 포인트 <span class="tab-badge">{{ pointCount }}</span>
      </button>
    </div>

    <!-- 추가 폼 -->
    <div class="add-form">
      <div class="add-row">
        <select v-model="form.type" class="input input-select">
          <option value="COUPON">🎟️ 쿠폰</option>
          <option value="POINT">💰 포인트</option>
        </select>
        <input v-model="form.name" placeholder="리워드 이름" class="input" @keyup.enter="addReward" />
        <input v-model="form.value" placeholder="값 (예: 10% 할인, 500P)" class="input" @keyup.enter="addReward" />
      </div>
      <div class="add-row">
        <input v-model="form.description" placeholder="설명 (선택)" class="input" @keyup.enter="addReward" />
        <button class="btn btn-primary" @click="addReward" :disabled="!form.name || !form.value">추가</button>
      </div>
    </div>

    <!-- 리워드 목록 -->
    <div class="reward-list">
      <div
        v-for="item in filteredRewards"
        :key="item.id"
        class="reward-card"
        :class="{ disabled: !item.enabled }"
      >
        <div class="reward-type-badge" :class="item.type.toLowerCase()">
          {{ item.type === 'COUPON' ? '🎟️ 쿠폰' : '💰 포인트' }}
        </div>
        <div class="reward-body">
          <div class="reward-top">
            <span v-if="editing !== item.id" class="reward-name">{{ item.name }}</span>
            <input v-else v-model="editBuf.name" class="input-inline" />
            <span class="reward-value-badge" :class="item.type.toLowerCase()">
              <template v-if="editing !== item.id">{{ item.value }}</template>
              <input v-else v-model="editBuf.value" class="input-inline input-sm" />
            </span>
          </div>
          <div class="reward-desc" v-if="editing !== item.id">{{ item.description || '-' }}</div>
          <input v-else v-model="editBuf.description" class="input-inline" placeholder="설명" />
        </div>
        <div class="reward-actions">
          <label class="toggle">
            <input type="checkbox" :checked="item.enabled" @change="store.updateReward(item.id, { enabled: !item.enabled })" />
            <span class="toggle-slider"></span>
          </label>
          <template v-if="editing === item.id">
            <button class="act save" @click="saveEdit(item.id)">저장</button>
            <button class="act cancel" @click="editing = null">취소</button>
          </template>
          <template v-else>
            <button class="act edit" @click="startEdit(item)">수정</button>
            <button class="act delete" @click="store.removeReward(item.id)">삭제</button>
          </template>
        </div>
      </div>
      <div v-if="!filteredRewards.length" class="empty">
        {{ filter === 'ALL' ? '등록된 리워드가 없습니다.' : (filter === 'COUPON' ? '등록된 쿠폰이 없습니다.' : '등록된 포인트가 없습니다.') }}
      </div>
    </div>

    <!-- 하단 고정 저장 바 -->
    <Transition name="slide-up">
      <div v-if="store.isDirty" class="save-bar">
        <div class="save-bar-inner">
          <span class="save-bar-text">저장하지 않은 변경사항이 있습니다.</span>
          <div class="save-bar-actions">
            <button class="btn btn-secondary" @click="handleDiscard">변경 취소</button>
            <button class="btn btn-save" @click="handleSave">
              <span v-if="saving">저장 중...</span>
              <span v-else>변경사항 저장</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 토스트 -->
    <Transition name="fade">
      <div v-if="showToast" class="toast success">{{ toastMessage }}</div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useSettingsStore } from '@/stores/settingsStore'

const store = useSettingsStore()

const filter = ref<'ALL' | 'COUPON' | 'POINT'>('ALL')

const couponCount = computed(() => store.rewards.filter((r) => r.type === 'COUPON').length)
const pointCount = computed(() => store.rewards.filter((r) => r.type === 'POINT').length)

const filteredRewards = computed(() => {
  if (filter.value === 'ALL') return store.rewards
  return store.rewards.filter((r) => r.type === filter.value)
})

const form = reactive({
  type: 'COUPON' as 'COUPON' | 'POINT',
  name: '',
  description: '',
  value: '',
})

function addReward() {
  if (!form.name || !form.value) return
  store.addReward({ type: form.type, name: form.name, description: form.description, value: form.value, enabled: true } as any)
  form.name = ''
  form.description = ''
  form.value = ''
}

const editing = ref<string | null>(null)
const editBuf = reactive({ name: '', description: '', value: '' })

function startEdit(item: any) {
  editing.value = item.id
  editBuf.name = item.name
  editBuf.description = item.description
  editBuf.value = item.value
}

function saveEdit(id: string) {
  store.updateReward(id, { name: editBuf.name, description: editBuf.description, value: editBuf.value })
  editing.value = null
}

const saving = ref(false)
const showToast = ref(false)
const toastMessage = ref('')

async function handleSave() {
  saving.value = true
  await new Promise((r) => setTimeout(r, 400))
  store.saveAll()
  saving.value = false
  toastMessage.value = '리워드 설정이 저장되었습니다.'
  showToast.value = true
  setTimeout(() => { showToast.value = false }, 2500)
}

function handleDiscard() {
  if (confirm('변경사항을 모두 취소하시겠습니까?')) {
    store.discardAll()
    toastMessage.value = '변경사항이 취소되었습니다.'
    showToast.value = true
    setTimeout(() => { showToast.value = false }, 2500)
  }
}
</script>

<style scoped>
.rewards-page { max-width: 920px; margin: 0 auto; padding: 40px 20px; flex: 1; overflow-y: auto; }

.rewards-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 24px; }
.rewards-header h1 { font-size: 24px; font-weight: 700; color: #111827; }
.desc { font-size: 14px; color: #6b7280; margin-top: 4px; }

.btn { padding: 8px 16px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; border: none; transition: all 0.15s; }
.btn-primary { background: #2563eb; color: #fff; }
.btn-primary:hover:not(:disabled) { background: #1d4ed8; }
.btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }
.btn-secondary { background: #f3f4f6; color: #374151; border: 1px solid #d1d5db; }
.btn-secondary:hover { background: #e5e7eb; }

/* Tabs */
.tabs { display: flex; gap: 0; border-bottom: 2px solid #e5e7eb; margin-bottom: 20px; }
.tab { padding: 10px 16px; background: none; border: none; font-size: 13px; font-weight: 600; color: #6b7280; cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -2px; transition: all 0.15s; white-space: nowrap; display: flex; align-items: center; gap: 6px; }
.tab:hover { color: #374151; }
.tab.active { color: #2563eb; border-bottom-color: #2563eb; }
.tab-badge { background: #e5e7eb; color: #6b7280; font-size: 11px; padding: 1px 6px; border-radius: 8px; font-weight: 700; }
.tab.active .tab-badge { background: #dbeafe; color: #2563eb; }

/* Add form */
.add-form { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px; padding: 14px; margin-bottom: 20px; }
.add-row { display: flex; gap: 8px; margin-bottom: 10px; }
.add-row:last-child { margin-bottom: 0; }
.input { flex: 1; padding: 9px 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 13px; background: #fff; }
.input:focus { outline: none; border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1); }
.input-select { flex: 0 0 auto; width: 130px; }

/* Reward list */
.reward-list { display: flex; flex-direction: column; gap: 8px; }

.reward-card { display: flex; align-items: center; gap: 14px; padding: 16px; background: #fff; border: 1px solid #e5e7eb; border-radius: 10px; transition: all 0.15s; }
.reward-card:hover { border-color: #d1d5db; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
.reward-card.disabled { opacity: 0.5; background: #f9fafb; }

.reward-type-badge { font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 8px; white-space: nowrap; flex-shrink: 0; }
.reward-type-badge.coupon { background: #fef3c7; color: #92400e; }
.reward-type-badge.point { background: #dbeafe; color: #1e40af; }

.reward-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px; }
.reward-top { display: flex; align-items: center; gap: 10px; }
.reward-name { font-size: 14px; font-weight: 600; color: #111827; }
.reward-desc { font-size: 12px; color: #6b7280; }
.reward-value-badge { display: inline-flex; align-items: center; font-size: 12px; font-weight: 700; padding: 2px 10px; border-radius: 10px; }
.reward-value-badge.coupon { background: #fef3c7; color: #92400e; }
.reward-value-badge.point { background: #dbeafe; color: #1e40af; }

.reward-actions { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }

.input-inline { padding: 4px 8px; border: 1px solid #2563eb; border-radius: 4px; font-size: 13px; }
.input-sm { width: 100px; }

/* Toggle */
.toggle { position: relative; display: inline-block; width: 40px; height: 22px; cursor: pointer; }
.toggle input { opacity: 0; width: 0; height: 0; }
.toggle-slider { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: #d1d5db; border-radius: 22px; transition: 0.2s; }
.toggle-slider::before { content: ''; position: absolute; width: 16px; height: 16px; left: 3px; bottom: 3px; background: #fff; border-radius: 50%; transition: 0.2s; }
.toggle input:checked + .toggle-slider { background: #2563eb; }
.toggle input:checked + .toggle-slider::before { transform: translateX(18px); }

.act { background: none; border: none; font-size: 12px; font-weight: 600; cursor: pointer; padding: 4px 8px; border-radius: 4px; }
.act.edit { color: #2563eb; }
.act.edit:hover { background: #eff6ff; }
.act.delete { color: #dc2626; }
.act.delete:hover { background: #fef2f2; }
.act.save { color: #059669; }
.act.save:hover { background: #ecfdf5; }
.act.cancel { color: #6b7280; }
.act.cancel:hover { background: #f3f4f6; }

.empty { text-align: center; color: #9ca3af; padding: 40px 0; font-size: 13px; }

/* Save bar */
.save-bar { position: sticky; bottom: 0; left: 0; right: 0; z-index: 50; padding: 0 0 20px; }
.save-bar-inner { display: flex; align-items: center; justify-content: space-between; padding: 14px 20px; background: #111827; border-radius: 12px; box-shadow: 0 -4px 20px rgba(0,0,0,0.15); }
.save-bar-text { font-size: 13px; color: #fbbf24; font-weight: 500; }
.save-bar-actions { display: flex; gap: 8px; }
.btn-save { background: #2563eb; color: #fff; padding: 8px 20px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; border: none; transition: background 0.15s; }
.btn-save:hover { background: #1d4ed8; }
.save-bar .btn-secondary { background: rgba(255,255,255,0.1); color: #fff; border: 1px solid rgba(255,255,255,0.2); }
.save-bar .btn-secondary:hover { background: rgba(255,255,255,0.2); }

/* Toast */
.toast { position: fixed; top: 60px; right: 24px; z-index: 100; padding: 12px 20px; border-radius: 8px; font-size: 13px; font-weight: 600; box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
.toast.success { background: #ecfdf5; color: #059669; border: 1px solid #a7f3d0; }

/* Transitions */
.slide-up-enter-active, .slide-up-leave-active { transition: all 0.3s ease; }
.slide-up-enter-from, .slide-up-leave-to { transform: translateY(100%); opacity: 0; }
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
