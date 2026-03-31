<template>
  <div class="form">
    <div class="form-group">
      <label>대상 사용자</label>
      <select v-model="localConfig.audienceType" @change="emitUpdate">
        <option value="ALL_USERS">모든 사용자</option>
        <option value="SEGMENT">세그먼트</option>
      </select>
    </div>
    <div class="form-group">
      <label>시작일</label>
      <input type="date" v-model="localConfig.period.start" @change="emitUpdate" />
    </div>
    <div class="form-group">
      <label>종료 조건</label>
      <select v-model="localConfig.endCondition" @change="emitUpdate">
        <option value="NONE">종료 안함</option>
        <option value="DATE">날짜 지정</option>
      </select>
    </div>
    <div class="form-group" v-if="localConfig.endCondition === 'DATE'">
      <label>종료일</label>
      <input type="date" v-model="localConfig.period.end" @change="emitUpdate" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue'

const props = defineProps<{ config: any }>()
const emit = defineEmits<{ update: [config: any] }>()

const localConfig = reactive({
  audienceType: props.config?.audienceType || 'ALL_USERS',
  events: props.config?.events || [],
  period: {
    start: props.config?.period?.start || null,
    end: props.config?.period?.end || null,
  },
  endCondition: props.config?.endCondition || 'NONE',
})

watch(() => props.config, (val) => {
  if (val) {
    localConfig.audienceType = val.audienceType || 'ALL_USERS'
    localConfig.events = val.events || []
    localConfig.period = { start: val.period?.start || null, end: val.period?.end || null }
    localConfig.endCondition = val.endCondition || 'NONE'
  }
}, { deep: true })

function emitUpdate() {
  emit('update', {
    audienceType: localConfig.audienceType,
    events: localConfig.events,
    period: { ...localConfig.period },
    endCondition: localConfig.endCondition,
  })
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

.form-group select,
.form-group input {
  padding: 8px 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 13px;
  color: #111827;
}
</style>
