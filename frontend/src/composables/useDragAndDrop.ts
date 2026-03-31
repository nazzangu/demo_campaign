import { ref } from 'vue'
import type { NodeType } from '@/types/flow'

const draggedType = ref<NodeType | null>(null)

export function useDragAndDrop() {
  function onDragStart(event: DragEvent, type: NodeType) {
    if (event.dataTransfer) {
      event.dataTransfer.setData('application/vueflow', type)
      event.dataTransfer.effectAllowed = 'move'
    }
    draggedType.value = type
  }

  function onDragEnd() {
    draggedType.value = null
  }

  return {
    draggedType,
    onDragStart,
    onDragEnd,
  }
}
