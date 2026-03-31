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
    <Handle type="source" :position="Position.Bottom" />
  </div>
</template>

<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'

defineProps<{
  data: any
}>()

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
  background: #fff;
  border: 1px solid #fcd34d;
  border-left: 4px solid #f59e0b;
  border-radius: 12px;
  width: 250px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  overflow: hidden;
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
