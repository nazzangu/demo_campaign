<template>
  <div class="form">
    <div class="form-group">
      <label>대기 시간</label>
      <div class="inline-group">
        <input type="number" v-model.number="localConfig.duration.value" min="1" @input="emitUpdate" />
        <select v-model="localConfig.duration.unit" @change="emitUpdate">
          <option value="MINUTE">분</option>
          <option value="HOUR">시간</option>
          <option value="DAY">일</option>
        </select>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue'

const props = defineProps<{ config: any }>()
const emit = defineEmits<{ update: [config: any] }>()

const localConfig = reactive({
  duration: props.config?.duration || { value: 1, unit: 'HOUR' },
})

watch(() => props.config, (val) => {
  if (val?.duration) localConfig.duration = { ...val.duration }
}, { deep: true })

function emitUpdate() {
  emit('update', { duration: { ...localConfig.duration } })
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

.inline-group {
  display: flex;
  gap: 8px;
}

.inline-group input {
  width: 80px;
  padding: 8px 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 13px;
}

.inline-group select {
  padding: 8px 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 13px;
}
</style>
