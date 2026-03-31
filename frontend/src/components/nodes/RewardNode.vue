<template>
  <div class="reward-node" :style="{ borderLeftColor: nodeColor }">
    <Handle type="target" :position="Position.Top" />
    <div class="node-header" :style="{ background: nodeColor + '15', color: nodeColor }">
      <span class="node-icon">{{ data.config?.rewardType === 'POINT' ? '💰' : '🎟️' }}</span>
      <span class="node-title">{{ data.label }}</span>
      <div class="menu-wrapper">
        <button class="menu-btn" @click.stop="showMenu = !showMenu">⋮</button>
        <div v-if="showMenu" class="dropdown-menu">
          <button class="dropdown-item delete" @click.stop="handleDelete">🗑️ 노드 삭제</button>
        </div>
      </div>
    </div>
    <div class="node-body">
      <div v-if="!data.config?.configured" class="warning">
        ⚠️ 설정을 완료해주세요
      </div>
      <div v-else class="configured">
        <div>✅ {{ data.config.rewardName }}</div>
        <div class="reward-value">{{ data.config.value }}</div>
      </div>
    </div>
    <Handle type="source" :position="Position.Bottom" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { Handle, Position, useNode } from '@vue-flow/core'

const { id } = useNode()

const showMenu = ref(false)

function handleDelete() {
  showMenu.value = false
  window.dispatchEvent(new CustomEvent('flow-delete-node', { detail: { nodeId: id } }))
}

function closeMenu() {
  showMenu.value = false
}

onMounted(() => document.addEventListener('click', closeMenu))
onBeforeUnmount(() => document.removeEventListener('click', closeMenu))

defineProps<{
  type: string
  data: any
}>()

const nodeColor = computed(() => '#E67E22')
</script>

<style scoped>
.reward-node {
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

.menu-wrapper {
  margin-left: auto;
  position: relative;
}

.menu-btn {
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

.dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 4px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  z-index: 50;
  min-width: 120px;
  overflow: hidden;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  padding: 8px 12px;
  background: none;
  border: none;
  font-size: 13px;
  cursor: pointer;
  white-space: nowrap;
}

.dropdown-item.delete {
  color: #dc2626;
}

.dropdown-item.delete:hover {
  background: #fef2f2;
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

.reward-value {
  margin-top: 4px;
  font-size: 11px;
  font-weight: 700;
  color: #92400e;
}
</style>
