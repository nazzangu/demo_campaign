<template>
  <div class="branch-node">
    <Handle type="target" :position="Position.Top" />
    <div class="node-header">
      <span class="node-icon">{{ data.config?.branchType === 'EVENT' ? '⚡' : '👤' }}</span>
      <span class="node-title">{{ data.label }}</span>
      <button class="menu-btn">⋮</button>
    </div>
    <div class="node-body">
      <div v-if="data.config?.waitDuration" class="wait-badge">
        ⏱️ {{ data.config.waitDuration.value }} {{ unitLabel(data.config.waitDuration.unit) }}
      </div>
      <div class="branch-list">
        <div
          v-for="branch in branches"
          :key="branch.index"
          class="branch-item"
        >
          <span class="branch-number" :style="{ background: branchColor(branch.index) }">
            {{ branch.index }}
          </span>
          <span class="branch-label">{{ branch.label }}</span>
        </div>
      </div>
    </div>
    <Handle
      v-for="branch in branches"
      :key="'handle-' + branch.index"
      :id="'branch-' + branch.index"
      type="source"
      :position="Position.Bottom"
      :style="handleStyle(branch.index)"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Handle, Position } from '@vue-flow/core'

const props = defineProps<{
  data: any
}>()

const branches = computed(() => props.data.config?.branches || [])

const BRANCH_COLORS = ['#E74C3C', '#F39C12', '#3498DB', '#2ECC71', '#9B59B6', '#1ABC9C']

function branchColor(index: number): string {
  return BRANCH_COLORS[(index - 1) % BRANCH_COLORS.length]
}

function handleStyle(index: number) {
  const total = branches.value.length
  const offset = (index / (total + 1)) * 100
  return { left: `${offset}%` }
}

function unitLabel(unit: string): string {
  switch (unit) {
    case 'MINUTE': return '분'
    case 'HOUR': return '시간'
    case 'DAY': return '일'
    default: return unit
  }
}
</script>

<style scoped>
.branch-node {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  min-width: 220px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.node-header {
  background: #f3e8ff;
  color: #7c3aed;
  padding: 10px 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
}

.menu-btn {
  margin-left: auto;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  color: inherit;
  opacity: 0.6;
}

.node-body {
  padding: 10px 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.wait-badge {
  font-size: 12px;
  color: #92400e;
  background: #fef3c7;
  padding: 4px 8px;
  border-radius: 4px;
  display: inline-block;
  width: fit-content;
}

.branch-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.branch-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.branch-number {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  flex-shrink: 0;
}

.branch-label {
  color: #4b5563;
}
</style>
