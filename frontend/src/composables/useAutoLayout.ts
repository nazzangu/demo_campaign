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

    const isResultNode = (n: Node) =>
      n.type === 'RESULT_SUCCESS' || n.type === 'RESULT_FAILURE'

    const mainNodes = nodes.filter((n) => connectedIds.has(n.id))
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
      const isResult = isResultNode(node)
      g.setNode(node.id, {
        width: isResult ? RESULT_WIDTH : NODE_WIDTH,
        height: isResult ? RESULT_HEIGHT : NODE_HEIGHT,
      })
    })

    edges.forEach((edge) => {
      if (connectedIds.has(edge.source) && connectedIds.has(edge.target)) {
        g.setEdge(edge.source, edge.target)
      }
    })

    dagre.layout(g)

    const result: Node[] = mainNodes.map((node) => {
      const pos = g.node(node.id)
      const isResult = isResultNode(node)
      const w = isResult ? RESULT_WIDTH : NODE_WIDTH
      const h = isResult ? RESULT_HEIGHT : NODE_HEIGHT
      return {
        ...node,
        position: {
          x: Math.round(pos.x - w / 2),
          y: Math.round(pos.y - h / 2),
        },
      }
    })

    // 같은 채널 노드의 성공/실패 결과 순서 보정 (성공=좌, 실패=우)
    const channelResults = new Map<string, { success?: string; failure?: string }>()
    edges.forEach((e) => {
      const target = nodes.find((n) => n.id === e.target)
      if (target && isResultNode(target)) {
        if (!channelResults.has(e.source)) channelResults.set(e.source, {})
        const entry = channelResults.get(e.source)!
        if (target.type === 'RESULT_SUCCESS') entry.success = e.target
        else entry.failure = e.target
      }
    })

    channelResults.forEach((pair) => {
      if (!pair.success || !pair.failure) return
      const sNode = result.find((n) => n.id === pair.success)
      const fNode = result.find((n) => n.id === pair.failure)
      if (!sNode || !fNode) return

      // 성공이 실패보다 오른쪽에 있으면 x좌표 스왑
      if (sNode.position.x > fNode.position.x) {
        const tmpX = sNode.position.x
        sNode.position = { ...sNode.position, x: fNode.position.x }
        fNode.position = { ...fNode.position, x: tmpX }
      }
    })

    // 브랜치 노드의 자식을 그룹 인덱스(sourceHandle) 순서대로 좌→우 재정렬
    const branchNodes = mainNodes.filter(
      (n) => n.type === 'BRANCH_USER' || n.type === 'BRANCH_EVENT',
    )
    for (const branchNode of branchNodes) {
      const outEdges = edges
        .filter((e) => e.source === branchNode.id)
        .sort((a, b) => {
          const ai = parseInt(a.sourceHandle?.replace('branch-', '') || '0', 10)
          const bi = parseInt(b.sourceHandle?.replace('branch-', '') || '0', 10)
          return ai - bi
        })

      if (outEdges.length < 2) continue

      const childNodes = outEdges
        .map((e) => result.find((n) => n.id === e.target))
        .filter((n): n is Node => !!n)

      if (childNodes.length < 2) continue

      const sortedXPositions = childNodes
        .map((n) => n.position.x)
        .sort((a, b) => a - b)

      function collectSubtree(nodeId: string, visited: Set<string>): string[] {
        if (visited.has(nodeId)) return []
        visited.add(nodeId)
        const ids = [nodeId]
        const childEdges = edges.filter(
          (e) => e.source === nodeId && e.source !== branchNode.id,
        )
        for (const ce of childEdges) {
          ids.push(...collectSubtree(ce.target, visited))
        }
        return ids
      }

      for (let i = 0; i < childNodes.length; i++) {
        const child = childNodes[i]
        const targetX = sortedXPositions[i]
        const deltaX = targetX - child.position.x

        if (deltaX === 0) continue

        const visited = new Set<string>()
        const siblingIds = new Set(childNodes.map((n) => n.id))
        visited.add(branchNode.id)
        siblingIds.forEach((sid) => {
          if (sid !== child.id) visited.add(sid)
        })

        const subtreeIds = collectSubtree(child.id, visited)
        for (const sid of subtreeIds) {
          const sNode = result.find((n) => n.id === sid)
          if (sNode) {
            sNode.position = { ...sNode.position, x: sNode.position.x + deltaX }
          }
        }
      }
    }

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
