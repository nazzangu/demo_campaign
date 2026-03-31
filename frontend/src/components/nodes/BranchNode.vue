<template>
  <div class="branch-node">
    <Handle type="target" :position="Position.Top" />
    <div class="node-header">
      <span class="node-icon">{{ data.config?.branchType === 'EVENT' ? '⚡' : '👤' }}</span>
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
    <div v-if="data.simCount !== undefined" class="sim-badge">{{ formatSim(data.simCount) }}명</div>
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
import { computed, ref, nextTick, onMounted, onBeforeUnmount } from 'vue'
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
.branch-node {
  position: relative;
  background: #fff;
  border: 1px solid #e5e7eb;
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
  background: #f3e8ff;
  color: #7c3aed;
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
