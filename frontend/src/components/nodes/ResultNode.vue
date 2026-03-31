<template>
  <div class="result-node" :class="resultClass">
    <Handle type="target" :position="Position.Top" />
    <span class="result-icon">{{ isSuccess ? '✅' : '❌' }}</span>
    <span class="result-label">{{ data.label }}</span>
    <div v-if="data.simCount !== undefined" class="sim-badge">{{ formatSim(data.simCount) }}명</div>
    <Handle type="source" :position="Position.Bottom" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Handle, Position } from '@vue-flow/core'

const props = defineProps<{
  type: string
  data: any
}>()

const isSuccess = computed(() => props.type === 'RESULT_SUCCESS')
const resultClass = computed(() => isSuccess.value ? 'success' : 'failure')

function formatSim(n: number) {
  if (n >= 10000) return (n / 10000).toFixed(1) + '만'
  return n.toLocaleString('ko-KR')
}
</script>

<style scoped>
.result-node {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 130px;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
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

.result-node.success {
  background: #ecfdf5;
  border: 2px solid #34d399;
  color: #065f46;
}

.result-node.failure {
  background: #fef2f2;
  border: 2px solid #f87171;
  color: #991b1b;
}

.result-icon {
  font-size: 14px;
}
</style>
