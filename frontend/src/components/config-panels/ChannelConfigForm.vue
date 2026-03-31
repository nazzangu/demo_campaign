<template>
  <div class="form">
    <div class="form-group">
      <label>메시지 제목</label>
      <input type="text" v-model="localConfig.title" @input="emitUpdate" placeholder="제목을 입력하세요" />
    </div>
    <div class="form-group">
      <label>메시지 내용</label>
      <textarea v-model="localConfig.body" @input="emitUpdate" rows="4" placeholder="내용을 입력하세요"></textarea>
    </div>
    <div class="form-group" v-if="channelType === 'CHANNEL_WEBHOOK'">
      <label>Webhook URL</label>
      <input type="url" v-model="localConfig.url" @input="emitUpdate" placeholder="https://" />
    </div>
    <div class="form-group" v-if="channelType?.includes('BRAND') || channelType === 'CHANNEL_KAKAO'">
      <label>템플릿 ID</label>
      <input type="text" v-model="localConfig.templateId" @input="emitUpdate" placeholder="템플릿 ID" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue'

const props = defineProps<{ config: any; channelType: string }>()
const emit = defineEmits<{ update: [config: any] }>()

const localConfig = reactive({
  channelType: props.config?.channelType || '',
  title: props.config?.title || '',
  body: props.config?.body || '',
  url: props.config?.url || '',
  templateId: props.config?.templateId || '',
  configured: props.config?.configured || false,
})

watch(() => props.config, (val) => {
  if (val) Object.assign(localConfig, val)
}, { deep: true })

function emitUpdate() {
  localConfig.configured = !!(localConfig.title && localConfig.body)
  emit('update', { ...localConfig })
}
</script>

<style scoped>
.form {
  display: flex;
  flex-direction: column;
  gap: 14px;
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

.form-group input,
.form-group textarea {
  padding: 8px 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 13px;
  color: #111827;
  resize: vertical;
}
</style>
