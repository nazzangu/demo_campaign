import dagre from '@dagrejs/dagre'
import type { Node, Edge } from '@vue-flow/core'

const NODE_WIDTH = 240
const NODE_HEIGHT = 80

export function useAutoLayout() {
  function layoutNodes(nodes: Node[], edges: Edge[]): Node[] {
    const g = new dagre.graphlib.Graph()
    g.setGraph({ rankdir: 'TB', nodesep: 80, ranksep: 120, marginx: 50, marginy: 50 })
    g.setDefaultEdgeLabel(() => ({}))

    nodes.forEach((node) => {
      g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT })
    })

    edges.forEach((edge) => {
      g.setEdge(edge.source, edge.target)
    })

    dagre.layout(g)

    return nodes.map((node) => {
      const pos = g.node(node.id)
      return {
        ...node,
        position: {
          x: pos.x - NODE_WIDTH / 2,
          y: pos.y - NODE_HEIGHT / 2,
        },
      }
    })
  }

  return { layoutNodes }
}
