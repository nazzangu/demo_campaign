<template>
  <div class="templates-page">
    <div class="templates-header">
      <div>
        <h1>템플릿 관리</h1>
        <p class="desc">채널별 메시지 템플릿을 등록하고 캠페인에서 재사용할 수 있습니다.</p>
      </div>
    </div>

    <!-- 추가 폼 -->
    <div class="tpl-add-form">
      <div class="add-row">
        <select v-model="form.channelType" class="input input-select">
          <option value="">채널 선택</option>
          <option v-for="ch in store.channels" :key="ch.id" :value="ch.type">{{ ch.icon }} {{ ch.label }}</option>
        </select>
        <input v-model="form.name" placeholder="템플릿 이름" class="input" @keyup.enter="addTemplate" />
        <button class="btn btn-primary" @click="addTemplate" :disabled="!form.channelType || !form.name">추가</button>
      </div>
    </div>

    <!-- 채널별 템플릿 목록 -->
    <div v-for="ch in channelsWithTemplates" :key="ch.type" class="tpl-group">
      <h4 class="tpl-group-title">{{ ch.icon }} {{ ch.label }}</h4>
      <div v-for="tpl in getTemplatesByChannel(ch.type)" :key="tpl.id" class="tpl-card" @click="openConfig(tpl)">
        <div class="tpl-left">
          <div class="tpl-name">{{ tpl.name }}</div>
          <div class="tpl-meta">
            <span class="tpl-badge" :class="{ configured: tpl.channelConfig }">
              {{ tpl.channelConfig ? '설정 완료' : '미설정' }}
            </span>
            <span v-if="tpl.title" class="tpl-title-preview">{{ tpl.title }}</span>
          </div>
        </div>
        <div class="tpl-right">
          <button class="act edit" @click.stop="openConfig(tpl)">설정</button>
          <button class="act delete" @click.stop="store.removeTemplate(tpl.id)">삭제</button>
        </div>
      </div>
    </div>
    <div v-if="!store.templates.length" class="empty-box">등록된 템플릿이 없습니다.</div>

    <!-- ═══ 채널별 설정 모달 ═══ -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="modalTpl" class="modal-overlay" @click.self="closeModal">
          <div class="modal-container">
            <div class="modal-header">
              <span class="modal-icon">{{ getChannelIcon(modalTpl.channelType) }}</span>
              <div class="modal-header-info">
                <h3>{{ getChannelLabel(modalTpl.channelType) }}</h3>
                <span class="modal-tpl-name">{{ modalTpl.name }}</span>
              </div>
              <div class="modal-header-actions">
                <button class="btn btn-secondary btn-sm" @click="closeModal">취소</button>
                <button class="btn btn-primary btn-sm" @click="saveConfig">확인</button>
              </div>
            </div>
            <div class="modal-body">
              <PushConfigForm
                v-if="modalTpl.channelType === 'CHANNEL_PUSH'"
                :config="modalConfig"
                @update="onConfigUpdate"
              />
              <SmsConfigForm
                v-if="modalTpl.channelType === 'CHANNEL_SMS'"
                :config="modalConfig"
                @update="onConfigUpdate"
              />
              <KakaoConfigForm
                v-if="modalTpl.channelType === 'CHANNEL_KAKAO'"
                :config="modalConfig"
                @update="onConfigUpdate"
              />
              <div
                v-if="!['CHANNEL_PUSH','CHANNEL_SMS','CHANNEL_KAKAO'].includes(modalTpl.channelType)"
                class="generic-form"
              >
                <div class="form-group">
                  <label>메시지 제목</label>
                  <input type="text" class="input" :value="modalConfig.title || ''" @input="onGenericField('title', $event)" />
                </div>
                <div class="form-group">
                  <label>메시지 내용</label>
                  <textarea class="input textarea" rows="6" :value="modalConfig.body || ''" @input="onGenericField('body', $event)"></textarea>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

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
import type { TemplateItem } from '@/stores/settingsStore'
import PushConfigForm from '@/components/config-panels/PushConfigForm.vue'
import SmsConfigForm from '@/components/config-panels/SmsConfigForm.vue'
import KakaoConfigForm from '@/components/config-panels/KakaoConfigForm.vue'

const store = useSettingsStore()

// ── 추가 ──
const form = reactive({ channelType: '', name: '' })

function addTemplate() {
  if (!form.channelType || !form.name) return
  store.addTemplate({ channelType: form.channelType, name: form.name, title: '', body: '' } as any)
  form.name = ''
}

// ── 목록 ──
const channelsWithTemplates = computed(() => {
  const types = new Set(store.templates.map((t) => t.channelType))
  return store.channels.filter((c) => types.has(c.type))
})

function getTemplatesByChannel(type: string) {
  return store.templates.filter((t) => t.channelType === type)
}

function getChannelIcon(type: string) {
  return store.channels.find((c) => c.type === type)?.icon || '📨'
}

function getChannelLabel(type: string) {
  return store.channels.find((c) => c.type === type)?.label || type
}

// ── 설정 모달 ──
const modalTpl = ref<TemplateItem | null>(null)
const modalConfig = reactive<Record<string, any>>({})

function openConfig(tpl: TemplateItem) {
  modalTpl.value = tpl
  // 기존 저장된 channelConfig가 있으면 복원, 없으면 기본값
  const saved = tpl.channelConfig || {}
  Object.keys(modalConfig).forEach((k) => delete modalConfig[k])
  Object.assign(modalConfig, {
    title: tpl.title,
    body: tpl.body,
    ...saved,
  })
}

function onConfigUpdate(config: any) {
  Object.keys(modalConfig).forEach((k) => delete modalConfig[k])
  Object.assign(modalConfig, config)
}

function onGenericField(field: string, e: Event) {
  modalConfig[field] = (e.target as HTMLInputElement).value
}

function saveConfig() {
  if (!modalTpl.value) return
  const { title, body, ...rest } = modalConfig
  store.updateTemplate(modalTpl.value.id, {
    title: title || modalTpl.value.title,
    body: body || modalTpl.value.body,
    channelConfig: { ...rest, title, body },
  })
  modalTpl.value = null
  showToastMsg('템플릿 설정이 저장되었습니다.')
}

function closeModal() {
  modalTpl.value = null
}

// ── 저장 ──
const saving = ref(false)
const showToast = ref(false)
const toastMessage = ref('')

function showToastMsg(msg: string) {
  toastMessage.value = msg
  showToast.value = true
  setTimeout(() => { showToast.value = false }, 2500)
}

async function handleSave() {
  saving.value = true
  await new Promise((r) => setTimeout(r, 400))
  store.saveAll()
  saving.value = false
  showToastMsg('템플릿이 저장되었습니다.')
}

function handleDiscard() {
  if (confirm('변경사항을 모두 취소하시겠습니까?')) {
    store.discardAll()
    showToastMsg('변경사항이 취소되었습니다.')
  }
}
</script>

<style scoped>
.templates-page { max-width: 920px; margin: 0 auto; padding: 40px 20px; flex: 1; overflow-y: auto; }

.templates-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 24px; }
.templates-header h1 { font-size: 24px; font-weight: 700; color: #111827; }
.desc { font-size: 14px; color: #6b7280; margin-top: 4px; }

.btn { padding: 8px 16px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; border: none; transition: all 0.15s; }
.btn-sm { padding: 6px 14px; font-size: 12px; }
.btn-primary { background: #2563eb; color: #fff; }
.btn-primary:hover:not(:disabled) { background: #1d4ed8; }
.btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }
.btn-secondary { background: #f3f4f6; color: #374151; border: 1px solid #d1d5db; }
.btn-secondary:hover { background: #e5e7eb; }

/* Add form */
.tpl-add-form { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px; padding: 14px; margin-bottom: 24px; }
.add-row { display: flex; gap: 8px; }
.input { flex: 1; padding: 9px 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 13px; background: #fff; }
.input:focus { outline: none; border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1); }
.input-select { flex: 0 0 auto; width: 160px; }

/* Template group */
.tpl-group { margin-bottom: 20px; }
.tpl-group-title { font-size: 14px; font-weight: 700; color: #374151; margin-bottom: 10px; }

.tpl-card { display: flex; align-items: center; justify-content: space-between; background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 14px 16px; margin-bottom: 8px; cursor: pointer; transition: all 0.15s; }
.tpl-card:hover { border-color: #93c5fd; background: #f0f7ff; }
.tpl-left { display: flex; flex-direction: column; gap: 4px; flex: 1; min-width: 0; }
.tpl-name { font-size: 14px; font-weight: 600; color: #111827; }
.tpl-meta { display: flex; align-items: center; gap: 8px; }
.tpl-badge { font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 6px; background: #fef3c7; color: #92400e; }
.tpl-badge.configured { background: #ecfdf5; color: #059669; }
.tpl-title-preview { font-size: 12px; color: #6b7280; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.tpl-right { display: flex; align-items: center; gap: 4px; flex-shrink: 0; }

.act { background: none; border: none; font-size: 12px; font-weight: 600; cursor: pointer; padding: 4px 8px; border-radius: 4px; }
.act.edit { color: #2563eb; }
.act.edit:hover { background: #eff6ff; }
.act.delete { color: #dc2626; }
.act.delete:hover { background: #fef2f2; }

.empty-box { text-align: center; color: #9ca3af; padding: 40px 0; font-size: 13px; }

/* ═══ Modal ═══ */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 1000; display: flex; align-items: center; justify-content: center; }

.modal-container { background: #fff; border-radius: 16px; width: 90vw; max-width: 860px; max-height: 85vh; display: flex; flex-direction: column; box-shadow: 0 20px 60px rgba(0,0,0,0.2); overflow: hidden; }

.modal-header { display: flex; align-items: center; gap: 12px; padding: 16px 24px; border-bottom: 1px solid #e5e7eb; background: #f9fafb; flex-shrink: 0; }
.modal-icon { font-size: 24px; }
.modal-header-info { flex: 1; min-width: 0; }
.modal-header-info h3 { font-size: 15px; font-weight: 700; color: #111827; margin: 0; }
.modal-tpl-name { font-size: 12px; color: #6b7280; }
.modal-header-actions { display: flex; gap: 8px; flex-shrink: 0; }

.modal-body { flex: 1; overflow-y: auto; padding: 24px; }

/* Generic form */
.generic-form { display: flex; flex-direction: column; gap: 16px; }
.generic-form .form-group { display: flex; flex-direction: column; gap: 6px; }
.generic-form label { font-size: 13px; font-weight: 600; color: #374151; }
.textarea { resize: vertical; font-family: inherit; min-height: 100px; }

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
.toast { position: fixed; top: 60px; right: 24px; z-index: 1100; padding: 12px 20px; border-radius: 8px; font-size: 13px; font-weight: 600; box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
.toast.success { background: #ecfdf5; color: #059669; border: 1px solid #a7f3d0; }

/* Transitions */
.slide-up-enter-active, .slide-up-leave-active { transition: all 0.3s ease; }
.slide-up-enter-from, .slide-up-leave-to { transform: translateY(100%); opacity: 0; }
.fade-enter-active, .fade-leave-active { transition: all 0.25s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
