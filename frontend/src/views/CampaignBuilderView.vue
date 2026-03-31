<template>
  <div class="builder-layout">
    <CampaignHeader
      :campaign="campaign"
      :is-dirty="isDirty"
      @save="handleSave"
      @activate="handleActivate"
      @pause="handlePause"
      @stop="handleStop"
      @update-name="handleUpdateName"
      @update-desc="handleUpdateDesc"
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

    <!-- 변경 내역 확인 모달 -->
    <Transition name="fade">
      <div v-if="showChangeConfirm" class="validation-overlay" @click.self="showChangeConfirm = false">
        <div class="validation-modal">
          <div class="validation-header">
            <span class="validation-icon change-icon">i</span>
            <h3>변경사항 확인</h3>
            <button class="validation-close" @click="showChangeConfirm = false">✕</button>
          </div>
          <div class="validation-body">
            <p class="validation-desc">운영 중인 캠페인에 다음 변경사항을 적용합니다.</p>
            <ul class="change-list">
              <li v-for="(item, idx) in changeSummary" :key="idx">{{ item }}</li>
            </ul>
          </div>
          <div class="validation-footer">
            <button class="btn-cancel" @click="showChangeConfirm = false">취소</button>
            <button class="btn-confirm" @click="doSave">적용</button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 노드 삭제 확인 -->
    <Transition name="fade">
      <div v-if="showDeleteConfirm" class="validation-overlay" @click.self="showDeleteConfirm = false">
        <div class="validation-modal">
          <div class="validation-header">
            <span class="validation-icon delete-icon">!</span>
            <h3>노드 삭제</h3>
            <button class="validation-close" @click="showDeleteConfirm = false">✕</button>
          </div>
          <div class="validation-body">
            <p class="validation-desc">{{ deleteTargetLabel }} 노드를 삭제하시겠습니까?</p>
          </div>
          <div class="validation-footer">
            <button class="btn-cancel" @click="showDeleteConfirm = false">취소</button>
            <button class="btn-confirm btn-delete" @click="confirmDeleteNode">삭제</button>
          </div>
        </div>
      </div>
    </Transition>

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
import RewardNode from '@/components/nodes/RewardNode.vue'

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
  REWARD_COUPON: markRaw(RewardNode),
  REWARD_POINT: markRaw(RewardNode),
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

// ── Snapshot for change detection ──
interface FlowSnapshot {
  nodes: { id: string; type: string; label: string; configured?: boolean }[]
  edges: { id: string; source: string; target: string }[]
}

let savedSnapshot: FlowSnapshot = { nodes: [], edges: [] }

function takeSnapshot(): FlowSnapshot {
  return {
    nodes: nodes.value.map((n) => ({
      id: n.id,
      type: n.type || '',
      label: n.data?.label || '',
      configured: n.data?.config?.configured,
    })),
    edges: edges.value.map((e) => ({ id: e.id, source: e.source, target: e.target })),
  }
}

function getChangeSummary(): string[] {
  const changes: string[] = []
  const current = takeSnapshot()
  const savedIds = new Set(savedSnapshot.nodes.map((n) => n.id))
  const currentIds = new Set(current.nodes.map((n) => n.id))

  // 추가된 노드
  const added = current.nodes.filter((n) => !savedIds.has(n.id))
  if (added.length) {
    changes.push(`노드 추가: ${added.map((n) => n.label).join(', ')}`)
  }

  // 삭제된 노드
  const removed = savedSnapshot.nodes.filter((n) => !currentIds.has(n.id))
  if (removed.length) {
    changes.push(`노드 삭제: ${removed.map((n) => n.label).join(', ')}`)
  }

  // 설정 변경된 노드
  for (const cur of current.nodes) {
    const prev = savedSnapshot.nodes.find((n) => n.id === cur.id)
    if (!prev) continue
    if (prev.label !== cur.label) {
      changes.push(`이름 변경: "${prev.label}" → "${cur.label}"`)
    }
    if (prev.configured !== cur.configured && cur.configured) {
      changes.push(`설정 완료: ${cur.label}`)
    }
  }

  // 연결 변경
  const savedEdgeIds = new Set(savedSnapshot.edges.map((e) => e.id))
  const currentEdgeIds = new Set(current.edges.map((e) => e.id))
  const addedEdges = current.edges.filter((e) => !savedEdgeIds.has(e.id))
  const removedEdges = savedSnapshot.edges.filter((e) => !currentEdgeIds.has(e.id))
  if (addedEdges.length) changes.push(`연결 추가: ${addedEdges.length}건`)
  if (removedEdges.length) changes.push(`연결 삭제: ${removedEdges.length}건`)

  // 위치 등 기타 변경
  if (!changes.length && isDirty.value) {
    changes.push('노드 위치 또는 설정이 변경되었습니다.')
  }

  return changes
}

const showChangeConfirm = ref(false)
const changeSummary = ref<string[]>([])

const { screenToFlowCoordinate, fitView } = useVueFlow()

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
      // 로드 후 브랜치 엣지 라벨 동기화
      syncBranchEdgeLabels()
      isDirty.value = false
    }
    // 초기 스냅샷 저장
    setTimeout(() => { savedSnapshot = takeSnapshot() }, 200)
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

function getBranchLabel(sourceId: string, sourceHandle: string | null | undefined): string | undefined {
  if (!sourceHandle?.startsWith('branch-')) return undefined
  const node = nodes.value.find((n) => n.id === sourceId)
  if (!node || (!node.type?.startsWith('BRANCH_'))) return undefined
  const branchIndex = parseInt(sourceHandle.replace('branch-', ''), 10)
  const branches = node.data?.config?.branches || []
  const branch = branches.find((b: any) => b.index === branchIndex)
  return branch?.label
}

const BRANCH_COLORS = ['#E74C3C', '#F39C12', '#3498DB', '#2ECC71', '#9B59B6', '#1ABC9C']

function getBranchEdgeStyle(sourceId: string, sourceHandle: string | null | undefined) {
  if (!sourceHandle?.startsWith('branch-')) return {}
  const node = nodes.value.find((n) => n.id === sourceId)
  if (!node || !node.type?.startsWith('BRANCH_')) return {}
  const branchIndex = parseInt(sourceHandle.replace('branch-', ''), 10)
  const color = BRANCH_COLORS[(branchIndex - 1) % BRANCH_COLORS.length]
  return {
    labelStyle: { fill: color, fontWeight: 700, fontSize: '11px' },
    labelBgStyle: { fill: '#fff', fillOpacity: 0.9 },
    style: { stroke: color, strokeWidth: 2 },
  }
}

function handleConnect(connection: Connection) {
  const edgeId = `edge-${connection.source}-${connection.target}`
  const label = getBranchLabel(connection.source, connection.sourceHandle)
  const edgeStyle = getBranchEdgeStyle(connection.source, connection.sourceHandle)
  edges.value = [
    ...edges.value,
    {
      id: edgeId,
      source: connection.source,
      target: connection.target,
      sourceHandle: connection.sourceHandle ?? undefined,
      targetHandle: connection.targetHandle ?? undefined,
      type: 'smoothstep',
      label,
      ...edgeStyle,
    },
  ]
  markDirty()
}

function syncBranchEdgeLabels() {
  let changed = false
  edges.value = edges.value.map((e) => {
    const label = getBranchLabel(e.source, e.sourceHandle)
    if (label !== undefined && e.label !== label) {
      changed = true
      return { ...e, label, ...getBranchEdgeStyle(e.source, e.sourceHandle) }
    }
    // 기존 브랜치 엣지에 스타일이 없는 경우에도 적용
    if (label !== undefined && !e.labelStyle) {
      changed = true
      return { ...e, ...getBranchEdgeStyle(e.source, e.sourceHandle) }
    }
    return e
  })
  if (changed) markDirty()
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

const showDeleteConfirm = ref(false)
const deleteTargetNodeId = ref<string | null>(null)

const deleteTargetLabel = computed(() => {
  if (!deleteTargetNodeId.value) return ''
  const node = nodes.value.find((n) => n.id === deleteTargetNodeId.value)
  return node?.data?.label || ''
})

function requestDeleteNode(nodeId: string) {
  const node = nodes.value.find((n) => n.id === nodeId)
  if (!node || node.type === 'ENTRY_CONDITION') return
  deleteTargetNodeId.value = nodeId
  showDeleteConfirm.value = true
}

function confirmDeleteNode() {
  if (deleteTargetNodeId.value) {
    deleteNode(deleteTargetNodeId.value)
    if (selectedNodeId.value === deleteTargetNodeId.value) selectNode(null)
  }
  showDeleteConfirm.value = false
  deleteTargetNodeId.value = null
}

function onKeydown(event: KeyboardEvent) {
  if ((event.key === 'Delete' || event.key === 'Backspace') && selectedEdgeId.value) {
    edges.value = edges.value.filter((e) => e.id !== selectedEdgeId.value)
    selectedEdgeId.value = null
    markDirty()
  }
  if ((event.key === 'Delete' || event.key === 'Backspace') && selectedNodeId.value && !selectedEdgeId.value) {
    requestDeleteNode(selectedNodeId.value)
  }
}

function onFlowDeleteNode(e: Event) {
  const nodeId = (e as CustomEvent).detail?.nodeId
  if (nodeId) {
    requestDeleteNode(nodeId)
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
  window.addEventListener('flow-delete-node', onFlowDeleteNode)
})
onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
  window.removeEventListener('flow-delete-node', onFlowDeleteNode)
})

function handleDeleteNode() {
  if (selectedNodeId.value) {
    deleteNode(selectedNodeId.value)
    selectNode(null)
  }
}

function handleUpdateName(name: string) {
  if (campaign.value) {
    campaign.value = { ...campaign.value, name }
    markDirty()
  }
}

function handleUpdateDesc(desc: string) {
  if (campaign.value) {
    campaign.value = { ...campaign.value, description: desc }
    markDirty()
  }
}

function handleUpdateConfig(config: any) {
  if (!selectedNodeId.value) return
  const node = nodes.value.find((n) => n.id === selectedNodeId.value)
  if (!node) return

  updateNodeData(selectedNodeId.value, { config })

  // 브랜치 노드 설정 변경 시 엣지 라벨 동기화
  if (node.type?.startsWith('BRANCH_')) {
    syncBranchEdgeLabels()
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

  // 진입 조건 시작일 필수
  if (!entryNode.data?.config?.period?.start) {
    errors.push('진입 조건의 시작일을 설정해주세요.')
  }

  // 세그먼트 선택 시 세그먼트 노드 필수 확인
  if (entryNode.data?.config?.audienceType === 'SEGMENT') {
    const hasBranch = nodes.value.some(
      (n) => n.type === 'BRANCH_USER' || n.type === 'BRANCH_EVENT',
    )
    if (!hasBranch) {
      errors.push('세그먼트 대상 캠페인에는 사용자 기반 또는 이벤트 기반 세그먼트 노드가 반드시 포함되어야 합니다.')
    }
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
  // 유효성 검증 먼저
  const errors = validateFlow()
  if (errors.length) {
    validationErrors.value = errors
    showValidation.value = true
    return
  }

  const isActive = campaign.value?.status === 'ACTIVE' || campaign.value?.status === 'PAUSED'

  // 유효성 통과 후, 운영/일시정지 상태면 변경 내역 확인 모달
  if (isActive && isDirty.value) {
    changeSummary.value = getChangeSummary()
    showChangeConfirm.value = true
    return
  }

  await doSave()
}

async function doSave() {
  try {
    // 캠페인 이름/설명 저장
    if (campaign.value) {
      await campaignApi.update(campaignId.value, {
        name: campaign.value.name,
        description: campaign.value.description || undefined,
      })
    }
    // 플로우 저장
    const flowJson = getFlowGraphJson()
    const res = await campaignApi.saveFlow(campaignId.value, flowJson)
    campaign.value = res.data.data
    isDirty.value = false
    showValidation.value = false
    showChangeConfirm.value = false
    savedSnapshot = takeSnapshot()
  } catch (e) {
    console.error('Failed to save:', e)
  }
}

function dismissValidation() {
  showValidation.value = false
}

async function handleActivate() {
  try {
    // DRAFT 상태면 저장 먼저
    if (!campaign.value || campaign.value.status === 'DRAFT') {
      const errors = validateFlow()
      if (errors.length) {
        validationErrors.value = errors
        showValidation.value = true
        return
      }
      const flowJson = getFlowGraphJson()
      await campaignApi.saveFlow(campaignId.value, flowJson)
      isDirty.value = false
    }
    const res = await campaignApi.activate(campaignId.value)
    campaign.value = res.data.data
  } catch (e) {
    console.error('Failed to activate:', e)
  }
}

async function handlePause() {
  if (!confirm('캠페인을 일시정지하시겠습니까?')) return
  try {
    const res = await campaignApi.pause(campaignId.value)
    campaign.value = res.data.data
  } catch (e) {
    console.error('Failed to pause:', e)
  }
}

async function handleStop() {
  if (!confirm('캠페인을 종료하시겠습니까?\n종료된 캠페인은 다시 시작할 수 없습니다.')) return
  try {
    const res = await campaignApi.stop(campaignId.value)
    campaign.value = res.data.data
  } catch (e) {
    console.error('Failed to stop:', e)
  }
}

function handleAutoArrange() {
  const layouted = layoutNodes(nodes.value, edges.value)
  nodes.value = [...layouted]
  markDirty()
  setTimeout(() => fitView({ padding: 0.2, duration: 300 }), 200)
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

.btn-delete {
  background: #dc2626;
}

.btn-delete:hover {
  background: #b91c1c;
}

.delete-icon {
  background: #dc2626 !important;
}

.change-icon {
  background: #dbeafe !important;
  color: #2563eb !important;
}

.change-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.change-list li {
  font-size: 13px;
  color: #374151;
  line-height: 1.5;
  padding: 6px 10px;
  background: #f9fafb;
  border-radius: 6px;
  border-left: 3px solid #2563eb;
}

.btn-cancel {
  padding: 8px 20px;
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  margin-right: 8px;
}

.btn-cancel:hover {
  background: #e5e7eb;
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
