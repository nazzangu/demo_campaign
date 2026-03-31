<template>
  <div
    class="palette-item"
    draggable="true"
    @dragstart="onDragStart($event, item.type)"
    @dragend="onDragEnd"
  >
    <span class="item-icon" :style="{ color: item.color }">{{ item.icon }}</span>
    <span class="item-label">{{ item.label }}</span>
  </div>
</template>

<script setup lang="ts">
import type { SidebarNodeItem } from '@/types/flow'
import { useDragAndDrop } from '@/composables/useDragAndDrop'

defineProps<{
  item: SidebarNodeItem
}>()

const { onDragStart, onDragEnd } = useDragAndDrop()
</script>

<style scoped>
.palette-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  cursor: grab;
  background: #fff;
  font-size: 13px;
  transition: all 0.15s;
  user-select: none;
}

.palette-item:hover {
  background: #f9fafb;
  border-color: #d1d5db;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.palette-item:active {
  cursor: grabbing;
  opacity: 0.7;
}

.item-icon {
  font-size: 16px;
  flex-shrink: 0;
}

.item-label {
  font-size: 13px;
  color: #374151;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
