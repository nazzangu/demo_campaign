<template>
  <div class="settings-page">
    <div class="settings-header">
      <div>
        <h1>캠페인 설정 관리</h1>
        <p class="desc">캠페인 빌더에서 사용하는 이벤트, 속성, 채널, 템플릿 등을 관리합니다.</p>
      </div>
      <div class="header-actions">
        <button class="btn btn-danger" @click="handleReset">전체 초기화</button>
      </div>
    </div>

    <!-- Tabs -->
    <div class="tabs">
      <button v-for="tab in TABS" :key="tab.key" class="tab" :class="{ active: activeTab === tab.key }" @click="activeTab = tab.key">
        {{ tab.label }}
        <span class="tab-badge" v-if="tab.count">{{ tab.count }}</span>
      </button>
    </div>

    <!-- ═══ 이벤트 관리 ═══ -->
    <div v-if="activeTab === 'events'" class="tab-content">
      <div class="content-desc">세그먼트 조건 및 전환 추적에 사용할 이벤트 목록을 관리합니다.</div>
      <div class="add-row">
        <input v-model="forms.event.name" placeholder="이벤트 코드 (예: order_complete)" class="input" @keyup.enter="addEvent" />
        <input v-model="forms.event.label" placeholder="표시 이름 (예: 구매)" class="input" @keyup.enter="addEvent" />
        <button class="btn btn-primary" @click="addEvent" :disabled="!forms.event.name || !forms.event.label">추가</button>
      </div>
      <table class="data-table">
        <thead><tr><th>이벤트 코드</th><th>표시 이름</th><th class="col-act">관리</th></tr></thead>
        <tbody>
          <tr v-for="item in store.events" :key="item.id">
            <td><code>{{ item.name }}</code></td>
            <td>
              <input v-if="editing === item.id" v-model="editBuf.label" class="input-cell" />
              <span v-else>{{ item.label }}</span>
            </td>
            <td class="col-act">
              <template v-if="editing === item.id">
                <button class="act save" @click="store.updateEvent(item.id, editBuf.name, editBuf.label); editing = null">저장</button>
                <button class="act cancel" @click="editing = null">취소</button>
              </template>
              <template v-else>
                <button class="act edit" @click="startEdit(item)">수정</button>
                <button class="act delete" @click="store.removeEvent(item.id)">삭제</button>
              </template>
            </td>
          </tr>
          <tr v-if="!store.events.length"><td colspan="3" class="empty">등록된 이벤트가 없습니다.</td></tr>
        </tbody>
      </table>
    </div>

    <!-- ═══ 속성 관리 ═══ -->
    <div v-if="activeTab === 'properties'" class="tab-content">
      <div class="content-desc">이벤트 필터 조건에 사용할 속성 목록을 관리합니다.</div>
      <div class="add-row">
        <input v-model="forms.prop.name" placeholder="속성 코드 (예: category_id)" class="input" @keyup.enter="addProp" />
        <input v-model="forms.prop.label" placeholder="표시 이름 (예: 카테고리 ID)" class="input" @keyup.enter="addProp" />
        <button class="btn btn-primary" @click="addProp" :disabled="!forms.prop.name || !forms.prop.label">추가</button>
      </div>
      <table class="data-table">
        <thead><tr><th>속성 코드</th><th>표시 이름</th><th class="col-act">관리</th></tr></thead>
        <tbody>
          <tr v-for="item in store.properties" :key="item.id">
            <td><code>{{ item.name }}</code></td>
            <td>
              <input v-if="editing === item.id" v-model="editBuf.label" class="input-cell" />
              <span v-else>{{ item.label }}</span>
            </td>
            <td class="col-act">
              <template v-if="editing === item.id">
                <button class="act save" @click="store.updateProperty(item.id, editBuf.name, editBuf.label); editing = null">저장</button>
                <button class="act cancel" @click="editing = null">취소</button>
              </template>
              <template v-else>
                <button class="act edit" @click="startEdit(item)">수정</button>
                <button class="act delete" @click="store.removeProperty(item.id)">삭제</button>
              </template>
            </td>
          </tr>
          <tr v-if="!store.properties.length"><td colspan="3" class="empty">등록된 속성이 없습니다.</td></tr>
        </tbody>
      </table>
    </div>

    <!-- ═══ 푸시 앱 관리 ═══ -->
    <div v-if="activeTab === 'pushApps'" class="tab-content">
      <div class="content-desc">푸시 메시지 발송에 사용할 앱을 관리합니다.</div>
      <div class="add-row">
        <input v-model="forms.app.appKey" placeholder="앱 키 (예: app_main)" class="input" />
        <input v-model="forms.app.label" placeholder="앱 이름 (예: 쇼핑 앱)" class="input" />
        <select v-model="forms.app.platform" class="input input-select">
          <option value="ALL">전체</option>
          <option value="ANDROID">Android</option>
          <option value="IOS">iOS</option>
        </select>
        <button class="btn btn-primary" @click="addApp" :disabled="!forms.app.appKey || !forms.app.label">추가</button>
      </div>
      <table class="data-table">
        <thead><tr><th>앱 키</th><th>앱 이름</th><th>플랫폼</th><th class="col-act">관리</th></tr></thead>
        <tbody>
          <tr v-for="item in store.pushApps" :key="item.id">
            <td><code>{{ item.appKey }}</code></td>
            <td>{{ item.label }}</td>
            <td><span class="badge" :class="item.platform.toLowerCase()">{{ platformLabel(item.platform) }}</span></td>
            <td class="col-act">
              <button class="act delete" @click="store.removePushApp(item.id)">삭제</button>
            </td>
          </tr>
          <tr v-if="!store.pushApps.length"><td colspan="4" class="empty">등록된 푸시 앱이 없습니다.</td></tr>
        </tbody>
      </table>
    </div>

    <!-- ═══ 개인화 변수 관리 ═══ -->
    <div v-if="activeTab === 'vars'" class="tab-content">
      <div class="content-desc">메시지 내용에 삽입할 수 있는 개인화 변수를 관리합니다.</div>
      <div class="add-row">
        <input v-model="forms.pvar.name" placeholder="변수 코드 (예: user_name)" class="input" />
        <input v-model="forms.pvar.label" placeholder="표시 이름 (예: 사용자 이름)" class="input" />
        <input v-model="forms.pvar.sampleValue" placeholder="샘플 값 (예: 홍길동)" class="input" />
        <button class="btn btn-primary" @click="addVar" :disabled="!forms.pvar.name || !forms.pvar.label">추가</button>
      </div>
      <table class="data-table">
        <thead><tr><th>변수 코드</th><th>표시 이름</th><th>샘플 값</th><th class="col-act">관리</th></tr></thead>
        <tbody>
          <tr v-for="item in store.personalizationVars" :key="item.id">
            <td><code>{{ item.name }}</code></td>
            <td>{{ item.label }}</td>
            <td class="sample">{{ item.sampleValue }}</td>
            <td class="col-act">
              <button class="act delete" @click="store.removeVar(item.id)">삭제</button>
            </td>
          </tr>
          <tr v-if="!store.personalizationVars.length"><td colspan="4" class="empty">등록된 변수가 없습니다.</td></tr>
        </tbody>
      </table>
    </div>

    <!-- ═══ 채널 관리 ═══ -->
    <div v-if="activeTab === 'channels'" class="tab-content">
      <div class="content-desc">캠페인 빌더에서 사용할 채널을 설정합니다. 비활성화된 채널은 사이드바에 표시되지 않습니다.</div>
      <div class="channel-list">
        <div v-for="ch in store.channels" :key="ch.id" class="channel-card" :class="{ disabled: !ch.enabled }">
          <div class="channel-left">
            <span class="channel-icon" :style="{ color: ch.color }">{{ ch.icon }}</span>
            <div class="channel-info">
              <div class="channel-label">{{ ch.label }}</div>
              <code class="channel-type">{{ ch.type }}</code>
            </div>
          </div>
          <div class="channel-right">
            <input
              type="color"
              :value="ch.color"
              class="color-picker"
              @input="store.updateChannel(ch.id, { color: ($event.target as HTMLInputElement).value })"
            />
            <label class="toggle">
              <input type="checkbox" :checked="ch.enabled" @change="store.updateChannel(ch.id, { enabled: !ch.enabled })" />
              <span class="toggle-slider"></span>
            </label>
          </div>
        </div>
      </div>
    </div>

    <!-- ═══ 리워드 유형 관리 ═══ -->
    <div v-if="activeTab === 'rewardTypes'" class="tab-content">
      <div class="content-desc">캠페인 빌더에서 사용할 리워드 유형을 설정합니다. 비활성화된 유형은 사이드바에 표시되지 않습니다.</div>
      <div class="channel-list">
        <div v-for="rt in store.rewardTypes" :key="rt.id" class="channel-card" :class="{ disabled: !rt.enabled }">
          <div class="channel-left">
            <span class="channel-icon" :style="{ color: rt.color }">{{ rt.icon }}</span>
            <div class="channel-info">
              <div class="channel-label">{{ rt.label }}</div>
              <code class="channel-type">{{ rt.type }}</code>
            </div>
          </div>
          <div class="channel-right">
            <input
              type="color"
              :value="rt.color"
              class="color-picker"
              @input="store.updateRewardType(rt.id, { color: ($event.target as HTMLInputElement).value })"
            />
            <label class="toggle">
              <input type="checkbox" :checked="rt.enabled" @change="store.updateRewardType(rt.id, { enabled: !rt.enabled })" />
              <span class="toggle-slider"></span>
            </label>
          </div>
        </div>
      </div>
    </div>

    <!-- ═══ 리워드 관리 ═══ -->
    <div v-if="activeTab === 'rewards'" class="tab-content">
      <div class="content-desc">캠페인에서 제공할 쿠폰과 포인트 리워드를 관리합니다.</div>
      <div class="reward-add-form">
        <div class="add-row">
          <select v-model="forms.reward.type" class="input input-select">
            <option value="COUPON">🎟️ 쿠폰</option>
            <option value="POINT">💰 포인트</option>
          </select>
          <input v-model="forms.reward.name" placeholder="리워드 이름 (예: 신규 가입 쿠폰)" class="input" @keyup.enter="addReward" />
          <input v-model="forms.reward.value" placeholder="값 (예: 10% 할인, 500P)" class="input" @keyup.enter="addReward" />
        </div>
        <div class="add-row">
          <input v-model="forms.reward.description" placeholder="설명 (예: 신규 회원 가입 시 지급되는 할인 쿠폰)" class="input" @keyup.enter="addReward" />
          <button class="btn btn-primary" @click="addReward" :disabled="!forms.reward.name || !forms.reward.value">추가</button>
        </div>
      </div>

      <div class="reward-section" v-if="store.rewards.filter(r => r.type === 'COUPON').length">
        <h4 class="reward-section-title">🎟️ 쿠폰</h4>
        <div class="reward-list">
          <div v-for="item in store.rewards.filter(r => r.type === 'COUPON')" :key="item.id" class="reward-card" :class="{ disabled: !item.enabled }">
            <div class="reward-left">
              <div class="reward-name">{{ item.name }}</div>
              <div class="reward-desc">{{ item.description }}</div>
              <div class="reward-value">
                <span class="reward-value-badge coupon">{{ item.value }}</span>
              </div>
            </div>
            <div class="reward-right">
              <label class="toggle">
                <input type="checkbox" :checked="item.enabled" @change="store.updateReward(item.id, { enabled: !item.enabled })" />
                <span class="toggle-slider"></span>
              </label>
              <button class="act delete" @click="store.removeReward(item.id)">삭제</button>
            </div>
          </div>
        </div>
      </div>

      <div class="reward-section" v-if="store.rewards.filter(r => r.type === 'POINT').length">
        <h4 class="reward-section-title">💰 포인트</h4>
        <div class="reward-list">
          <div v-for="item in store.rewards.filter(r => r.type === 'POINT')" :key="item.id" class="reward-card" :class="{ disabled: !item.enabled }">
            <div class="reward-left">
              <div class="reward-name">{{ item.name }}</div>
              <div class="reward-desc">{{ item.description }}</div>
              <div class="reward-value">
                <span class="reward-value-badge point">{{ item.value }}</span>
              </div>
            </div>
            <div class="reward-right">
              <label class="toggle">
                <input type="checkbox" :checked="item.enabled" @change="store.updateReward(item.id, { enabled: !item.enabled })" />
                <span class="toggle-slider"></span>
              </label>
              <button class="act delete" @click="store.removeReward(item.id)">삭제</button>
            </div>
          </div>
        </div>
      </div>

      <div v-if="!store.rewards.length" class="empty-box">등록된 리워드가 없습니다.</div>
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

    <!-- 저장 완료 토스트 -->
    <Transition name="fade">
      <div v-if="showToast" class="toast" :class="toastType">{{ toastMessage }}</div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useSettingsStore } from '@/stores/settingsStore'

const store = useSettingsStore()

type TabKey = 'events' | 'properties' | 'pushApps' | 'vars' | 'channels' | 'rewardTypes' | 'rewards'
const activeTab = ref<TabKey>('events')

const TABS = computed(() => [
  { key: 'events' as TabKey, label: '이벤트', count: store.events.length },
  { key: 'properties' as TabKey, label: '속성', count: store.properties.length },
  { key: 'pushApps' as TabKey, label: '푸시 앱', count: store.pushApps.length },
  { key: 'vars' as TabKey, label: '개인화 변수', count: store.personalizationVars.length },
  { key: 'channels' as TabKey, label: '채널', count: store.channels.filter((c) => c.enabled).length },
  { key: 'rewardTypes' as TabKey, label: '리워드 유형', count: store.rewardTypes.filter((r) => r.enabled).length },
  { key: 'rewards' as TabKey, label: '리워드 항목', count: store.rewards.filter((r) => r.enabled).length },
])

// ── Edit state ──
const editing = ref<string | null>(null)
const editBuf = reactive({ name: '', label: '' })

function startEdit(item: { id: string; name: string; label: string }) {
  editing.value = item.id
  editBuf.name = item.name
  editBuf.label = item.label
}

// ── Forms ──
const forms = reactive({
  event: { name: '', label: '' },
  prop: { name: '', label: '' },
  app: { appKey: '', label: '', platform: 'ALL' as 'ALL' | 'ANDROID' | 'IOS' },
  pvar: { name: '', label: '', sampleValue: '' },
  reward: { type: 'COUPON' as 'COUPON' | 'POINT', name: '', description: '', value: '' },
})

function addEvent() {
  if (!forms.event.name || !forms.event.label) return
  store.addEvent(forms.event.name, forms.event.label)
  forms.event.name = ''
  forms.event.label = ''
}

function addProp() {
  if (!forms.prop.name || !forms.prop.label) return
  store.addProperty(forms.prop.name, forms.prop.label)
  forms.prop.name = ''
  forms.prop.label = ''
}

function addApp() {
  if (!forms.app.appKey || !forms.app.label) return
  store.addPushApp({ appKey: forms.app.appKey, label: forms.app.label, platform: forms.app.platform })
  forms.app.appKey = ''
  forms.app.label = ''
  forms.app.platform = 'ALL'
}

function addVar() {
  if (!forms.pvar.name || !forms.pvar.label) return
  store.addVar({ name: forms.pvar.name, label: forms.pvar.label, sampleValue: forms.pvar.sampleValue })
  forms.pvar.name = ''
  forms.pvar.label = ''
  forms.pvar.sampleValue = ''
}

function addReward() {
  if (!forms.reward.name || !forms.reward.value) return
  store.addReward({ type: forms.reward.type, name: forms.reward.name, description: forms.reward.description, value: forms.reward.value, enabled: true } as any)
  forms.reward.name = ''
  forms.reward.description = ''
  forms.reward.value = ''
  forms.reward.type = 'COUPON'
}

function platformLabel(p: string) {
  return p === 'ALL' ? '전체' : p
}

// ── Save / Discard ──
const saving = ref(false)
const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref<'success' | 'error'>('success')

function showToastMsg(msg: string, type: 'success' | 'error' = 'success') {
  toastMessage.value = msg
  toastType.value = type
  showToast.value = true
  setTimeout(() => { showToast.value = false }, 2500)
}

async function handleSave() {
  saving.value = true
  await new Promise((r) => setTimeout(r, 400))
  store.saveAll()
  saving.value = false
  showToastMsg('설정이 저장되었습니다.')
}

function handleDiscard() {
  if (confirm('변경사항을 모두 취소하시겠습니까?')) {
    store.discardAll()
    showToastMsg('변경사항이 취소되었습니다.')
  }
}

function handleReset() {
  if (confirm('모든 설정을 초기 상태로 되돌리시겠습니까?')) {
    store.resetToDefaults()
    showToastMsg('초기 상태로 복원되었습니다.')
  }
}
</script>

<style scoped>
.settings-page { max-width: 920px; margin: 0 auto; padding: 40px 20px; flex: 1; overflow-y: auto; }

.settings-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 24px; }
.settings-header h1 { font-size: 24px; font-weight: 700; color: #111827; }
.desc { font-size: 14px; color: #6b7280; margin-top: 4px; }
.header-actions { display: flex; gap: 8px; flex-shrink: 0; }

.btn { padding: 8px 16px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; border: none; transition: all 0.15s; }
.btn-primary { background: #2563eb; color: #fff; }
.btn-primary:hover:not(:disabled) { background: #1d4ed8; }
.btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }
.btn-secondary { background: #f3f4f6; color: #374151; border: 1px solid #d1d5db; }
.btn-secondary:hover { background: #e5e7eb; }
.btn-danger { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
.btn-danger:hover { background: #fee2e2; }

/* Tabs */
.tabs { display: flex; gap: 0; border-bottom: 2px solid #e5e7eb; margin-bottom: 20px; overflow-x: auto; }
.tab { padding: 10px 16px; background: none; border: none; font-size: 13px; font-weight: 600; color: #6b7280; cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -2px; transition: all 0.15s; white-space: nowrap; display: flex; align-items: center; gap: 6px; }
.tab:hover { color: #374151; }
.tab.active { color: #2563eb; border-bottom-color: #2563eb; }
.tab-badge { background: #e5e7eb; color: #6b7280; font-size: 11px; padding: 1px 6px; border-radius: 8px; font-weight: 700; }
.tab.active .tab-badge { background: #dbeafe; color: #2563eb; }

.content-desc { font-size: 13px; color: #9ca3af; margin-bottom: 14px; }

/* Add row */
.add-row { display: flex; gap: 8px; margin-bottom: 10px; }
.input { flex: 1; padding: 9px 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 13px; background: #fff; }
.input:focus { outline: none; border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1); }
.input-select { flex: 0 0 auto; width: 120px; }
.textarea-sm { resize: vertical; font-family: inherit; min-height: 44px; }

/* Table */
.data-table { width: 100%; border-collapse: collapse; background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; }
.data-table thead { background: #f9fafb; }
.data-table th { padding: 10px 14px; text-align: left; font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.03em; border-bottom: 1px solid #e5e7eb; }
.data-table td { padding: 10px 14px; font-size: 13px; color: #374151; border-bottom: 1px solid #f3f4f6; }
.data-table tr:last-child td { border-bottom: none; }
.data-table code { background: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-size: 12px; color: #1f2937; }
.col-act { width: 120px; text-align: right; }
.input-cell { width: 100%; padding: 5px 8px; border: 1px solid #2563eb; border-radius: 4px; font-size: 13px; }
.sample { color: #9ca3af; font-size: 12px; }
.empty { text-align: center; color: #9ca3af; padding: 30px 0 !important; }

.act { background: none; border: none; font-size: 12px; font-weight: 600; cursor: pointer; padding: 4px 8px; border-radius: 4px; }
.act.edit { color: #2563eb; }
.act.edit:hover { background: #eff6ff; }
.act.delete { color: #dc2626; }
.act.delete:hover { background: #fef2f2; }
.act.save { color: #059669; }
.act.save:hover { background: #ecfdf5; }
.act.cancel { color: #6b7280; }
.act.cancel:hover { background: #f3f4f6; }

.badge { font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 10px; }
.badge.all { background: #eff6ff; color: #2563eb; }
.badge.android { background: #ecfdf5; color: #059669; }
.badge.ios { background: #f3f4f6; color: #6b7280; }

/* Channel cards */
.channel-list { display: flex; flex-direction: column; gap: 8px; }
.channel-card { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; background: #fff; border: 1px solid #e5e7eb; border-radius: 10px; transition: all 0.15s; }
.channel-card.disabled { opacity: 0.5; background: #f9fafb; }
.channel-left { display: flex; align-items: center; gap: 12px; }
.channel-icon { font-size: 24px; }
.channel-info { display: flex; flex-direction: column; gap: 2px; }
.channel-label { font-size: 14px; font-weight: 600; color: #111827; }
.channel-type { font-size: 11px; background: #f3f4f6; padding: 1px 6px; border-radius: 4px; color: #6b7280; width: fit-content; }
.channel-right { display: flex; align-items: center; gap: 12px; }
.color-picker { width: 32px; height: 32px; border: 2px solid #e5e7eb; border-radius: 8px; cursor: pointer; padding: 0; background: none; }

/* Toggle switch */
.toggle { position: relative; display: inline-block; width: 40px; height: 22px; cursor: pointer; }
.toggle input { opacity: 0; width: 0; height: 0; }
.toggle-slider { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: #d1d5db; border-radius: 22px; transition: 0.2s; }
.toggle-slider::before { content: ''; position: absolute; width: 16px; height: 16px; left: 3px; bottom: 3px; background: #fff; border-radius: 50%; transition: 0.2s; }
.toggle input:checked + .toggle-slider { background: #2563eb; }
.toggle input:checked + .toggle-slider::before { transform: translateX(18px); }

/* Templates */
.tpl-add-form { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px; padding: 14px; margin-bottom: 16px; }
.tpl-add-form .add-row:last-child { margin-bottom: 0; }
.tpl-group { margin-bottom: 16px; }
.tpl-group-title { font-size: 13px; font-weight: 700; color: #374151; margin-bottom: 8px; }
.tpl-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px 14px; margin-bottom: 6px; }
.tpl-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
.tpl-name { font-size: 13px; font-weight: 600; color: #111827; }
.tpl-title { font-size: 12px; color: #374151; font-weight: 500; margin-bottom: 2px; }
.tpl-body { font-size: 12px; color: #6b7280; line-height: 1.4; }
.empty-box { text-align: center; color: #9ca3af; padding: 30px 0; font-size: 13px; }

/* Rewards */
.reward-add-form { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px; padding: 14px; margin-bottom: 16px; }
.reward-add-form .add-row:last-child { margin-bottom: 0; }
.reward-section { margin-bottom: 20px; }
.reward-section-title { font-size: 14px; font-weight: 700; color: #374151; margin-bottom: 10px; }
.reward-list { display: flex; flex-direction: column; gap: 8px; }
.reward-card { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; background: #fff; border: 1px solid #e5e7eb; border-radius: 10px; transition: all 0.15s; }
.reward-card.disabled { opacity: 0.5; background: #f9fafb; }
.reward-left { display: flex; flex-direction: column; gap: 4px; flex: 1; min-width: 0; }
.reward-name { font-size: 14px; font-weight: 600; color: #111827; }
.reward-desc { font-size: 12px; color: #6b7280; }
.reward-value { margin-top: 2px; }
.reward-value-badge { display: inline-block; font-size: 12px; font-weight: 700; padding: 2px 10px; border-radius: 10px; }
.reward-value-badge.coupon { background: #fef3c7; color: #92400e; }
.reward-value-badge.point { background: #dbeafe; color: #1e40af; }
.reward-right { display: flex; align-items: center; gap: 12px; flex-shrink: 0; }

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
.toast.error { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }

/* Transitions */
.slide-up-enter-active, .slide-up-leave-active { transition: all 0.3s ease; }
.slide-up-enter-from, .slide-up-leave-to { transform: translateY(100%); opacity: 0; }
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
