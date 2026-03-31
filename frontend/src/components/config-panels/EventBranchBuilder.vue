<template>
  <div class="event-builder">
    <!-- Event select -->
    <select v-model="local.eventName" class="event-select" @change="emitUpdate">
      <option value="">이벤트 선택</option>
      <option v-for="evt in settingsStore.events" :key="evt.id" :value="evt.name">
        {{ evt.label }} ({{ evt.name }})
      </option>
    </select>

    <!-- Filters -->
    <div v-for="(filter, fIdx) in local.filters" :key="fIdx" class="filter-row">
      <span v-if="fIdx > 0" class="filter-connector">AND</span>
      <div class="filter-fields">
        <select v-model="filter.property" class="filter-select" @change="emitUpdate">
          <option value="">검색 조건 선택하세요</option>
          <option v-for="prop in settingsStore.properties" :key="prop.id" :value="prop.name">{{ prop.label }}</option>
        </select>
        <select v-model="filter.operator" class="filter-operator" @change="emitUpdate">
          <option value="IN">다음 중 하나</option>
          <option value="NOT_IN">다음이 아닌</option>
          <option value="=">=</option>
          <option value="!=">!=</option>
          <option value=">">></option>
          <option value="<">&lt;</option>
        </select>
        <input
          type="text"
          v-model="filter.value"
          class="filter-value"
          placeholder="세부 항목을 선택하세요"
          @input="emitUpdate"
        />
        <button class="remove-filter" @click="removeFilter(fIdx)">🗑️</button>
      </div>
    </div>

    <button class="add-filter-btn" @click="addFilter">+ AND 조건 추가하기</button>
  </div>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue'
import type { EventBranchCondition } from '@/types/flow'
import { useSettingsStore } from '@/stores/settingsStore'

const settingsStore = useSettingsStore()

const props = defineProps<{
  condition: EventBranchCondition
}>()

const emit = defineEmits<{
  update: [condition: EventBranchCondition]
}>()

const local = reactive<EventBranchCondition>({
  eventName: props.condition?.eventName || '',
  filters: props.condition?.filters?.length
    ? JSON.parse(JSON.stringify(props.condition.filters))
    : [],
})

watch(() => props.condition, (val) => {
  if (val) {
    local.eventName = val.eventName || ''
    local.filters = val.filters?.length
      ? JSON.parse(JSON.stringify(val.filters))
      : []
  }
}, { deep: true })

function addFilter() {
  local.filters.push({ property: '', operator: 'IN', value: '' })
  emitUpdate()
}

function removeFilter(fIdx: number) {
  local.filters.splice(fIdx, 1)
  emitUpdate()
}

function emitUpdate() {
  emit('update', {
    eventName: local.eventName,
    filters: JSON.parse(JSON.stringify(local.filters)),
  })
}
</script>

<style scoped>
.event-builder {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.event-select {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 13px;
  background: #fff;
}

.filter-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.filter-connector {
  font-size: 10px;
  font-weight: 700;
  color: #2563eb;
  padding-left: 4px;
}

.filter-fields {
  display: flex;
  align-items: center;
  gap: 4px;
}

.filter-select {
  flex: 1;
  min-width: 0;
  padding: 6px 6px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 11px;
  background: #fff;
}

.filter-operator {
  width: 80px;
  flex-shrink: 0;
  padding: 6px 4px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 11px;
  background: #fff;
}

.filter-value {
  flex: 1;
  min-width: 0;
  padding: 6px 6px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 11px;
}

.remove-filter {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  padding: 2px;
  flex-shrink: 0;
  opacity: 0.5;
}

.remove-filter:hover {
  opacity: 1;
}

.add-filter-btn {
  background: none;
  border: none;
  color: #6b7280;
  font-size: 12px;
  cursor: pointer;
  padding: 4px 0;
  text-align: left;
}

.add-filter-btn:hover {
  color: #2563eb;
}
</style>
