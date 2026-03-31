<template>
  <div class="result-node" :class="resultClass">
    <Handle type="target" :position="Position.Top" />
    <span class="result-icon">{{ isSuccess ? '✅' : '❌' }}</span>
    <span class="result-label">{{ data.label }}</span>
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
</script>

<style scoped>
.result-node {
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
