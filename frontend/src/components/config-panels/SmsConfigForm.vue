<template>
  <div class="sms-form">
    <!-- 템플릿 불러오기 -->
    <div class="load-template-bar">
      <button class="btn-load-template" @click="showPicker = true">📄 템플릿 불러오기</button>
    </div>
    <TemplatePickerModal
      :visible="showPicker"
      channel-type="CHANNEL_SMS"
      @close="showPicker = false"
      @select="applyTemplate"
    />

    <!-- 1. 메시지 정보 -->
    <section class="section">
      <h4 class="section-num">1 <span>메시지 정보</span></h4>
      <div class="info-row">
        <div class="form-group">
          <label>발신 번호</label>
          <input type="text" v-model="local.senderNumber" class="input" placeholder="070-8018-2806" @input="emitUpdate" />
        </div>
        <div class="form-group">
          <label>수신 거부 번호</label>
          <input type="text" v-model="local.rejectNumber" class="input" placeholder="080-888-1064" @input="emitUpdate" />
        </div>
      </div>
    </section>

    <!-- 2. 메시지 내용 -->
    <section class="section">
      <h4 class="section-num">2 <span>메시지 내용</span></h4>

      <!-- 유형 선택 -->
      <div class="form-group">
        <label>유형</label>
        <div class="type-selector">
          <label class="type-option" :class="{ active: local.smsType === 'SMS' }">
            <input type="radio" v-model="local.smsType" value="SMS" @change="emitUpdate" />
            <div>
              <strong>SMS</strong>
              <span>90 Byte 이하 짧은 문자</span>
            </div>
          </label>
          <label class="type-option" :class="{ active: local.smsType === 'LMS' }">
            <input type="radio" v-model="local.smsType" value="LMS" @change="emitUpdate" />
            <div>
              <strong>LMS</strong>
              <span>2000 Byte 이하 긴 문자</span>
            </div>
          </label>
          <label class="type-option" :class="{ active: local.smsType === 'MMS' }">
            <input type="radio" v-model="local.smsType" value="MMS" @change="emitUpdate" />
            <div>
              <strong>MMS</strong>
              <span>이미지 포함된 긴 문자</span>
            </div>
          </label>
        </div>
      </div>

      <div class="message-area">
        <!-- 입력 영역 -->
        <div class="editor-side">
          <div class="form-group" v-if="local.smsType === 'LMS' || local.smsType === 'MMS'">
            <label>제목</label>
            <input type="text" v-model="local.title" class="input" placeholder="제목을 입력해주세요" @input="emitUpdate" />
          </div>

          <div class="form-group">
            <label>내용</label>
            <div class="textarea-wrap">
              <textarea
                v-model="local.body"
                class="input textarea"
                rows="6"
                placeholder="내용을 입력해주세요."
                @input="emitUpdate"
              ></textarea>
              <div class="textarea-footer">
                <button class="insert-btn" @click="showVarPicker = !showVarPicker" title="개인화 변수 삽입">{}</button>
                <span class="byte-count">{{ byteCount }} / {{ maxByte }} Byte</span>
              </div>
              <div v-if="showVarPicker" class="var-picker">
                <button
                  v-for="v in settingsStore.personalizationVars"
                  :key="v.id"
                  class="var-item"
                  @click="insertVar(v.name)"
                >{{ v.label }} ({{ v.name }})</button>
              </div>
            </div>
          </div>

          <div class="form-group" v-if="local.smsType === 'MMS'">
            <label>이미지 URL</label>
            <input type="url" v-model="local.imageUrl" class="input" placeholder="https://example.com/image.jpg" @input="emitUpdate" />
          </div>

          <div class="form-group">
            <label>광고 메시지 여부</label>
            <label class="toggle">
              <input type="checkbox" v-model="local.isAd" @change="emitUpdate" />
              <span class="toggle-slider"></span>
            </label>
          </div>

          <!-- 사용자 메시지 미리보기 테이블 -->
          <div class="preview-table">
            <div class="preview-table-title">사용자 메시지 미리보기</div>
            <p class="hint">테스트 메시지 발송 시 작성 값을 확인하여 사용자에게 노출될 메시지 내용을 미리 확인할 수 있습니다.</p>
            <div v-for="(row, idx) in local.previewVars" :key="idx" class="preview-var-row">
              <select v-model="row.type" class="input input-sm">
                <option value="사용자 속성">사용자 속성</option>
                <option value="이벤트 속성">이벤트 속성</option>
              </select>
              <select v-model="row.property" class="input input-sm">
                <option value="">속성을 선택해주세요</option>
                <option v-for="p in settingsStore.properties" :key="p.id" :value="p.name">{{ p.label }}</option>
              </select>
              <input type="text" v-model="row.value" class="input input-sm" placeholder="값을 입력해주세요" />
              <button class="remove-row" @click="removePreviewVar(idx)">✕</button>
            </div>
            <button class="link-btn" @click="addPreviewVar">+ 항목 추가하기</button>
          </div>
        </div>

        <!-- 휴대폰 미리보기 -->
        <div class="preview-side">
          <div class="preview-label">미리보기</div>
          <div class="phone-frame">
            <div class="phone-notch"></div>
            <div class="phone-screen">
              <div class="phone-status-bar"><span>9:30</span></div>
              <div class="sms-bubble-area">
                <div class="sms-sender">{{ local.senderNumber || '070-0000-0000' }}</div>
                <div class="sms-bubble">
                  <span v-if="local.isAd" class="ad-tag">(광고)</span>
                  {{ local.body || '내용을 입력하세요' }}
                </div>
              </div>
            </div>
          </div>
          <p class="preview-hint">사용자 디바이스의 따라 실제 노출되는 메시지와 차이가 있을 수 있습니다.</p>
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
        <span class="restrict-label">타임존 기준</span>
        <select v-model="local.restrictTimezone" class="input input-xs" @change="emitUpdate">
          <option value="Asia/Seoul">Asia/Seoul</option>
          <option value="UTC">UTC</option>
        </select>
        <span class="restrict-label">부터</span>
        <input type="time" v-model="local.restrictStart" class="input input-xs" @change="emitUpdate" />
        <span class="restrict-label">까지</span>
        <input type="time" v-model="local.restrictEnd" class="input input-xs" @change="emitUpdate" />
        <span class="restrict-label">푸시 메시지를 발송하지 않습니다.</span>
      </div>
      <div class="form-group" style="margin-top: 10px;">
        <label>발송 제한 시간에 발송하지 못한 메시지는</label>
        <div class="radio-group">
          <label class="radio-label">
            <input type="radio" v-model="local.restrictAction" value="DROP" @change="emitUpdate" />
            발송하지 않습니다
          </label>
          <label class="radio-label">
            <input type="radio" v-model="local.restrictAction" value="RESEND" @change="emitUpdate" />
            제한 시간 직후 재발송합니다
          </label>
        </div>
      </div>
      <p class="hint" v-if="local.isAd">광고성 메시지의 경우 한국인터넷진흥원의 광고 가이드를 준수하여 발송해 주세요. (야간 발송 제한 시간 20:50 ~ 08:00)</p>
    </section>

    <!-- 4. 수신 동의 -->
    <section class="section">
      <h4 class="section-num">4 <span>수신 동의</span></h4>
      <div class="consent-row">
        <div class="form-group">
          <label>검색할 발송 대상</label>
          <div class="consent-tags">
            <select v-model="local.consentTarget" class="input input-sm" @change="emitUpdate">
              <option value="ALL">발송 동의</option>
              <option value="MARKETING">수신 동의, 수신 미거부</option>
            </select>
            <span class="consent-hint">한 사용자에게만 발송합니다.</span>
          </div>
        </div>
      </div>
    </section>

    <!-- 테스트 발송 -->
    <section class="section test-section">
      <h4 class="section-num">테스트 발송</h4>
      <div class="test-targets">
        <div v-for="(t, idx) in test.targets" :key="idx" class="test-target-row">
          <input type="text" v-model="test.targets[idx]" class="input" placeholder="수신 번호 입력 (예: 010-1234-5678)" />
          <button v-if="test.targets.length > 1" class="remove-row" @click="test.targets.splice(idx, 1)">✕</button>
        </div>
        <button class="link-btn" @click="test.targets.push('')">+ 수신 번호 추가</button>
      </div>
      <button class="btn-test" :disabled="!local.body || test.sending" @click="handleTestSend">
        {{ test.sending ? '발송 중...' : '테스트 발송' }}
      </button>
      <div v-if="test.result" class="test-result" :class="test.result.type">{{ test.result.message }}</div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed, ref } from 'vue'
import { useSettingsStore } from '@/stores/settingsStore'
import type { TemplateItem } from '@/stores/settingsStore'
import TemplatePickerModal from './TemplatePickerModal.vue'

const settingsStore = useSettingsStore()
const props = defineProps<{ config: any }>()
const emit = defineEmits<{ update: [config: any] }>()

const showPicker = ref(false)
const showVarPicker = ref(false)

function applyTemplate(tpl: TemplateItem) {
  showPicker.value = false
  if (tpl.channelConfig) {
    Object.assign(local, tpl.channelConfig)
  } else {
    local.title = tpl.title || local.title
    local.body = tpl.body || local.body
  }
  emitUpdate()
}

const local = reactive({
  channelType: 'SMS',
  configured: props.config?.configured || false,
  senderNumber: props.config?.senderNumber || '',
  rejectNumber: props.config?.rejectNumber || '',
  smsType: props.config?.smsType || 'SMS',
  title: props.config?.title || '',
  body: props.config?.body || '',
  imageUrl: props.config?.imageUrl || '',
  isAd: props.config?.isAd || false,
  previewVars: props.config?.previewVars || [] as { type: string; property: string; value: string }[],
  restrictEnabled: props.config?.restrictEnabled || false,
  restrictTimezone: props.config?.restrictTimezone || 'Asia/Seoul',
  restrictStart: props.config?.restrictStart || '20:50',
  restrictEnd: props.config?.restrictEnd || '08:00',
  restrictAction: props.config?.restrictAction || 'DROP',
  consentTarget: props.config?.consentTarget || 'ALL',
})

const test = reactive({
  targets: [''] as string[],
  sending: false,
  result: null as { type: 'success' | 'error'; message: string } | null,
})

const maxByte = computed(() => {
  if (local.smsType === 'SMS') return 90
  return 2000
})

const byteCount = computed(() => {
  let bytes = 0
  for (const ch of local.body || '') {
    bytes += ch.charCodeAt(0) > 127 ? 2 : 1
  }
  return bytes
})

function addPreviewVar() {
  local.previewVars.push({ type: '사용자 속성', property: '', value: '' })
}

function removePreviewVar(idx: number) {
  local.previewVars.splice(idx, 1)
}

function insertVar(name: string) {
  local.body = (local.body || '') + `\{\{${name}\}\}`
  showVarPicker.value = false
  emitUpdate()
}

async function handleTestSend() {
  test.sending = true
  test.result = null
  try {
    await new Promise((r) => setTimeout(r, 1500))
    const cnt = test.targets.filter((t) => t.trim()).length
    test.result = { type: 'success', message: `${cnt}건 테스트 발송을 요청했습니다.` }
  } catch {
    test.result = { type: 'error', message: '테스트 발송에 실패했습니다.' }
  } finally {
    test.sending = false
  }
}

function emitUpdate() {
  local.configured = !!(local.body && local.senderNumber)
  emit('update', { ...local, previewVars: local.previewVars.map((v) => ({ ...v })) })
}
</script>

<style scoped>
.load-template-bar { margin-bottom: 12px; }
.btn-load-template { width: 100%; padding: 10px; background: #f0f7ff; color: #1a73e8; border: 1px dashed #93c5fd; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 600; transition: all 0.15s; }
.btn-load-template:hover { background: #dbeafe; border-color: #60a5fa; }

.sms-form { display: flex; flex-direction: column; gap: 0; }

.section { padding: 14px 0; border-bottom: 1px solid #f3f4f6; }
.section:last-child { border-bottom: none; }

.section-num { font-size: 13px; font-weight: 700; color: #111827; margin: 0 0 12px; display: flex; align-items: center; gap: 8px; }
.section-num span { font-weight: 600; }

.form-group { display: flex; flex-direction: column; gap: 4px; margin-bottom: 10px; }
.form-group:last-child { margin-bottom: 0; }
.form-group label { font-size: 11px; font-weight: 600; color: #6b7280; }

.info-row { display: flex; gap: 10px; }
.info-row .form-group { flex: 1; }

.input { padding: 7px 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 13px; color: #111827; background: #fff; width: 100%; }
.input:focus { outline: none; border-color: #2563eb; box-shadow: 0 0 0 2px rgba(37,99,235,0.1); }
.input-sm { width: auto; flex: 1; min-width: 0; }
.input-xs { width: auto; flex: 0 0 auto; min-width: 80px; }
.textarea { resize: vertical; font-family: inherit; }

/* Type selector */
.type-selector { display: flex; gap: 8px; }
.type-option { display: flex; align-items: center; gap: 6px; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 8px; cursor: pointer; flex: 1; transition: all 0.15s; }
.type-option.active { border-color: #2563eb; background: #eff6ff; }
.type-option input { margin: 0; }
.type-option div { display: flex; flex-direction: column; }
.type-option strong { font-size: 13px; color: #111827; }
.type-option span { font-size: 10px; color: #9ca3af; }

/* Message area */
.message-area { display: flex; gap: 14px; }
.editor-side { flex: 1; min-width: 0; }
.preview-side { flex-shrink: 0; display: flex; flex-direction: column; align-items: center; }
.preview-label { font-size: 11px; font-weight: 600; color: #6b7280; margin-bottom: 6px; }

/* Textarea wrap */
.textarea-wrap { position: relative; }
.textarea-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 4px; }
.insert-btn { background: #f3f4f6; border: 1px solid #d1d5db; border-radius: 4px; padding: 2px 8px; font-size: 13px; cursor: pointer; color: #6b7280; }
.insert-btn:hover { background: #e5e7eb; }
.byte-count { font-size: 11px; color: #9ca3af; }
.var-picker { position: absolute; top: 100%; left: 0; background: #fff; border: 1px solid #d1d5db; border-radius: 6px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); z-index: 10; padding: 4px; margin-top: 4px; max-height: 160px; overflow-y: auto; min-width: 200px; }
.var-item { display: block; width: 100%; text-align: left; padding: 6px 10px; background: none; border: none; font-size: 12px; cursor: pointer; border-radius: 4px; color: #374151; }
.var-item:hover { background: #eff6ff; color: #2563eb; }

/* Phone */
.phone-frame { width: 150px; min-height: 270px; background: #1a1a1a; border-radius: 18px; padding: 6px; }
.phone-notch { width: 40px; height: 5px; background: #333; border-radius: 3px; margin: 3px auto 6px; }
.phone-screen { background: #fff; border-radius: 12px; min-height: 230px; overflow: hidden; padding: 8px; }
.phone-status-bar { font-size: 9px; font-weight: 600; color: #333; margin-bottom: 10px; }
.sms-bubble-area { display: flex; flex-direction: column; align-items: center; gap: 6px; }
.sms-sender { font-size: 10px; font-weight: 600; color: #333; }
.sms-bubble { background: #f3f4f6; border-radius: 10px; padding: 8px 10px; font-size: 9px; color: #374151; line-height: 1.4; word-break: break-all; max-width: 100%; }
.ad-tag { color: #dc2626; font-weight: 600; }
.preview-hint { font-size: 9px; color: #9ca3af; text-align: center; margin-top: 6px; line-height: 1.3; max-width: 150px; }

/* Preview vars table */
.preview-table { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px; margin-top: 8px; }
.preview-table-title { font-size: 12px; font-weight: 700; color: #374151; margin-bottom: 4px; }
.preview-var-row { display: flex; gap: 4px; align-items: center; margin-bottom: 4px; }
.remove-row { background: none; border: none; color: #9ca3af; cursor: pointer; font-size: 14px; flex-shrink: 0; }
.remove-row:hover { color: #ef4444; }
.link-btn { background: none; border: none; color: #6b7280; font-size: 11px; cursor: pointer; padding: 4px 0; }
.link-btn:hover { color: #2563eb; }

.hint { font-size: 11px; color: #9ca3af; line-height: 1.4; }

/* Restrict */
.restrict-row { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.restrict-label { font-size: 12px; color: #374151; white-space: nowrap; }

/* Radio */
.radio-group { display: flex; gap: 16px; }
.radio-label { display: flex; align-items: center; gap: 6px; font-size: 13px; color: #374151; cursor: pointer; }

/* Toggle */
.toggle { position: relative; display: inline-block; width: 36px; height: 20px; cursor: pointer; flex-shrink: 0; }
.toggle input { opacity: 0; width: 0; height: 0; }
.toggle-slider { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: #d1d5db; border-radius: 20px; transition: 0.2s; }
.toggle-slider::before { content: ''; position: absolute; width: 14px; height: 14px; left: 3px; bottom: 3px; background: #fff; border-radius: 50%; transition: 0.2s; }
.toggle input:checked + .toggle-slider { background: #2563eb; }
.toggle input:checked + .toggle-slider::before { transform: translateX(16px); }

/* Consent */
.consent-tags { display: flex; align-items: center; gap: 8px; }
.consent-hint { font-size: 12px; color: #9ca3af; }

/* Test */
.test-section { background: #f9fafb; border-radius: 8px; padding: 14px !important; }
.test-targets { display: flex; flex-direction: column; gap: 6px; margin-bottom: 10px; }
.test-target-row { display: flex; align-items: center; gap: 6px; }
.test-target-row .input { flex: 1; }
.btn-test { width: 100%; padding: 9px; background: #111827; color: #fff; border: none; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; }
.btn-test:hover:not(:disabled) { background: #1f2937; }
.btn-test:disabled { opacity: 0.4; cursor: not-allowed; }
.test-result { margin-top: 8px; padding: 8px 10px; border-radius: 6px; font-size: 12px; font-weight: 500; }
.test-result.success { background: #ecfdf5; color: #059669; border: 1px solid #a7f3d0; }
.test-result.error { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
</style>
