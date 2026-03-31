<template>
  <div class="rule-builder">
    <div v-for="(rule, rIdx) in rules" :key="rIdx" class="rule-block">
      <!-- Rule header -->
      <div class="rule-header">
        <span class="rule-title">코호트 규칙 {{ rIdx + 1 }}</span>
        <button v-if="rules.length > 1" class="remove-icon" @click="removeRule(rIdx)">✕</button>
      </div>

      <!-- Conditions within a rule -->
      <div v-for="(cond, cIdx) in rule.conditions" :key="cIdx" class="condition-block">
        <!-- OR/AND connector between conditions -->
        <div v-if="cIdx > 0" class="connector-row">
          <button
            class="connector-btn"
            :class="rule.conditionOperator.toLowerCase()"
            @click="toggleConditionOperator(rIdx)"
          >{{ rule.conditionOperator }}</button>
        </div>

        <div class="condition-card">
          <!-- Row 1: Event + Period -->
          <div class="cond-row">
            <select v-model="cond.eventType" class="input-select" @change="emitUpdate">
              <option value="">이벤트 선택</option>
              <option v-for="evt in settingsStore.events" :key="evt.id" :value="evt.name">
                {{ evt.label }}
              </option>
            </select>
            <select v-model="cond.periodType" class="input-select period-select" @change="emitUpdate">
              <option value="SPECIFIC">특정 기간</option>
              <option value="RELATIVE">지난 N일 이내</option>
            </select>
          </div>

          <!-- Row 2: Period details -->
          <div class="cond-row" v-if="cond.periodType === 'SPECIFIC'">
            <input type="date" v-model="cond.specificStart" class="input-date" @change="emitUpdate" />
            <span class="label-text">~</span>
            <input type="date" v-model="cond.specificEnd" class="input-date" @change="emitUpdate" />
            <span class="label-text">동안</span>
          </div>
          <div class="cond-row" v-else>
            <span class="label-text">지난</span>
            <input type="number" v-model.number="cond.relativeDays" class="input-number" min="1" @input="emitUpdate" />
            <span class="label-text">일 이내</span>
          </div>

          <!-- Row 3: Aggregate -->
          <div class="cond-row">
            <select v-model="cond.aggregateType" class="input-select-sm" @change="emitUpdate">
              <option value="COUNT">횟수 (Count)</option>
              <option value="SUM">합계 (Sum)</option>
            </select>
            <select v-model="cond.aggregateOperator" class="input-select-sm" @change="emitUpdate">
              <option value=">=">≥</option>
              <option value="<=">≤</option>
              <option value="=">=</option>
              <option value=">">></option>
              <option value="<">&lt;</option>
            </select>
            <input type="number" v-model.number="cond.aggregateValue" class="input-number" min="0" @input="emitUpdate" />
            <span class="label-text">회 발생시킨 사용자</span>
          </div>

          <!-- Property Filters -->
          <div v-for="(filter, fIdx) in cond.filters" :key="fIdx" class="filter-row">
            <span class="filter-connector">AND</span>
            <span class="label-text">속성</span>
            <select v-model="filter.property" class="input-text-sm" @change="emitUpdate">
              <option value="">선택</option>
              <option v-for="p in settingsStore.properties" :key="p.id" :value="p.name">{{ p.label }}</option>
            </select>
            <select v-model="filter.operator" class="input-select-xs" @change="emitUpdate">
              <option value="=">=</option>
              <option value="!=">!=</option>
              <option value=">">></option>
              <option value="<">&lt;</option>
              <option value=">=">>=</option>
              <option value="<="><=</option>
              <option value="contains">포함</option>
            </select>
            <input type="text" v-model="filter.value" placeholder="값" class="input-text-sm" @input="emitUpdate" />
            <button class="remove-icon-sm" @click="removeFilter(rIdx, cIdx, fIdx)">✕</button>
          </div>

          <button class="link-btn" @click="addFilter(rIdx, cIdx)">+ 속성 필터 추가</button>
        </div>
      </div>

      <button class="add-condition-btn" @click="addCondition(rIdx)">+ 조건 추가</button>
    </div>

    <!-- AND connector between rules -->
    <div v-if="rules.length > 0" class="rules-connector">
      <button
        class="connector-btn and"
        @click="toggleRulesOperator"
      >{{ rulesOperator }}</button>
    </div>

    <button class="add-rule-btn" @click="addRule">+ 규칙 추가</button>
  </div>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue'
import type { CohortRule, RuleCondition } from '@/types/flow'
import { useSettingsStore } from '@/stores/settingsStore'

const settingsStore = useSettingsStore()

const props = defineProps<{
  rules: CohortRule[]
  rulesOperator: 'AND' | 'OR'
}>()

const emit = defineEmits<{
  update: [rules: CohortRule[], rulesOperator: 'AND' | 'OR']
}>()

const rules = reactive<CohortRule[]>(
  props.rules?.length
    ? JSON.parse(JSON.stringify(props.rules))
    : [createDefaultRule()]
)
let rulesOperator = props.rulesOperator || 'AND'

watch(() => props.rules, (val) => {
  if (val) {
    rules.splice(0, rules.length, ...JSON.parse(JSON.stringify(val)))
  }
}, { deep: true })

function createDefaultCondition(): RuleCondition {
  return {
    eventType: '',
    periodType: 'RELATIVE',
    specificStart: '',
    specificEnd: '',
    relativeDays: 7,
    aggregateType: 'COUNT',
    aggregateOperator: '>=',
    aggregateValue: 1,
    filters: [],
  }
}

function createDefaultRule(): CohortRule {
  return {
    conditions: [createDefaultCondition()],
    conditionOperator: 'AND',
  }
}

function addRule() {
  rules.push(createDefaultRule())
  emitUpdate()
}

function removeRule(rIdx: number) {
  rules.splice(rIdx, 1)
  emitUpdate()
}

function addCondition(rIdx: number) {
  rules[rIdx].conditions.push(createDefaultCondition())
  emitUpdate()
}

function toggleConditionOperator(rIdx: number) {
  rules[rIdx].conditionOperator = rules[rIdx].conditionOperator === 'AND' ? 'OR' : 'AND'
  emitUpdate()
}

function toggleRulesOperator() {
  rulesOperator = rulesOperator === 'AND' ? 'OR' : 'AND'
  emitUpdate()
}

function addFilter(rIdx: number, cIdx: number) {
  rules[rIdx].conditions[cIdx].filters.push({
    property: '',
    operator: '=',
    value: '',
  })
  emitUpdate()
}

function removeFilter(rIdx: number, cIdx: number, fIdx: number) {
  rules[rIdx].conditions[cIdx].filters.splice(fIdx, 1)
  emitUpdate()
}

function emitUpdate() {
  emit('update', JSON.parse(JSON.stringify(rules)), rulesOperator)
}
</script>

<style scoped>
.rule-builder {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.rule-block {
  background: #fafafa;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 12px;
}

.rule-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.rule-title {
  font-size: 12px;
  font-weight: 700;
  color: #374151;
}

.condition-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.condition-block {
  margin-bottom: 8px;
}

.cond-row {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.label-text {
  font-size: 12px;
  color: #6b7280;
  white-space: nowrap;
}

.input-select {
  padding: 5px 8px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 12px;
  background: #fff;
  min-width: 0;
  flex: 1;
}

.period-select {
  flex: 0 0 auto;
  width: auto;
}

.input-select-sm {
  padding: 4px 6px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 11px;
  background: #fff;
}

.input-select-xs {
  padding: 4px 4px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 11px;
  background: #fff;
  width: 48px;
}

.input-number {
  width: 52px;
  padding: 4px 6px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 12px;
  text-align: center;
}

.input-date {
  padding: 4px 6px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 11px;
  flex: 1;
  min-width: 0;
}

.input-text-sm {
  padding: 4px 6px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 11px;
  width: 64px;
}

.filter-row {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
  padding-left: 4px;
  border-left: 2px solid #e5e7eb;
  margin-left: 4px;
}

.filter-connector {
  font-size: 10px;
  font-weight: 700;
  color: #8b5cf6;
  margin-right: 2px;
}

.connector-row {
  display: flex;
  justify-content: flex-start;
  padding: 4px 0;
}

.connector-btn {
  padding: 2px 10px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  border: none;
}

.connector-btn.and {
  background: #dbeafe;
  color: #2563eb;
}

.connector-btn.or {
  background: #fce7f3;
  color: #db2777;
}

.rules-connector {
  display: flex;
  justify-content: center;
  padding: 2px 0;
}

.link-btn {
  background: none;
  border: none;
  color: #6b7280;
  font-size: 11px;
  cursor: pointer;
  padding: 4px 0;
  text-align: left;
}

.link-btn:hover {
  color: #2563eb;
}

.add-condition-btn {
  background: none;
  border: 1px dashed #d1d5db;
  border-radius: 6px;
  padding: 6px;
  font-size: 12px;
  color: #6b7280;
  cursor: pointer;
  margin-top: 4px;
}

.add-condition-btn:hover {
  background: #f3f4f6;
}

.add-rule-btn {
  background: #f3f4f6;
  border: 1px dashed #d1d5db;
  border-radius: 6px;
  padding: 8px;
  font-size: 12px;
  color: #6b7280;
  cursor: pointer;
}

.add-rule-btn:hover {
  background: #e5e7eb;
}

.remove-icon {
  background: none;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  font-size: 14px;
}

.remove-icon:hover {
  color: #ef4444;
}

.remove-icon-sm {
  background: none;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  font-size: 12px;
  padding: 0 2px;
}

.remove-icon-sm:hover {
  color: #ef4444;
}
</style>
