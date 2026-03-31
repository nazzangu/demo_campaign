import { ref, type Ref } from 'vue'
import type { Node, Edge } from '@vue-flow/core'
import type { NodeType } from '@/types/flow'
import { getDefaultNodeData } from '@/utils/nodeDefaults'

let idCounter = 0
function nextId() {
  return `node-${Date.now()}-${++idCounter}`
}

export function useFlowBuilder(
  nodes: Ref<Node[]>,
  edges: Ref<Edge[]>,
) {
  const isDirty = ref(false)
  const selectedNodeId = ref<string | null>(null)

  function markDirty() {
    isDirty.value = true
  }

  function addNode(type: NodeType, position: { x: number; y: number }) {
    const id = nextId()
    const data = getDefaultNodeData(type)

    const newNode: Node = {
      id,
      type,
      position,
      data,
    }

    nodes.value = [...nodes.value, newNode]

    // For channel nodes, auto-create result nodes
    if (type.startsWith('CHANNEL_')) {
      const successId = nextId()
      const failureId = nextId()

      nodes.value = [
        ...nodes.value,
        {
          id: successId,
          type: 'RESULT_SUCCESS',
          position: { x: position.x - 60, y: position.y + 150 },
          data: getDefaultNodeData('RESULT_SUCCESS'),
        },
        {
          id: failureId,
          type: 'RESULT_FAILURE',
          position: { x: position.x + 140, y: position.y + 150 },
          data: getDefaultNodeData('RESULT_FAILURE'),
        },
      ]

      edges.value = [
        ...edges.value,
        {
          id: `edge-${id}-${successId}`,
          source: id,
          target: successId,
          sourceHandle: 'success',
          type: 'smoothstep',
          label: '성공',
        },
        {
          id: `edge-${id}-${failureId}`,
          source: id,
          target: failureId,
          sourceHandle: 'failure',
          type: 'smoothstep',
          label: '실패',
        },
      ]
    }

    isDirty.value = true
    return id
  }

  function deleteNode(nodeId: string) {
    const node = nodes.value.find((n) => n.id === nodeId)
    if (!node || node.type === 'ENTRY_CONDITION') return

    // Collect connected child node IDs to delete (e.g. RESULT_SUCCESS/FAILURE)
    const connectedEdges = edges.value.filter((e) => e.source === nodeId)
    const childIds = connectedEdges
      .map((e) => e.target)
      .filter((targetId) => {
        const child = nodes.value.find((n) => n.id === targetId)
        return child && (child.type === 'RESULT_SUCCESS' || child.type === 'RESULT_FAILURE')
      })

    const removeIds = new Set([nodeId, ...childIds])
    nodes.value = nodes.value.filter((n) => !removeIds.has(n.id))
    edges.value = edges.value.filter(
      (e) => !removeIds.has(e.source) && !removeIds.has(e.target),
    )
    isDirty.value = true
  }

  function updateNodeData(nodeId: string, data: Record<string, any>) {
    const node = nodes.value.find((n) => n.id === nodeId)
    if (node) {
      node.data = { ...node.data, ...data }
      isDirty.value = true
    }
  }

  function getFlowGraphJson(): string {
    return JSON.stringify({
      nodes: nodes.value.map((n) => ({
        id: n.id,
        type: n.type,
        position: n.position,
        data: n.data,
      })),
      edges: edges.value.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle,
        targetHandle: e.targetHandle,
        label: e.label,
        type: e.type,
      })),
    })
  }

  function loadFlowGraph(json: string) {
    try {
      const graph = JSON.parse(json)
      nodes.value = graph.nodes || []
      edges.value = graph.edges || []
      isDirty.value = false
    } catch (e) {
      console.error('Failed to load flow graph:', e)
    }
  }

  function selectNode(nodeId: string | null) {
    selectedNodeId.value = nodeId
  }

  return {
    isDirty,
    selectedNodeId,
    addNode,
    deleteNode,
    updateNodeData,
    getFlowGraphJson,
    loadFlowGraph,
    selectNode,
    markDirty,
  }
}
