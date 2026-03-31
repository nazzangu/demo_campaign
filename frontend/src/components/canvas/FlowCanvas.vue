<template>
  <div
    class="flow-canvas"
    @drop="onDrop"
    @dragover.prevent
    @dragenter.prevent
  >
    <VueFlow
      :id="FLOW_ID"
      :node-types="nodeTypes"
      :default-edge-options="{ type: 'smoothstep' }"
      :fit-view-on-init="true"
      :snap-to-grid="true"
      :snap-grid="[20, 20]"
      @node-click="onNodeClick"
      @pane-click="onPaneClick"
    >
      <Controls />
      <MiniMap />
    </VueFlow>
  </div>
</template>

<script setup lang="ts">
import { markRaw } from 'vue'
import { VueFlow, useVueFlow } from '@vue-flow/core'
import { Controls } from '@vue-flow/controls'
import { MiniMap } from '@vue-flow/minimap'
import { FLOW_ID } from '@/composables/useFlowBuilder'
import type { NodeType } from '@/types/flow'

import EntryConditionNode from '@/components/nodes/EntryConditionNode.vue'
import ChannelNode from '@/components/nodes/ChannelNode.vue'
import BranchNode from '@/components/nodes/BranchNode.vue'
import WaitNode from '@/components/nodes/WaitNode.vue'
import ResultNode from '@/components/nodes/ResultNode.vue'

const emit = defineEmits<{
  drop: [type: NodeType, position: { x: number; y: number }]
  nodeClick: [nodeId: string]
  paneClick: []
}>()

const { project } = useVueFlow({ id: FLOW_ID })

const nodeTypes = {
  ENTRY_CONDITION: markRaw(EntryConditionNode),
  CHANNEL_PUSH: markRaw(ChannelNode),
  CHANNEL_KAKAO: markRaw(ChannelNode),
  CHANNEL_BRAND_FREE: markRaw(ChannelNode),
  CHANNEL_BRAND_TEMPLATE: markRaw(ChannelNode),
  CHANNEL_SMS: markRaw(ChannelNode),
  CHANNEL_WEBHOOK: markRaw(ChannelNode),
  BRANCH_USER: markRaw(BranchNode),
  BRANCH_EVENT: markRaw(BranchNode),
  WAIT: markRaw(WaitNode),
  RESULT_SUCCESS: markRaw(ResultNode),
  RESULT_FAILURE: markRaw(ResultNode),
}

function onDrop(event: DragEvent) {
  const type = event.dataTransfer?.getData('application/vueflow') as NodeType
  if (!type) return

  const canvasEl = (event.currentTarget as HTMLElement).querySelector('.vue-flow__viewport')
  if (!canvasEl) return

  const rect = canvasEl.getBoundingClientRect()
  const position = project({
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  })

  emit('drop', type, position)
}

function onNodeClick(_event: MouseEvent, node: any) {
  emit('nodeClick', node.id)
}

function onPaneClick() {
  emit('paneClick')
}
</script>

<style scoped>
.flow-canvas {
  flex: 1;
  height: 100%;
}
</style>
