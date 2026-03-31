<template>
  <div class="wait-node">
    <Handle type="target" :position="Position.Top" />
    <div class="node-header">
      <span class="node-icon">⏱️</span>
      <span class="node-title">{{ data.label }}</span>
    </div>
    <div class="node-body">
      <div v-if="data.config?.duration" class="duration">
        {{ data.config.duration.value }} {{ unitLabel(data.config.duration.unit) }}
      </div>
      <div v-else class="warning">설정을 완료해주세요</div>
    </div>
    <div v-if="data.simCount !== undefined" class="sim-badge">{{ formatSim(data.simCount) }}명</div>
    <Handle type="source" :position="Position.Bottom" />
  </div>
</template>

<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'

const props = defineProps<{
  data: any
}>()

function formatSim(n: number) {
  if (n >= 10000) return (n / 10000).toFixed(1) + '만'
  return n.toLocaleString('ko-KR')
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
.wait-node {
  position: relative;
  background: #fff;
  border: 1px solid #fcd34d;
  border-left: 4px solid #f59e0b;
  border-radius: 12px;
  width: 250px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  overflow: visible;
}

.sim-badge {
  position: absolute;
  top: -10px;
  right: -10px;
  background: #7c3aed;
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 10px;
  white-space: nowrap;
  box-shadow: 0 2px 6px rgba(124, 58, 237, 0.3);
}

.node-header {
  background: #fffbeb;
  color: #92400e;
  padding: 10px 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
}

.node-body {
  padding: 10px 14px;
}

.duration {
  font-size: 18px;
  font-weight: 700;
  color: #92400e;
  text-align: center;
}

.warning {
  font-size: 12px;
  color: #dc2626;
}
</style>
