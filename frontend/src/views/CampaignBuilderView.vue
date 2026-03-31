<template>
  <div class="builder-layout">
    <CampaignHeader
      :campaign="campaign"
      :is-dirty="isDirty"
      @save="handleSave"
      @activate="handleActivate"
    />

    <div class="builder-body">
      <NodePalette @auto-arrange="handleAutoArrange" />

      <div
        class="flow-canvas"
        @drop="handleDrop"
        @dragover.prevent
        @dragenter.prevent
      >
        <VueFlow
          v-model:nodes="nodes"
          v-model:edges="edges"
          :node-types="nodeTypes"
          :default-edge-options="{ type: 'smoothstep' }"
          :fit-view-on-init="true"
          :snap-to-grid="true"
          :snap-grid="[20, 20]"
          @node-click="handleNodeClick"
          @pane-click="handlePaneClick"
          @connect="handleConnect"
          @nodes-change="markDirty"
          @edge-click="handleEdgeClick"
        >
          <Controls />
          <MiniMap />
        </VueFlow>
      </div>

      <NodeConfigPanel
        v-if="selectedNode"
        :node="selectedNode"
        @close="selectNode(null)"
        @update-config="handleUpdateConfig"
        @delete="handleDeleteNode"
      />
    </div>

    <!-- 유효성 검증 알림 -->
    <Transition name="fade">
      <div v-if="showValidation" class="validation-overlay" @click.self="dismissValidation">
        <div class="validation-modal">
          <div class="validation-header">
            <span class="validation-icon">!</span>
            <h3>저장할 수 없습니다</h3>
            <button class="validation-close" @click="dismissValidation">✕</button>
          </div>
          <div class="validation-body">
            <p class="validation-desc">다음 항목을 확인해주세요.</p>
            <ul class="validation-list">
              <li v-for="(err, idx) in validationErrors" :key="idx">{{ err }}</li>
            </ul>
          </div>
          <div class="validation-footer">
            <button class="btn-confirm" @click="dismissValidation">확인</button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, markRaw } from 'vue'
import { useRoute } from 'vue-router'
import { VueFlow, useVueFlow, type Connection, type Node, type Edge } from '@vue-flow/core'
import { Controls } from '@vue-flow/controls'
import { MiniMap } from '@vue-flow/minimap'
import CampaignHeader from '@/components/campaign/CampaignHeader.vue'
import NodePalette from '@/components/sidebar/NodePalette.vue'
import NodeConfigPanel from '@/components/config-panels/NodeConfigPanel.vue'
import { useFlowBuilder } from '@/composables/useFlowBuilder'
import { useAutoLayout } from '@/composables/useAutoLayout'
import { campaignApi } from '@/api/campaignApi'
import type { Campaign } from '@/types/campaign'
import type { NodeType } from '@/types/flow'

import EntryConditionNode from '@/components/nodes/EntryConditionNode.vue'
import ChannelNode from '@/components/nodes/ChannelNode.vue'
import BranchNode from '@/components/nodes/BranchNode.vue'
import WaitNode from '@/components/nodes/WaitNode.vue'
import ResultNode from '@/components/nodes/ResultNode.vue'

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

const route = useRoute()
const campaignId = computed(() => Number(route.params.id))

const campaign = ref<Campaign | null>(null)
const nodes = ref<Node[]>([])
const edges = ref<Edge[]>([])

const {
  isDirty,
  selectedNodeId,
  addNode,
  deleteNode,
  updateNodeData,
  getFlowGraphJson,
  loadFlowGraph,
  selectNode,
  markDirty,
} = useFlowBuilder(nodes, edges)

const { screenToFlowCoordinate } = useVueFlow()

const { layoutNodes } = useAutoLayout()

const selectedNode = computed(() => {
  if (!selectedNodeId.value) return null
  return nodes.value.find((n) => n.id === selectedNodeId.value) || null
})

onMounted(async () => {
  try {
    const res = await campaignApi.get(campaignId.value)
    campaign.value = res.data.data
    if (campaign.value?.flowGraph) {
      loadFlowGraph(campaign.value.flowGraph)
    }
  } catch (e) {
    console.error('Failed to load campaign:', e)
  }
})

function handleDrop(event: DragEvent) {
  const type = event.dataTransfer?.getData('application/vueflow') as NodeType
  if (!type) return

  const position = screenToFlowCoordinate({
    x: event.clientX,
    y: event.clientY,
  })

  addNode(type, position)
}

function handleConnect(connection: Connection) {
  const edgeId = `edge-${connection.source}-${connection.target}`
  edges.value = [
    ...edges.value,
    {
      id: edgeId,
      source: connection.source,
      target: connection.target,
      sourceHandle: connection.sourceHandle ?? undefined,
      targetHandle: connection.targetHandle ?? undefined,
      type: 'smoothstep',
    },
  ]
  markDirty()
}

function handleNodeClick(event: any) {
  selectNode(event.node.id)
}

const selectedEdgeId = ref<string | null>(null)

function handleEdgeClick(event: any) {
  selectedEdgeId.value = event.edge.id
  selectNode(null)
}

function handlePaneClick() {
  selectNode(null)
  selectedEdgeId.value = null
}

function onKeydown(event: KeyboardEvent) {
  if ((event.key === 'Delete' || event.key === 'Backspace') && selectedEdgeId.value) {
    edges.value = edges.value.filter((e) => e.id !== selectedEdgeId.value)
    selectedEdgeId.value = null
    markDirty()
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
})
onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
})

function handleDeleteNode() {
  if (selectedNodeId.value) {
    deleteNode(selectedNodeId.value)
    selectNode(null)
  }
}

function handleUpdateConfig(config: any) {
  if (selectedNodeId.value) {
    updateNodeData(selectedNodeId.value, { config })
  }
}

// ── Validation ──
const validationErrors = ref<string[]>([])
const showValidation = ref(false)

function validateFlow(): string[] {
  const errors: string[] = []
  const entryNode = nodes.value.find((n) => n.type === 'ENTRY_CONDITION')

  // 진입 조건 노드가 없는 경우
  if (!entryNode) {
    errors.push('진입 조건 노드가 없습니다. 캠페인 시작점을 추가해주세요.')
    return errors
  }

  // 진입 조건에서 도달 가능한 노드 탐색 (BFS)
  const reachable = new Set<string>()
  const queue = [entryNode.id]
  while (queue.length) {
    const current = queue.shift()!
    if (reachable.has(current)) continue
    reachable.add(current)
    edges.value
      .filter((e) => e.source === current)
      .forEach((e) => queue.push(e.target))
  }

  // 진입 조건과 연결되지 않은 노드
  const disconnected = nodes.value.filter(
    (n) => !reachable.has(n.id) && n.type !== 'ENTRY_CONDITION'
  )
  if (disconnected.length) {
    const names = disconnected.map((n) => n.data?.label || n.type).join(', ')
    errors.push(`진입 조건과 연결되지 않은 노드가 있습니다: ${names}`)
  }

  // 설정 미완료 노드 (configured === false인 채널 노드)
  const unconfigured = nodes.value.filter((n) => {
    if (!n.type?.startsWith('CHANNEL_')) return false
    return !n.data?.config?.configured
  })
  if (unconfigured.length) {
    const names = unconfigured.map((n) => n.data?.label || n.type).join(', ')
    errors.push(`설정이 완료되지 않은 노드가 있습니다: ${names}`)
  }

  // 출력 연결이 없는 노드 (RESULT 노드 제외)
  const noOutput = nodes.value.filter((n) => {
    if (n.type?.startsWith('RESULT_')) return false
    const hasOut = edges.value.some((e) => e.source === n.id)
    return !hasOut
  })
  if (noOutput.length) {
    const names = noOutput.map((n) => n.data?.label || n.type).join(', ')
    errors.push(`다음 단계가 연결되지 않은 노드가 있습니다: ${names}`)
  }

  return errors
}

async function handleSave() {
  const errors = validateFlow()
  if (errors.length) {
    validationErrors.value = errors
    showValidation.value = true
    return
  }

  try {
    const flowJson = getFlowGraphJson()
    const res = await campaignApi.saveFlow(campaignId.value, flowJson)
    campaign.value = res.data.data
    isDirty.value = false
    showValidation.value = false
  } catch (e) {
    console.error('Failed to save:', e)
  }
}

function dismissValidation() {
  showValidation.value = false
}

async function handleActivate() {
  try {
    await handleSave()
    const res = await campaignApi.activate(campaignId.value)
    campaign.value = res.data.data
  } catch (e) {
    console.error('Failed to activate:', e)
  }
}

function handleAutoArrange() {
  const layouted = layoutNodes(nodes.value, edges.value)
  nodes.value = layouted
}
</script>

<style scoped>
.builder-layout {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  width: 100vw;
}

.builder-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.flow-canvas {
  flex: 1;
  height: 100%;
}

/* Validation modal */
.validation-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.validation-modal {
  background: #fff;
  border-radius: 14px;
  width: 440px;
  max-width: 90vw;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  overflow: hidden;
}

.validation-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 18px 20px 14px;
  border-bottom: 1px solid #f3f4f6;
}

.validation-icon {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #fef3c7;
  color: #d97706;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  font-weight: 800;
  flex-shrink: 0;
}

.validation-header h3 {
  flex: 1;
  font-size: 15px;
  font-weight: 700;
  color: #111827;
  margin: 0;
}

.validation-close {
  background: none;
  border: none;
  font-size: 18px;
  color: #9ca3af;
  cursor: pointer;
}

.validation-close:hover {
  color: #374151;
}

.validation-body {
  padding: 16px 20px;
}

.validation-desc {
  font-size: 13px;
  color: #6b7280;
  margin: 0 0 12px;
}

.validation-list {
  margin: 0;
  padding: 0 0 0 18px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.validation-list li {
  font-size: 13px;
  color: #dc2626;
  line-height: 1.5;
}

.validation-footer {
  padding: 12px 20px 16px;
  display: flex;
  justify-content: flex-end;
}

.btn-confirm {
  padding: 8px 24px;
  background: #2563eb;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.btn-confirm:hover {
  background: #1d4ed8;
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
