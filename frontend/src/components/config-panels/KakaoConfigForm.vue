<template>
  <div class="kakao-form">
    <!-- 1. 메시지 정보 -->
    <section class="section">
      <h4 class="section-num">1 <span>메시지 정보</span></h4>
      <div class="form-group">
        <label>카카오톡 채널</label>
        <input type="text" v-model="local.kakaoChannel" class="input" placeholder="채널명 입력 (예: I&C Membership)" @input="emitUpdate" />
      </div>
    </section>

    <!-- 2. 메시지 내용 -->
    <section class="section">
      <h4 class="section-num">2 <span>메시지 내용</span></h4>

      <div class="message-area">
        <div class="editor-side">
          <div class="form-group">
            <label>템플릿</label>
            <div class="template-select-row">
              <span class="template-name">{{ local.templateId ? selectedTemplate?.name || local.templateId : '템플릿을 선택해주세요' }}</span>
              <button class="btn-template" @click="showTemplateModal = true">템플릿 선택</button>
            </div>
          </div>

          <!-- 선택된 템플릿 내용 표시 -->
          <div v-if="selectedTemplate" class="template-content">
            <div class="tpl-section">
              <div class="tpl-section-title">헤더</div>
              <div class="tpl-field">
                <span class="tpl-label">제목</span>
                <span class="tpl-value">{{ selectedTemplate.header || '-' }}</span>
              </div>
            </div>
            <div class="tpl-section" v-if="selectedTemplate.highlight">
              <div class="tpl-section-title">하이라이트</div>
              <div class="tpl-field">
                <span class="tpl-label">제목</span>
                <span class="tpl-value highlight-text">{{ selectedTemplate.highlight }}</span>
              </div>
              <div class="tpl-field" v-if="selectedTemplate.highlightDesc">
                <span class="tpl-label">설명</span>
                <span class="tpl-value">{{ selectedTemplate.highlightDesc }}</span>
              </div>
            </div>
            <div class="tpl-section">
              <div class="tpl-section-title">본문</div>
              <div class="tpl-field">
                <span class="tpl-label">내용</span>
                <span class="tpl-value body-text">{{ selectedTemplate.body }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 미리보기 -->
        <div class="preview-side">
          <div class="preview-label">미리보기</div>
          <div class="phone-frame">
            <div class="phone-notch"></div>
            <div class="phone-screen kakao-screen">
              <div class="phone-status-bar"><span>9:30</span></div>
              <div class="kakao-header">{{ local.kakaoChannel || 'I&C Membership' }}</div>
              <div class="kakao-chat">
                <div class="kakao-profile">
                  <div class="kakao-avatar"></div>
                  <span>{{ local.kakaoChannel || 'I&C Membership' }}</span>
                </div>
                <div class="kakao-bubble">
                  <template v-if="selectedTemplate">
                    <div class="kko-title">{{ selectedTemplate.header || '알림톡 도착' }}</div>
                    <div v-if="selectedTemplate.highlight" class="kko-highlight">{{ selectedTemplate.highlight }}</div>
                    <div class="kko-body">{{ selectedTemplate.body || '내용을 선택하세요.' }}</div>
                  </template>
                  <template v-else>
                    <div class="kko-title">알림톡 도착</div>
                    <div class="kko-body-placeholder">템플릿을 선택하세요.</div>
                  </template>
                </div>
              </div>
            </div>
          </div>
          <p class="preview-hint">사용자 디바이스에 따라 실제 노출되는 메시지와 차이가 있을 수 있습니다.</p>
        </div>
      </div>
    </section>

    <!-- 3. 발송 제한 시간 -->
    <section class="section">
      <h4 class="section-num">3 <span>발송 제한 시간</span></h4>
      <div class="restrict-row">
        <label class="toggle">
          <input type="checkbox" v-model="local.restrictEnabled" @change="emitUpdate" />
          <span class="toggle-slider"></span>
        </label>
        <span class="rlabel">타임존 기준</span>
        <select v-model="local.restrictTimezone" class="input input-xs" @change="emitUpdate">
          <option value="Asia/Seoul">Asia/Seoul</option>
          <option value="UTC">UTC</option>
        </select>
        <span class="rlabel">부터</span>
        <input type="time" v-model="local.restrictStart" class="input input-xs" @change="emitUpdate" />
        <span class="rlabel">까지</span>
        <input type="time" v-model="local.restrictEnd" class="input input-xs" @change="emitUpdate" />
        <span class="rlabel">까지 메시지를 발송하지 않습니다.</span>
      </div>
      <div class="form-group" style="margin-top:10px">
        <label>발송 제한 시간에 발송하지 못한 메시지는</label>
        <div class="radio-group">
          <label class="radio-label"><input type="radio" v-model="local.restrictAction" value="DROP" @change="emitUpdate" /> 발송하지 않습니다</label>
          <label class="radio-label"><input type="radio" v-model="local.restrictAction" value="RESEND" @change="emitUpdate" /> 제한 시간 직후 재발송합니다</label>
        </div>
      </div>
      <p class="hint">광고성 메시지의 경우 한국인터넷진흥원의 광고 가이드를 준수하여 발송해 주세요. (야간 발송 제한 시간 20:50 ~ 08:00)</p>
    </section>

    <!-- 4. 수신 동의 -->
    <section class="section">
      <h4 class="section-num">4 <span>수신 동의</span></h4>
      <div class="consent-row">
        <select v-model="local.consentTarget" class="input input-sm" @change="emitUpdate">
          <option value="INFO">정보성</option>
          <option value="AD">광고성</option>
        </select>
        <select v-model="local.consentType" class="input input-sm" @change="emitUpdate">
          <option value="AGREE">수신 동의, 수신 미거부</option>
          <option value="ALL">전체</option>
        </select>
        <span class="consent-hint">한 사용자에게만 발송합니다.</span>
      </div>
    </section>

    <!-- 템플릿 선택 모달 -->
    <Teleport to="body">
      <div v-if="showTemplateModal" class="modal-overlay" @click.self="showTemplateModal = false">
        <div class="modal">
          <div class="modal-header">
            <h3>템플릿 선택</h3>
            <button class="modal-close" @click="showTemplateModal = false">✕</button>
          </div>
          <div class="modal-body">
            <!-- 좌측: 검색 + 목록 -->
            <div class="tpl-list-panel">
              <input type="text" v-model="tplSearch" class="input" placeholder="검색 혹은 선택하세요" />
              <!-- 커스텀 템플릿 -->
              <div class="tpl-group-label">커스텀 템플릿</div>
              <div
                v-for="tpl in filteredTemplates"
                :key="tpl.id"
                class="tpl-list-item"
                :class="{ active: previewTpl?.id === tpl.id }"
                @click="previewTpl = tpl"
              >{{ tpl.name }}</div>
              <div v-if="!filteredTemplates.length" class="tpl-empty">검색 결과가 없습니다.</div>
            </div>

            <!-- 중앙: 상세 내용 -->
            <div class="tpl-detail-panel">
              <template v-if="previewTpl">
                <h4>{{ previewTpl.name }}</h4>
                <div class="tpl-detail-section">
                  <div class="tpl-section-title">메시지 내용</div>
                  <div class="tpl-section-box" v-if="previewTpl.header">
                    <div class="tpl-section-subtitle">헤더</div>
                    <div class="tpl-field"><span class="tpl-label">제목</span><span class="tpl-value">{{ previewTpl.header }}</span></div>
                  </div>
                  <div class="tpl-section-box" v-if="previewTpl.highlight">
                    <div class="tpl-section-subtitle">하이라이트</div>
                    <div class="tpl-field"><span class="tpl-label">제목</span><span class="tpl-value highlight-text">{{ previewTpl.highlight }}</span></div>
                    <div class="tpl-field" v-if="previewTpl.highlightDesc"><span class="tpl-label">설명</span><span class="tpl-value">{{ previewTpl.highlightDesc }}</span></div>
                  </div>
                  <div class="tpl-section-box">
                    <div class="tpl-section-subtitle">본문</div>
                    <div class="tpl-field"><span class="tpl-label">내용</span><span class="tpl-value body-text">{{ previewTpl.body }}</span></div>
                  </div>
                </div>
              </template>
              <div v-else class="tpl-empty-detail">좌측에서 템플릿을 선택하세요.</div>
            </div>

            <!-- 우측: 미리보기 -->
            <div class="tpl-preview-panel">
              <div class="phone-frame phone-frame-lg">
                <div class="phone-notch"></div>
                <div class="phone-screen kakao-screen">
                  <div class="phone-status-bar"><span>9:30</span></div>
                  <div class="kakao-header">{{ local.kakaoChannel || 'I&C Membership' }}</div>
                  <div class="kakao-chat">
                    <div class="kakao-profile">
                      <div class="kakao-avatar"></div>
                      <span>{{ local.kakaoChannel || 'I&C Membership' }}</span>
                    </div>
                    <div class="kakao-bubble" v-if="previewTpl">
                      <div class="kko-title">{{ previewTpl.header || previewTpl.name }}</div>
                      <div v-if="previewTpl.highlight" class="kko-highlight">{{ previewTpl.highlight }}</div>
                      <div class="kko-body">{{ previewTpl.body }}</div>
                    </div>
                    <div class="kakao-bubble" v-else>
                      <div class="kko-body-placeholder">템플릿을 선택하세요.</div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="modal-preview-actions">
                <button class="btn-select" :disabled="!previewTpl" @click="confirmTemplate">템플릿 선택</button>
                <button class="btn-detail" v-if="previewTpl">자세히 보기</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed } from 'vue'
import { useSettingsStore } from '@/stores/settingsStore'

const settingsStore = useSettingsStore()
const props = defineProps<{ config: any }>()
const emit = defineEmits<{ update: [config: any] }>()

const showTemplateModal = ref(false)
const tplSearch = ref('')
const previewTpl = ref<any>(null)

// Kakao templates from store + built-in defaults
interface KakaoTemplate {
  id: string
  name: string
  header: string
  highlight: string
  highlightDesc: string
  body: string
}

const builtinTemplates: KakaoTemplate[] = [
  { id: 'kt1', name: '[보안] 핵클 AI 데이터 리포트 발행 알림', header: '핵클 데이터 리포트# #{NO}', highlight: '#{2025년 12월 05일}\n핵심 지표 알림', highlightDesc: '상세하게 알아보세요', body: '안녕하세요\n올인원 AI 그로스 플랫폼 핵클입니다.\n\n#{워크스페이스명} 워크스페이스의 핵클 AI 데이터 리포트가 발행되었습니다.\n자세한 내용은 아래 "자세히 보기" 버튼을 통해 확인해주세요!' },
  { id: 'kt2', name: '핵클 템플릿', header: '', highlight: '', highlightDesc: '', body: '' },
  { id: 'kt3', name: '배송 시작_버튼형', header: '배송 시작 안내', highlight: '', highlightDesc: '', body: '고객님이 주문하신 상품의 배송이 시작되었습니다.\n\n주문번호: #{주문번호}\n상품명: #{상품명}\n배송사: #{배송사}\n운송장번호: #{운송장번호}' },
  { id: 'kt4', name: '배송시작', header: '배송 안내', highlight: '', highlightDesc: '', body: '배송이 시작되었습니다.' },
  { id: 'kt5', name: '발송준비_버튼형', header: '발송 준비 안내', highlight: '', highlightDesc: '', body: '고객님의 주문 상품이 발송 준비 중입니다.' },
  { id: 'kt6', name: '발송 준비', header: '발송 준비', highlight: '', highlightDesc: '', body: '주문하신 상품이 발송 준비 중입니다.' },
  { id: 'kt7', name: '배송 완료 안내', header: '배송 완료', highlight: '', highlightDesc: '', body: '고객님의 상품이 배송 완료되었습니다.' },
  { id: 'kt8', name: '긴급 공지 안내', header: '긴급 공지', highlight: '', highlightDesc: '', body: '긴급 공지사항을 안내드립니다.' },
  { id: 'kt9', name: '이벤트 당첨 안내', header: '이벤트 당첨', highlight: '', highlightDesc: '', body: '축하합니다! 이벤트에 당첨되셨습니다.' },
  { id: 'kt10', name: '발송 처리', header: '발송 처리 안내', highlight: '', highlightDesc: '', body: '발송 처리가 완료되었습니다.' },
  { id: 'kt11', name: '구매 확정 요청', header: '구매 확정 요청', highlight: '', highlightDesc: '', body: '구매 확정을 부탁드립니다.' },
]

// Merge store templates (as kakao type) with built-in
const allTemplates = computed<KakaoTemplate[]>(() => {
  const fromStore = settingsStore.templates
    .filter((t) => t.channelType === 'CHANNEL_KAKAO')
    .map((t) => ({
      id: t.id,
      name: t.name,
      header: t.title,
      highlight: '',
      highlightDesc: '',
      body: t.body,
    }))
  return [...fromStore, ...builtinTemplates]
})

const filteredTemplates = computed(() => {
  const q = tplSearch.value.toLowerCase()
  if (!q) return allTemplates.value
  return allTemplates.value.filter((t) => t.name.toLowerCase().includes(q))
})

const local = reactive({
  channelType: 'KAKAO',
  configured: props.config?.configured || false,
  kakaoChannel: props.config?.kakaoChannel || '',
  templateId: props.config?.templateId || '',
  restrictEnabled: props.config?.restrictEnabled || false,
  restrictTimezone: props.config?.restrictTimezone || 'Asia/Seoul',
  restrictStart: props.config?.restrictStart || '20:50',
  restrictEnd: props.config?.restrictEnd || '08:00',
  restrictAction: props.config?.restrictAction || 'RESEND',
  consentTarget: props.config?.consentTarget || 'INFO',
  consentType: props.config?.consentType || 'AGREE',
})

const selectedTemplate = computed(() => {
  if (!local.templateId) return null
  return allTemplates.value.find((t) => t.id === local.templateId) || null
})

function confirmTemplate() {
  if (previewTpl.value) {
    local.templateId = previewTpl.value.id
    showTemplateModal.value = false
    emitUpdate()
  }
}

function emitUpdate() {
  local.configured = !!(local.kakaoChannel && local.templateId)
  emit('update', { ...local })
}
</script>

<style scoped>
.kakao-form { display: flex; flex-direction: column; gap: 0; }
.section { padding: 14px 0; border-bottom: 1px solid #f3f4f6; }
.section:last-child { border-bottom: none; }
.section-num { font-size: 13px; font-weight: 700; color: #111827; margin: 0 0 12px; display: flex; align-items: center; gap: 8px; }
.section-num span { font-weight: 600; }
.form-group { display: flex; flex-direction: column; gap: 4px; margin-bottom: 10px; }
.form-group:last-child { margin-bottom: 0; }
.form-group label { font-size: 11px; font-weight: 600; color: #6b7280; }
.input { padding: 7px 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 13px; color: #111827; background: #fff; width: 100%; }
.input:focus { outline: none; border-color: #2563eb; box-shadow: 0 0 0 2px rgba(37,99,235,0.1); }
.input-sm { width: auto; flex: 1; min-width: 0; }
.input-xs { width: auto; flex: 0 0 auto; min-width: 80px; }

/* Template select row */
.template-select-row { display: flex; align-items: center; gap: 8px; }
.template-name { flex: 1; font-size: 13px; color: #374151; padding: 7px 10px; border: 1px solid #d1d5db; border-radius: 6px; background: #f9fafb; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.btn-template { padding: 7px 14px; background: #2563eb; color: #fff; border: none; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; white-space: nowrap; flex-shrink: 0; }
.btn-template:hover { background: #1d4ed8; }

/* Template content preview */
.template-content { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; margin-top: 8px; }
.tpl-section { margin-bottom: 10px; }
.tpl-section:last-child { margin-bottom: 0; }
.tpl-section-title { font-size: 12px; font-weight: 700; color: #111827; margin-bottom: 4px; }
.tpl-field { display: flex; gap: 8px; margin-bottom: 2px; }
.tpl-label { font-size: 11px; font-weight: 600; color: #6b7280; min-width: 36px; flex-shrink: 0; }
.tpl-value { font-size: 12px; color: #374151; white-space: pre-wrap; word-break: break-all; }
.highlight-text { color: #2563eb; font-weight: 600; }
.body-text { line-height: 1.5; }

/* Message area */
.message-area { display: flex; gap: 14px; }
.editor-side { flex: 1; min-width: 0; }
.preview-side { flex-shrink: 0; display: flex; flex-direction: column; align-items: center; }
.preview-label { font-size: 11px; font-weight: 600; color: #6b7280; margin-bottom: 6px; }

/* Phone */
.phone-frame { width: 150px; min-height: 260px; background: #1a1a1a; border-radius: 18px; padding: 6px; }
.phone-frame-lg { width: 200px; min-height: 340px; }
.phone-notch { width: 40px; height: 5px; background: #333; border-radius: 3px; margin: 3px auto 6px; }
.phone-screen { background: #fff; border-radius: 12px; min-height: 230px; overflow: hidden; }
.phone-frame-lg .phone-screen { min-height: 300px; }
.kakao-screen { background: #b2c7d9; }
.phone-status-bar { padding: 4px 8px; font-size: 9px; font-weight: 600; color: #333; }
.kakao-header { background: #b2c7d9; text-align: center; font-size: 11px; font-weight: 700; color: #333; padding: 4px 0; }
.kakao-chat { padding: 8px; }
.kakao-profile { display: flex; align-items: center; gap: 4px; margin-bottom: 6px; }
.kakao-avatar { width: 22px; height: 22px; border-radius: 8px; background: #4A90D9; flex-shrink: 0; }
.kakao-profile span { font-size: 9px; font-weight: 600; color: #333; }
.kakao-bubble { background: #ffe812; border-radius: 8px; padding: 8px; }
.kko-title { font-size: 9px; font-weight: 700; color: #333; margin-bottom: 3px; }
.kko-highlight { font-size: 8px; color: #2563eb; font-weight: 600; margin-bottom: 3px; white-space: pre-wrap; }
.kko-body { font-size: 8px; color: #333; line-height: 1.3; white-space: pre-wrap; word-break: break-all; }
.kko-body-placeholder { font-size: 8px; color: #999; }
.preview-hint { font-size: 9px; color: #9ca3af; text-align: center; margin-top: 6px; line-height: 1.3; max-width: 150px; }

/* Restrict */
.restrict-row { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.rlabel { font-size: 12px; color: #374151; white-space: nowrap; }
.radio-group { display: flex; gap: 16px; }
.radio-label { display: flex; align-items: center; gap: 6px; font-size: 13px; color: #374151; cursor: pointer; }
.hint { font-size: 11px; color: #9ca3af; line-height: 1.4; margin-top: 6px; }

/* Toggle */
.toggle { position: relative; display: inline-block; width: 36px; height: 20px; cursor: pointer; flex-shrink: 0; }
.toggle input { opacity: 0; width: 0; height: 0; }
.toggle-slider { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: #d1d5db; border-radius: 20px; transition: 0.2s; }
.toggle-slider::before { content: ''; position: absolute; width: 14px; height: 14px; left: 3px; bottom: 3px; background: #fff; border-radius: 50%; transition: 0.2s; }
.toggle input:checked + .toggle-slider { background: #2563eb; }
.toggle input:checked + .toggle-slider::before { transform: translateX(16px); }

/* Consent */
.consent-row { display: flex; align-items: center; gap: 8px; }
.consent-hint { font-size: 12px; color: #9ca3af; }

/* ═══ Modal ═══ */
.modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 1000; display: flex; align-items: center; justify-content: center; }
.modal { background: #fff; border-radius: 12px; width: 900px; max-width: 95vw; max-height: 85vh; display: flex; flex-direction: column; box-shadow: 0 20px 60px rgba(0,0,0,0.2); }
.modal-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid #e5e7eb; }
.modal-header h3 { font-size: 16px; font-weight: 700; color: #111827; margin: 0; }
.modal-close { background: none; border: none; font-size: 20px; color: #6b7280; cursor: pointer; }
.modal-close:hover { color: #111827; }
.modal-body { display: flex; flex: 1; min-height: 0; overflow: hidden; }

/* Template list panel */
.tpl-list-panel { width: 220px; border-right: 1px solid #e5e7eb; display: flex; flex-direction: column; overflow-y: auto; padding: 12px; }
.tpl-list-panel .input { margin-bottom: 10px; }
.tpl-group-label { font-size: 10px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
.tpl-list-item { padding: 8px 10px; font-size: 12px; color: #374151; border-radius: 6px; cursor: pointer; transition: background 0.1s; margin-bottom: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.tpl-list-item:hover { background: #f3f4f6; }
.tpl-list-item.active { background: #eff6ff; color: #2563eb; font-weight: 600; }
.tpl-empty { font-size: 12px; color: #9ca3af; padding: 16px 0; text-align: center; }

/* Detail panel */
.tpl-detail-panel { flex: 1; padding: 16px; overflow-y: auto; }
.tpl-detail-panel h4 { font-size: 15px; font-weight: 700; color: #111827; margin: 0 0 14px; }
.tpl-detail-section { display: flex; flex-direction: column; gap: 10px; }
.tpl-section-box { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px 12px; }
.tpl-section-subtitle { font-size: 11px; font-weight: 700; color: #374151; margin-bottom: 4px; }
.tpl-empty-detail { color: #9ca3af; font-size: 13px; text-align: center; padding: 60px 0; }

/* Preview panel in modal */
.tpl-preview-panel { width: 240px; border-left: 1px solid #e5e7eb; padding: 16px; display: flex; flex-direction: column; align-items: center; gap: 12px; }
.modal-preview-actions { display: flex; flex-direction: column; gap: 6px; width: 100%; }
.btn-select { width: 100%; padding: 10px; background: #2563eb; color: #fff; border: none; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; }
.btn-select:hover:not(:disabled) { background: #1d4ed8; }
.btn-select:disabled { opacity: 0.4; cursor: not-allowed; }
.btn-detail { width: 100%; padding: 8px; background: none; color: #6b7280; border: 1px solid #d1d5db; border-radius: 8px; font-size: 12px; cursor: pointer; }
.btn-detail:hover { background: #f3f4f6; }
</style>
