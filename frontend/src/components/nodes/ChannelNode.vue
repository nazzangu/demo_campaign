<template>
  <div class="channel-node" :style="{ borderLeftColor: nodeColor }">
    <Handle type="target" :position="Position.Top" />
    <div class="node-header" :style="{ background: nodeColor + '15', color: nodeColor }">
      <span class="node-icon">{{ nodeIcon }}</span>
      <span class="node-title">{{ data.label }}</span>
      <button class="menu-btn">⋮</button>
    </div>
    <div class="node-body">
      <div v-if="!data.config?.configured" class="warning">
        ⚠️ 설정을 완료해주세요
      </div>
      <div v-else class="configured">
        <div>✅ 설정 완료</div>
        <div v-if="messageTitle" class="msg-title">{{ messageTitle }}</div>
      </div>
    </div>
    <Handle id="success" type="source" :position="Position.Bottom" :style="{ left: '30%' }" />
    <Handle id="failure" type="source" :position="Position.Bottom" :style="{ left: '70%' }" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Handle, Position } from '@vue-flow/core'
import { getNodeColor } from '@/utils/nodeDefaults'
import { useSettingsStore } from '@/stores/settingsStore'
import type { NodeType } from '@/types/flow'

const settingsStore = useSettingsStore()

const props = defineProps<{
  type: string
  data: any
}>()

const storeChannel = computed(() => settingsStore.channels.find((c) => c.type === props.type))

const nodeColor = computed(() => storeChannel.value?.color || getNodeColor(props.type as NodeType))

const nodeIcon = computed(() => storeChannel.value?.icon || '📨')

const messageTitle = computed(() => {
  const config = props.data?.config
  if (!config) return ''
  return config.title || config.name || ''
})
</script>

<style scoped>
.channel-node {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-left: 4px solid;
  border-radius: 12px;
  width: 250px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.node-header {
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

.menu-btn:hover {
  opacity: 1;
}

.node-body {
  padding: 10px 14px;
}

.warning {
  font-size: 12px;
  color: #dc2626;
  background: #fef2f2;
  padding: 6px 10px;
  border-radius: 6px;
}

.configured {
  font-size: 12px;
  color: #059669;
  background: #ecfdf5;
  padding: 6px 10px;
  border-radius: 6px;
}

.msg-title {
  margin-top: 4px;
  font-size: 11px;
  color: #374151;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
