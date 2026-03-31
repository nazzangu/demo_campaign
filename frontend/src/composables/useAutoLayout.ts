import dagre from '@dagrejs/dagre'
import type { Node, Edge } from '@vue-flow/core'

const NODE_WIDTH = 250
const NODE_HEIGHT = 80
const RESULT_WIDTH = 130
const RESULT_HEIGHT = 40

export function useAutoLayout() {
  function layoutNodes(nodes: Node[], edges: Edge[]): Node[] {
    if (!nodes.length) return nodes

    const connectedIds = new Set<string>()
    edges.forEach((e) => {
      connectedIds.add(e.source)
      connectedIds.add(e.target)
    })
    nodes.forEach((n) => {
      if (n.type === 'ENTRY_CONDITION') connectedIds.add(n.id)
    })

    // 결과 노드와 그 부모 채널 노드를 파악
    const resultParent = new Map<string, string>() // resultId -> channelId
    const channelResults = new Map<string, { success?: string; failure?: string }>()
    edges.forEach((e) => {
      const target = nodes.find((n) => n.id === e.target)
      if (target && (target.type === 'RESULT_SUCCESS' || target.type === 'RESULT_FAILURE')) {
        resultParent.set(e.target, e.source)
        if (!channelResults.has(e.source)) channelResults.set(e.source, {})
        const entry = channelResults.get(e.source)!
        if (target.type === 'RESULT_SUCCESS') entry.success = e.target
        else entry.failure = e.target
      }
    })

    // 결과 노드는 dagre에서 제외 (부모 기준으로 수동 배치)
    const resultIds = new Set(resultParent.keys())
    const mainNodes = nodes.filter((n) => connectedIds.has(n.id) && !resultIds.has(n.id))
    const orphanNodes = nodes.filter((n) => !connectedIds.has(n.id))

    const g = new dagre.graphlib.Graph()
    g.setGraph({
      rankdir: 'TB',
      nodesep: 80,
      ranksep: 100,
      marginx: 40,
      marginy: 40,
    })
    g.setDefaultEdgeLabel(() => ({}))

    mainNodes.forEach((node) => {
      g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT })
    })

    edges.forEach((edge) => {
      // 결과 노드로의 엣지는 제외
      if (resultIds.has(edge.target)) return
      if (connectedIds.has(edge.source) && connectedIds.has(edge.target) &&
          !resultIds.has(edge.source)) {
        g.setEdge(edge.source, edge.target)
      }
    })

    dagre.layout(g)

    const result: Node[] = mainNodes.map((node) => {
      const pos = g.node(node.id)
      return {
        ...node,
        position: {
          x: Math.round(pos.x - NODE_WIDTH / 2),
          y: Math.round(pos.y - NODE_HEIGHT / 2),
        },
      }
    })

    // 결과 노드: 부모 채널 노드 중심 기준 좌우 대칭 (꺾은선 유지)
    const SPREAD = 120
    const RESULT_CENTER = RESULT_WIDTH / 2  // 65px

    channelResults.forEach((pair, channelId) => {
      const parent = result.find((n) => n.id === channelId)
      if (!parent) return
      const channelCenterX = parent.position.x + NODE_WIDTH / 2
      const belowY = parent.position.y + NODE_HEIGHT + 100

      if (pair.success) {
        const sNode = nodes.find((n) => n.id === pair.success)
        if (sNode) {
          result.push({
            ...sNode,
            position: {
              x: Math.round(channelCenterX - SPREAD - RESULT_CENTER),
              y: belowY,
            },
          })
        }
      }
      if (pair.failure) {
        const fNode = nodes.find((n) => n.id === pair.failure)
        if (fNode) {
          result.push({
            ...fNode,
            position: {
              x: Math.round(channelCenterX + SPREAD - RESULT_CENTER),
              y: belowY,
            },
          })
        }
      }
    })

    // 결과 노드 중 부모가 없는 경우 (고립 결과)
    resultIds.forEach((rid) => {
      if (!result.find((n) => n.id === rid)) {
        const node = nodes.find((n) => n.id === rid)
        if (node) orphanNodes.push(node)
      }
    })

    // 고립 노드
    if (orphanNodes.length) {
      const maxX = result.reduce((mx, n) => Math.max(mx, n.position.x + NODE_WIDTH), 0)
      const minY = result.reduce((mn, n) => Math.min(mn, n.position.y), 40)
      const startX = maxX + 120
      let y = minY
      orphanNodes.forEach((node) => {
        result.push({ ...node, position: { x: startX, y } })
        y += NODE_HEIGHT + 40
      })
    }

    return result
  }

  return { layoutNodes }
}
