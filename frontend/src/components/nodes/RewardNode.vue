<template>
  <div class="reward-node" :style="{ borderLeftColor: nodeColor }">
    <Handle type="target" :position="Position.Top" />
    <div class="node-header" :style="{ background: nodeColor + '15', color: nodeColor }">
      <span class="node-icon">{{ data.config?.rewardType === 'POINT' ? '💰' : '🎟️' }}</span>
      <input
        v-if="editing"
        ref="editInput"
        class="node-title-input"
        :value="data.label"
        @blur="finishEdit($event)"
        @keyup.enter="($event.target as HTMLInputElement).blur()"
        @keyup.escape="editing = false"
        @click.stop
        @mousedown.stop
      />
      <span v-else class="node-title" @dblclick.stop="startEdit">{{ data.label }}</span>
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
    <div v-if="data.simCount !== undefined" class="sim-badge">{{ formatSim(data.simCount) }}명</div>
    <Handle type="source" :position="Position.Bottom" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { Handle, Position, useNode } from '@vue-flow/core'

const { id } = useNode()

const showMenu = ref(false)
const editing = ref(false)
const editInput = ref<HTMLInputElement | null>(null)

function startEdit() {
  editing.value = true
  nextTick(() => editInput.value?.select())
}

function finishEdit(e: FocusEvent) {
  const val = (e.target as HTMLInputElement).value.trim()
  editing.value = false
  if (val && val !== props.data.label) {
    window.dispatchEvent(new CustomEvent('flow-rename-node', { detail: { nodeId: id, label: val } }))
  }
}

function handleDelete() {
  showMenu.value = false
  window.dispatchEvent(new CustomEvent('flow-delete-node', { detail: { nodeId: id } }))
}

function closeMenu() {
  showMenu.value = false
}

onMounted(() => document.addEventListener('click', closeMenu))
onBeforeUnmount(() => document.removeEventListener('click', closeMenu))

const props = defineProps<{
  type: string
  data: any
}>()

function formatSim(n: number) {
  if (n >= 10000) return (n / 10000).toFixed(1) + '만'
  return n.toLocaleString('ko-KR')
}

const nodeColor = computed(() => '#E67E22')
</script>

<style scoped>
.reward-node {
  position: relative;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-left: 4px solid;
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

.node-title { cursor: default; }
.node-title-input { background: rgba(255,255,255,0.8); border: 1px solid currentColor; border-radius: 4px; padding: 1px 4px; font-size: inherit; font-weight: inherit; color: inherit; width: 100%; min-width: 0; outline: none; }

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
