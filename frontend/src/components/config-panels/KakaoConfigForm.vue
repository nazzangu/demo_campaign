<template>
  <div class="kakao-form">
    <!-- 템플릿 불러오기 -->
    <div class="load-template-bar">
      <button class="btn-load-template" @click="showPicker = true">📄 템플릿 불러오기</button>
    </div>
    <TemplatePickerModal
      :visible="showPicker"
      channel-type="CHANNEL_KAKAO"
      @close="showPicker = false"
      @select="applyTemplate"
    />

    <!-- 1. 메시지 정보 -->
    <section class="section">
      <h4 class="section-num">1 <span>메시지 정보</span></h4>
      <div class="form-group">
        <label>카카오톡 채널</label>
        <input type="text" v-model="local.kakaoChannel" class="input" placeholder="채널명 입력 (예: I&C Membership)" @input="emitUpdate" />
      </div>
    </section>

    <!-- 2. 미리보기 -->
    <section class="section">
      <h4 class="section-num">2 <span>미리보기</span></h4>
      <div class="preview-side">
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
                <div class="kko-title">알림톡 도착</div>
                <div class="kko-body-placeholder">템플릿 불러오기로 내용을 설정하세요.</div>
              </div>
            </div>
          </div>
        </div>
        <p class="preview-hint">사용자 디바이스에 따라 실제 노출되는 메시지와 차이가 있을 수 있습니다.</p>
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

  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useSettingsStore } from '@/stores/settingsStore'
import type { TemplateItem } from '@/stores/settingsStore'
import TemplatePickerModal from './TemplatePickerModal.vue'

const settingsStore = useSettingsStore()
const props = defineProps<{ config: any }>()
const emit = defineEmits<{ update: [config: any] }>()

const showPicker = ref(false)

function applyTemplate(tpl: TemplateItem) {
  showPicker.value = false
  if (tpl.channelConfig) {
    Object.assign(local, tpl.channelConfig)
  } else {
    if (tpl.title) local.kakaoChannel = local.kakaoChannel || tpl.title
  }
  emitUpdate()
}

const local = reactive({
  channelType: 'KAKAO',
  configured: props.config?.configured || false,
  kakaoChannel: props.config?.kakaoChannel || '',
  restrictEnabled: props.config?.restrictEnabled || false,
  restrictTimezone: props.config?.restrictTimezone || 'Asia/Seoul',
  restrictStart: props.config?.restrictStart || '20:50',
  restrictEnd: props.config?.restrictEnd || '08:00',
  restrictAction: props.config?.restrictAction || 'RESEND',
  consentTarget: props.config?.consentTarget || 'INFO',
  consentType: props.config?.consentType || 'AGREE',
})

function emitUpdate() {
  local.configured = !!local.kakaoChannel
  emit('update', { ...local })
}
</script>

<style scoped>
.load-template-bar { margin-bottom: 12px; }
.btn-load-template { width: 100%; padding: 10px; background: #f0f7ff; color: #1a73e8; border: 1px dashed #93c5fd; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 600; transition: all 0.15s; }
.btn-load-template:hover { background: #dbeafe; border-color: #60a5fa; }

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

/* Preview */
.preview-side { display: flex; flex-direction: column; align-items: center; }
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

</style>
