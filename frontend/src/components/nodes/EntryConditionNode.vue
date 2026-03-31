<template>
  <div class="entry-node">
    <div class="node-header">
      <span class="node-icon">🎯</span>
      <span class="node-title">{{ data.label }}</span>
    </div>
    <div class="node-body">
      <div class="info-row">
        <span class="info-icon">👤</span>
        <span class="info-label">{{ audienceLabel }}</span>
      </div>
      <div class="info-row" v-if="data.config?.period?.start">
        <span class="info-icon">📅</span>
        <span class="info-label">시작: {{ data.config.period.start }}</span>
      </div>
      <div class="info-row" v-if="data.config?.endCondition === 'DATE' && data.config?.period?.end">
        <span class="info-icon">🏁</span>
        <span class="info-label">종료: {{ data.config.period.end }}</span>
      </div>
      <div class="info-row" v-else-if="data.config?.endCondition === 'NONE'">
        <span class="info-icon">🏁</span>
        <span class="info-label">종료 안함</span>
      </div>
    </div>
    <div v-if="data.simCount !== undefined" class="sim-badge">{{ formatSim(data.simCount) }}명</div>
    <Handle type="source" :position="Position.Bottom" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Handle, Position } from '@vue-flow/core'

const props = defineProps<{
  data: any
}>()

const audienceLabel = computed(() => {
  return props.data.config?.audienceType === 'SEGMENT' ? '세그먼트' : '모든 사용자'
})

function formatSim(n: number) {
  if (n >= 10000) return (n / 10000).toFixed(1) + '만'
  return n.toLocaleString('ko-KR')
}
</script>

<style scoped>
.entry-node {
  position: relative;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  width: 250px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  overflow: visible;
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
  padding: 10px 14px;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #4b5563;
}

.info-icon {
  font-size: 12px;
  flex-shrink: 0;
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
</style>
