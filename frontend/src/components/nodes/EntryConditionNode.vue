<template>
  <div class="entry-node">
    <div class="node-header">
      <span class="node-icon">🎯</span>
      <span class="node-title">{{ data.label }}</span>
    </div>
    <div class="node-body">
      <div class="info-row">
        <span class="info-label">👤 모든 사용자</span>
      </div>
      <div class="info-row" v-if="data.config?.period?.start">
        <span class="info-label">📅 기간 시작: {{ data.config.period.start }}</span>
      </div>
      <div class="info-row sub-section">
        <span class="info-icon">🚪</span>
        <span class="info-label">이탈 조건</span>
      </div>
    </div>
    <Handle type="source" :position="Position.Bottom" />
  </div>
</template>

<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'

defineProps<{
  data: any
}>()
</script>

<style scoped>
.entry-node {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  min-width: 240px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.node-header {
  background: #2c3e50;
  color: #fff;
  padding: 10px 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
}

.node-icon {
  font-size: 14px;
}

.node-body {
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #4b5563;
}

.sub-section {
  margin-top: 4px;
  padding-top: 8px;
  border-top: 1px dashed #e5e7eb;
}

.info-icon {
  font-size: 12px;
}
</style>
