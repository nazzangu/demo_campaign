<template>
  <div class="form">
    <!-- EVENT: 대기 시간 -->
    <div class="form-group" v-if="localConfig.branchType === 'EVENT'">
      <label>대기 시간</label>
      <div class="wait-desc">
        이벤트가 발생할 때까지
        <input type="number" v-model.number="localConfig.waitDuration.value" min="1" class="input-inline" @input="emitUpdate" />
        <select v-model="localConfig.waitDuration.unit" class="select-inline" @change="emitUpdate">
          <option value="MINUTE">분</option>
          <option value="HOUR">시간</option>
          <option value="DAY">일</option>
        </select>
        동안 대기합니다.
      </div>
    </div>

    <div class="branches-section">
      <div v-for="(branch, idx) in localConfig.branches" :key="idx" class="branch-block">
        <!-- Branch header -->
        <div class="branch-header">
          <span class="branch-idx">{{ branch.index }}</span>
          <input
            v-if="!branch.isDefault"
            type="text"
            v-model="branch.label"
            class="branch-name-input"
            @input="emitUpdate"
          />
          <span v-else class="branch-name-text">{{ branch.label }}</span>
          <button
            v-if="!branch.isDefault && localConfig.branches.length > 2"
            class="remove-btn"
            @click="removeBranch(idx)"
          >✕</button>
        </div>

        <!-- USER branch: cohort rules -->
        <div v-if="localConfig.branchType === 'USER' && !branch.isDefault" class="branch-body">
          <CohortRuleBuilder
            :rules="branch.rules || []"
            :rules-operator="branch.rulesOperator || 'AND'"
            @update="(rules, op) => updateBranchRules(idx, rules, op)"
          />
        </div>

        <!-- EVENT branch: event condition -->
        <div v-if="localConfig.branchType === 'EVENT' && !branch.isDefault" class="branch-body">
          <EventBranchBuilder
            :condition="branch.eventCondition || { eventName: '', filters: [] }"
            @update="(cond) => updateEventCondition(idx, cond)"
          />
        </div>

        <!-- Default branch -->
        <div v-if="branch.isDefault" class="default-label">
          위 조건에 해당하지 않는 그 외 모든 사용자입니다.
        </div>
      </div>

      <button class="add-group-btn" @click="addBranch">+ 사용자 그룹 추가하기</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue'
import CohortRuleBuilder from './CohortRuleBuilder.vue'
import EventBranchBuilder from './EventBranchBuilder.vue'

const props = defineProps<{ config: any }>()
const emit = defineEmits<{ update: [config: any] }>()

const localConfig = reactive({
  branchType: props.config?.branchType || 'USER',
  waitDuration: props.config?.waitDuration || { value: 1, unit: 'DAY' },
  branches: props.config?.branches || [
    { index: 1, label: '그룹 1', condition: {}, rules: [], rulesOperator: 'AND', eventCondition: { eventName: '', filters: [] } },
    { index: 2, label: '그 외 사용자', condition: {}, isDefault: true },
  ],
})

watch(() => props.config, (val) => {
  if (val) {
    localConfig.branchType = val.branchType || 'USER'
    localConfig.waitDuration = val.waitDuration || { value: 1, unit: 'DAY' }
    localConfig.branches = val.branches || []
  }
}, { deep: true })

function addBranch() {
  const defaultBranch = localConfig.branches.find((b: any) => b.isDefault)
  const newIndex = defaultBranch ? defaultBranch.index : localConfig.branches.length + 1

  const newBranch: any = {
    index: newIndex,
    label: localConfig.branchType === 'EVENT' ? `그룹 ${newIndex}` : `그룹 ${newIndex}`,
    condition: {},
    rules: [],
    rulesOperator: 'AND',
    eventCondition: { eventName: '', filters: [] },
  }

  if (defaultBranch) {
    const defIdx = localConfig.branches.indexOf(defaultBranch)
    localConfig.branches.splice(defIdx, 0, newBranch)
    defaultBranch.index = newIndex + 1
  } else {
    localConfig.branches.push(newBranch)
  }
  reindex()
  emitUpdate()
}

function removeBranch(idx: number) {
  localConfig.branches.splice(idx, 1)
  reindex()
  emitUpdate()
}

function reindex() {
  localConfig.branches.forEach((b: any, i: number) => {
    b.index = i + 1
  })
}

function updateBranchRules(idx: number, rules: any[], rulesOperator: 'AND' | 'OR') {
  localConfig.branches[idx].rules = rules
  localConfig.branches[idx].rulesOperator = rulesOperator
  emitUpdate()
}

function updateEventCondition(idx: number, condition: any) {
  localConfig.branches[idx].eventCondition = condition
  emitUpdate()
}

function emitUpdate() {
  emit('update', {
    branchType: localConfig.branchType,
    waitDuration: { ...localConfig.waitDuration },
    branches: localConfig.branches.map((b: any) => ({ ...b })),
  })
}
</script>

<style scoped>
.form {
  display: flex;
  flex-direction: column;
  gap: 16px;
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

.wait-desc {
  font-size: 13px;
  color: #374151;
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.input-inline {
  width: 52px;
  padding: 5px 8px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 13px;
  text-align: center;
}

.select-inline {
  padding: 5px 8px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 13px;
}

.branches-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.branch-block {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 12px;
  background: #fff;
}

.branch-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.branch-idx {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #8b5cf6;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  flex-shrink: 0;
}

.branch-name-input {
  flex: 1;
  padding: 5px 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
}

.branch-name-text {
  flex: 1;
  font-size: 13px;
  font-weight: 600;
  color: #374151;
}

.branch-body {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #f3f4f6;
}

.default-label {
  font-size: 12px;
  color: #9ca3af;
  margin-top: 4px;
}

.remove-btn {
  background: none;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  font-size: 16px;
  padding: 2px 4px;
}

.remove-btn:hover {
  color: #ef4444;
}

.add-group-btn {
  width: 100%;
  padding: 10px;
  background: #fff;
  border: 2px solid #2563eb;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #2563eb;
  cursor: pointer;
  transition: background 0.2s;
}

.add-group-btn:hover {
  background: #eff6ff;
}
</style>
