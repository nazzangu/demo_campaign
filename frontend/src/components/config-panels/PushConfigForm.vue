<template>
  <div class="push-form">
    <!-- 발송 정보 -->
    <section class="section">
      <h4 class="section-title">발송 정보</h4>
      <div class="form-group">
        <label>푸시앱</label>
        <select v-model="local.appId" class="input" @change="emitUpdate">
          <option value="">푸시 앱을 선택하세요</option>
          <option v-for="app in settingsStore.pushApps" :key="app.id" :value="app.appKey">
            {{ app.label }} ({{ app.platform }})
          </option>
        </select>
      </div>
      <div class="form-group">
        <label>매체(타입)</label>
        <div class="radio-group">
          <label class="radio-label">
            <input type="radio" v-model="local.mediaType" value="PUSH" @change="emitUpdate" />
            일반 푸시
          </label>
          <label class="radio-label">
            <input type="radio" v-model="local.mediaType" value="RICH_PUSH" @change="emitUpdate" />
            리치 푸시
          </label>
        </div>
      </div>
    </section>

    <!-- 메시지 작성 + 미리보기 -->
    <section class="section">
      <h4 class="section-title">메시지 작성</h4>
      <div class="message-editor-area">
        <div class="editor-fields">
          <div class="form-group">
            <label>푸시 타이틀</label>
            <input
              type="text"
              v-model="local.title"
              class="input"
              placeholder="푸시 제목을 입력하세요"
              @input="emitUpdate"
            />
          </div>
          <div class="form-group">
            <label>내용</label>
            <textarea
              v-model="local.body"
              class="input textarea"
              rows="4"
              placeholder="푸시 내용을 입력하세요"
              @input="emitUpdate"
            ></textarea>
            <span class="char-count">{{ (local.body || '').length }} / 100자</span>
          </div>
          <div class="form-group">
            <label>클릭 시 이동 URL</label>
            <input
              type="url"
              v-model="local.clickUrl"
              class="input"
              placeholder="https://example.com/landing"
              @input="emitUpdate"
            />
          </div>
          <div class="form-group" v-if="local.mediaType === 'RICH_PUSH'">
            <label>이미지 URL</label>
            <input
              type="url"
              v-model="local.imageUrl"
              class="input"
              placeholder="https://example.com/image.png"
              @input="emitUpdate"
            />
          </div>
        </div>

        <!-- 휴대폰 미리보기 -->
        <div class="preview-wrapper">
          <div class="phone-frame">
            <div class="phone-notch"></div>
            <div class="phone-screen">
              <div class="phone-status-bar">
                <span>9:41</span>
              </div>
              <div class="push-preview-card">
                <div class="preview-app-icon">A</div>
                <div class="preview-content">
                  <div class="preview-app-name">{{ local.appId ? '앱 이름' : 'App' }}</div>
                  <div class="preview-title">{{ local.title || '푸시 타이틀' }}</div>
                  <div class="preview-body">{{ local.body || '푸시 내용이 여기에 표시됩니다.' }}</div>
                </div>
              </div>
              <div v-if="local.mediaType === 'RICH_PUSH' && local.imageUrl" class="preview-image-area">
                <img :src="local.imageUrl" alt="preview" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 테스트 발송 -->
    <section class="section test-section">
      <h4 class="section-title">테스트 발송</h4>
      <p class="hint">실제 디바이스로 푸시 메시지를 테스트 발송합니다. 토큰 또는 사용자 ID를 입력하세요.</p>
      <div class="test-row">
        <select v-model="test.targetType" class="input input-sm">
          <option value="TOKEN">디바이스 토큰</option>
          <option value="USER_ID">사용자 ID</option>
        </select>
      </div>
      <div class="test-targets">
        <div v-for="(target, idx) in test.targets" :key="idx" class="test-target-row">
          <input
            type="text"
            v-model="test.targets[idx]"
            class="input"
            :placeholder="test.targetType === 'TOKEN' ? '디바이스 토큰 입력' : '사용자 ID 입력'"
          />
          <button v-if="test.targets.length > 1" class="remove-target" @click="removeTestTarget(idx)">✕</button>
        </div>
        <button class="link-btn" @click="addTestTarget">+ 대상 추가</button>
      </div>
      <button
        class="btn-test-send"
        :disabled="!canTestSend || test.sending"
        @click="handleTestSend"
      >
        <span v-if="test.sending">발송 중...</span>
        <span v-else>테스트 발송</span>
      </button>
      <div v-if="test.result" class="test-result" :class="test.result.type">
        {{ test.result.message }}
      </div>
    </section>

    <!-- 대상자별 메시지 개인화 -->
    <section class="section collapsible" :class="{ open: sections.personalization }">
      <h4 class="section-title clickable" @click="sections.personalization = !sections.personalization">
        <span>대상자별 메시지 개인화</span>
        <span class="chevron">{{ sections.personalization ? '▲' : '▼' }}</span>
      </h4>
      <div v-if="sections.personalization" class="section-body">
        <p class="hint">수신 대상자의 속성 값을 활용하여 메시지를 개인화할 수 있습니다.</p>
        <div class="form-group">
          <label>개인화 변수</label>
          <div class="var-list">
            <span class="var-tag" v-for="v in settingsStore.personalizationVars" :key="v.id" @click="insertVar(v.name)">{{ varDisplay(v.name) }} <small>{{ v.label }}</small></span>
          </div>
        </div>
      </div>
    </section>

    <!-- 발송 방식 -->
    <section class="section collapsible" :class="{ open: sections.sending }">
      <h4 class="section-title clickable" @click="sections.sending = !sections.sending">
        <span>발송 방식</span>
        <span class="chevron">{{ sections.sending ? '▲' : '▼' }}</span>
      </h4>
      <div v-if="sections.sending" class="section-body">
        <div class="radio-group vertical">
          <label class="radio-label">
            <input type="radio" v-model="local.sendType" value="IMMEDIATE" @change="emitUpdate" />
            <div>
              <strong>즉시 발송</strong>
              <p class="radio-desc">조건 충족 시 즉시 발송합니다.</p>
            </div>
          </label>
          <label class="radio-label">
            <input type="radio" v-model="local.sendType" value="SCHEDULED" @change="emitUpdate" />
            <div>
              <strong>예약 발송</strong>
              <p class="radio-desc">지정된 시간에 발송합니다.</p>
            </div>
          </label>
        </div>
        <div v-if="local.sendType === 'SCHEDULED'" class="form-group" style="margin-top: 10px;">
          <label>발송 시간</label>
          <input type="time" v-model="local.scheduledTime" class="input" @change="emitUpdate" />
        </div>
      </div>
    </section>

    <!-- 발송 조건 -->
    <section class="section collapsible" :class="{ open: sections.condition }">
      <h4 class="section-title clickable" @click="sections.condition = !sections.condition">
        <span>발송 조건</span>
        <span class="chevron">{{ sections.condition ? '▲' : '▼' }}</span>
      </h4>
      <div v-if="sections.condition" class="section-body">
        <div class="form-group">
          <label>방해 금지 시간</label>
          <div class="inline-group">
            <input type="time" v-model="local.quietStart" class="input input-sm" @change="emitUpdate" />
            <span class="label-text">~</span>
            <input type="time" v-model="local.quietEnd" class="input input-sm" @change="emitUpdate" />
          </div>
        </div>
        <div class="form-group">
          <label>발송 요일</label>
          <div class="day-selector">
            <button
              v-for="day in DAYS"
              :key="day.value"
              class="day-btn"
              :class="{ active: local.sendDays.includes(day.value) }"
              @click="toggleDay(day.value)"
            >{{ day.label }}</button>
          </div>
        </div>
      </div>
    </section>

    <!-- 발송 주기 -->
    <section class="section collapsible" :class="{ open: sections.frequency }">
      <h4 class="section-title clickable" @click="sections.frequency = !sections.frequency">
        <span>발송 주기</span>
        <span class="chevron">{{ sections.frequency ? '▲' : '▼' }}</span>
      </h4>
      <div v-if="sections.frequency" class="section-body">
        <div class="form-group">
          <label>사용자별 최대 발송 횟수</label>
          <div class="inline-group">
            <input type="number" v-model.number="local.maxSendCount" class="input input-sm" min="1" @input="emitUpdate" />
            <span class="label-text">회</span>
          </div>
        </div>
        <div class="form-group">
          <label>최소 발송 간격</label>
          <div class="inline-group">
            <input type="number" v-model.number="local.minInterval" class="input input-sm" min="1" @input="emitUpdate" />
            <select v-model="local.minIntervalUnit" class="input input-sm" @change="emitUpdate">
              <option value="MINUTE">분</option>
              <option value="HOUR">시간</option>
              <option value="DAY">일</option>
            </select>
          </div>
        </div>
      </div>
    </section>

    <!-- 전환 이벤트 설정 -->
    <section class="section collapsible" :class="{ open: sections.conversion }">
      <h4 class="section-title clickable" @click="sections.conversion = !sections.conversion">
        <span>전환 이벤트 설정</span>
        <span class="chevron">{{ sections.conversion ? '▲' : '▼' }}</span>
      </h4>
      <div v-if="sections.conversion" class="section-body">
        <p class="hint">발송 후 전환 성공 여부를 추적할 이벤트를 설정합니다.</p>
        <div class="form-group">
          <label>전환 이벤트</label>
          <select v-model="local.conversionEvent" class="input" @change="emitUpdate">
            <option value="">선택 안 함</option>
            <option v-for="evt in settingsStore.events" :key="evt.id" :value="evt.name">{{ evt.label }}</option>
          </select>
        </div>
        <div class="form-group" v-if="local.conversionEvent">
          <label>전환 추적 기간</label>
          <div class="inline-group">
            <input type="number" v-model.number="local.conversionWindow" class="input input-sm" min="1" @input="emitUpdate" />
            <select v-model="local.conversionWindowUnit" class="input input-sm" @change="emitUpdate">
              <option value="HOUR">시간</option>
              <option value="DAY">일</option>
            </select>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed } from 'vue'
import { useSettingsStore } from '@/stores/settingsStore'

const settingsStore = useSettingsStore()

const props = defineProps<{ config: any }>()
const emit = defineEmits<{ update: [config: any] }>()

const DAYS = [
  { value: 'MON', label: '월' },
  { value: 'TUE', label: '화' },
  { value: 'WED', label: '수' },
  { value: 'THU', label: '목' },
  { value: 'FRI', label: '금' },
  { value: 'SAT', label: '토' },
  { value: 'SUN', label: '일' },
]

const local = reactive({
  channelType: props.config?.channelType || 'PUSH',
  configured: props.config?.configured || false,
  appId: props.config?.appId || '',
  mediaType: props.config?.mediaType || 'PUSH',
  title: props.config?.title || '',
  body: props.config?.body || '',
  clickUrl: props.config?.clickUrl || '',
  imageUrl: props.config?.imageUrl || '',
  sendType: props.config?.sendType || 'IMMEDIATE',
  scheduledTime: props.config?.scheduledTime || '',
  quietStart: props.config?.quietStart || '',
  quietEnd: props.config?.quietEnd || '',
  sendDays: props.config?.sendDays || ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
  maxSendCount: props.config?.maxSendCount || 1,
  minInterval: props.config?.minInterval || 1,
  minIntervalUnit: props.config?.minIntervalUnit || 'DAY',
  conversionEvent: props.config?.conversionEvent || '',
  conversionWindow: props.config?.conversionWindow || 24,
  conversionWindowUnit: props.config?.conversionWindowUnit || 'HOUR',
})

const test = reactive({
  targetType: 'TOKEN' as 'TOKEN' | 'USER_ID',
  targets: [''] as string[],
  sending: false,
  result: null as { type: 'success' | 'error'; message: string } | null,
})

const canTestSend = computed(() => {
  return local.title && local.body && test.targets.some((t) => t.trim())
})

function addTestTarget() {
  test.targets.push('')
}

function removeTestTarget(idx: number) {
  test.targets.splice(idx, 1)
}

async function handleTestSend() {
  test.sending = true
  test.result = null
  try {
    // 실제 API 호출 위치 (현재는 시뮬레이션)
    await new Promise((r) => setTimeout(r, 1500))
    const validTargets = test.targets.filter((t) => t.trim())
    test.result = {
      type: 'success',
      message: `${validTargets.length}건 테스트 발송을 요청했습니다.`,
    }
  } catch {
    test.result = {
      type: 'error',
      message: '테스트 발송에 실패했습니다. 다시 시도해주세요.',
    }
  } finally {
    test.sending = false
  }
}

const sections = reactive({
  personalization: false,
  sending: false,
  condition: false,
  frequency: false,
  conversion: false,
})

function toggleDay(day: string) {
  const idx = local.sendDays.indexOf(day)
  if (idx >= 0) {
    local.sendDays.splice(idx, 1)
  } else {
    local.sendDays.push(day)
  }
  emitUpdate()
}

function varDisplay(v: string) {
  return `\{\{${v}\}\}`
}

function insertVar(v: string) {
  local.body = (local.body || '') + varDisplay(v)
  emitUpdate()
}

function emitUpdate() {
  local.configured = !!(local.title && local.body)
  emit('update', { ...local, sendDays: [...local.sendDays] })
}
</script>

<style scoped>
.push-form {
  display: flex;
  flex-direction: column;
  gap: 0;
}

/* Section */
.section {
  padding: 14px 0;
  border-bottom: 1px solid #f3f4f6;
}

.section:last-child {
  border-bottom: none;
}

.section-title {
  font-size: 13px;
  font-weight: 700;
  color: #111827;
  margin: 0 0 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.section-title.clickable {
  cursor: pointer;
  user-select: none;
}

.section-title.clickable:hover {
  color: #2563eb;
}

.chevron {
  font-size: 10px;
  color: #9ca3af;
}

.collapsible:not(.open) .section-title {
  margin-bottom: 0;
}

.section-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.hint {
  font-size: 11px;
  color: #9ca3af;
  line-height: 1.4;
}

/* Form group */
.form-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 8px;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-group label {
  font-size: 11px;
  font-weight: 600;
  color: #6b7280;
}

.input {
  padding: 7px 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 13px;
  color: #111827;
  background: #fff;
  width: 100%;
}

.input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.1);
}

.textarea {
  resize: vertical;
  font-family: inherit;
}

.input-sm {
  width: auto;
  flex: 0 0 auto;
  min-width: 70px;
}

.char-count {
  font-size: 11px;
  color: #9ca3af;
  text-align: right;
}

.inline-group {
  display: flex;
  align-items: center;
  gap: 6px;
}

.label-text {
  font-size: 12px;
  color: #6b7280;
}

/* Radio */
.radio-group {
  display: flex;
  gap: 14px;
}

.radio-group.vertical {
  flex-direction: column;
  gap: 8px;
}

.radio-label {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  font-size: 13px;
  color: #374151;
  cursor: pointer;
}

.radio-label input[type="radio"] {
  margin-top: 2px;
}

.radio-desc {
  font-size: 11px;
  color: #9ca3af;
  margin: 0;
}

/* Message editor + preview */
.message-editor-area {
  display: flex;
  gap: 14px;
}

.editor-fields {
  flex: 1;
  min-width: 0;
}

/* Phone preview */
.preview-wrapper {
  flex-shrink: 0;
}

.phone-frame {
  width: 160px;
  min-height: 280px;
  background: #1a1a1a;
  border-radius: 20px;
  padding: 8px;
  position: relative;
}

.phone-notch {
  width: 50px;
  height: 6px;
  background: #333;
  border-radius: 3px;
  margin: 4px auto 8px;
}

.phone-screen {
  background: #f5f5f5;
  border-radius: 12px;
  min-height: 240px;
  overflow: hidden;
}

.phone-status-bar {
  background: #f5f5f5;
  padding: 6px 10px 4px;
  font-size: 10px;
  font-weight: 600;
  color: #333;
}

.push-preview-card {
  display: flex;
  gap: 8px;
  padding: 8px;
  margin: 4px 6px;
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
}

.preview-app-icon {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  background: #2563eb;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  flex-shrink: 0;
}

.preview-content {
  min-width: 0;
}

.preview-app-name {
  font-size: 8px;
  color: #9ca3af;
  margin-bottom: 2px;
}

.preview-title {
  font-size: 10px;
  font-weight: 700;
  color: #111;
  margin-bottom: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.preview-body {
  font-size: 9px;
  color: #555;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.preview-image-area {
  padding: 0 6px 6px;
}

.preview-image-area img {
  width: 100%;
  border-radius: 6px;
  display: block;
}

/* Personalization vars */
.var-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.var-tag {
  padding: 3px 8px;
  background: #eff6ff;
  color: #2563eb;
  border-radius: 4px;
  font-size: 11px;
  cursor: pointer;
  border: 1px solid #dbeafe;
}

.var-tag:hover {
  background: #dbeafe;
}

/* Days selector */
.day-selector {
  display: flex;
  gap: 4px;
}

.day-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 1px solid #d1d5db;
  background: #fff;
  font-size: 11px;
  font-weight: 600;
  color: #6b7280;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}

.day-btn.active {
  background: #2563eb;
  color: #fff;
  border-color: #2563eb;
}

.day-btn:hover:not(.active) {
  border-color: #2563eb;
  color: #2563eb;
}

/* Test send */
.test-section {
  background: #f9fafb;
  border-radius: 8px;
  padding: 14px !important;
  margin-top: 4px;
}

.test-row {
  margin-bottom: 8px;
}

.test-targets {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 10px;
}

.test-target-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.test-target-row .input {
  flex: 1;
}

.remove-target {
  background: none;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  font-size: 14px;
  padding: 4px;
}

.remove-target:hover {
  color: #ef4444;
}

.link-btn {
  background: none;
  border: none;
  color: #6b7280;
  font-size: 12px;
  cursor: pointer;
  padding: 2px 0;
  text-align: left;
}

.link-btn:hover {
  color: #2563eb;
}

.btn-test-send {
  width: 100%;
  padding: 9px;
  background: #111827;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}

.btn-test-send:hover:not(:disabled) {
  background: #1f2937;
}

.btn-test-send:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.test-result {
  margin-top: 8px;
  padding: 8px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
}

.test-result.success {
  background: #ecfdf5;
  color: #059669;
  border: 1px solid #a7f3d0;
}

.test-result.error {
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
}
</style>
