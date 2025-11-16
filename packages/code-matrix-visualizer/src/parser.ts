import { CodeMatrixModel, NodeData, NodeStats } from './types';

export class ERDParser {
  private data: CodeMatrixModel;

  constructor(erdData: CodeMatrixModel) {
    this.data = erdData;
  }

  getNodes(): NodeData[] {
    return this.data.nodes;
  }

  getEdges() {
    return this.data.edges;
  }

  getNodesByType(): Map<string, NodeData[]> {
    const nodesByType = new Map<string, NodeData[]>();

    this.data.nodes.forEach(node => {
      const type = node.type;
      if (!nodesByType.has(type)) {
        nodesByType.set(type, []);
      }
      nodesByType.get(type)!.push(node);
    });

    // Sort nodes alphabetically within each type
    nodesByType.forEach((nodes) => {
      nodes.sort((a, b) => a.name.localeCompare(b.name));
    });

    return nodesByType;
  }

  getNodeStats(): NodeStats {
    const stats: NodeStats = {};

    this.data.nodes.forEach(node => {
      const type = node.type;
      stats[type] = (stats[type] || 0) + 1;
    });

    return stats;
  }

  searchNodes(query: string): NodeData[] {
    const lowerQuery = query.toLowerCase();
    return this.data.nodes.filter(node =>
      node.name.toLowerCase().includes(lowerQuery) ||
      node.id.toLowerCase().includes(lowerQuery)
    );
  }

  getNodeById(id: string): NodeData | undefined {
    return this.data.nodes.find(node => node.id === id);
  }

  getConnectedNodes(nodeId: string): { incoming: NodeData[], outgoing: NodeData[] } {
    const incoming: NodeData[] = [];
    const outgoing: NodeData[] = [];

    this.data.edges.forEach(edge => {
      if (edge.to === nodeId) {
        const node = this.getNodeById(edge.from);
        if (node) incoming.push(node);
      }
      if (edge.from === nodeId) {
        const node = this.getNodeById(edge.to);
        if (node) outgoing.push(node);
      }
    });

    return { incoming, outgoing };
  }

  getCrates(): NodeData[] {
    return this.data.nodes.filter(node => node.type.toLowerCase() === 'crate');
  }

  getNodesByCrate(crateId: string): NodeData[] {
    // Get all nodes that belong to this crate
    // A node belongs to a crate if there's an edge from the crate to the node with type "includes"
    const crateNodes: NodeData[] = [];
    const nodeIds = new Set<string>();

    this.data.edges.forEach(edge => {
      if (edge.from === crateId && edge.type.toLowerCase() === 'includes') {
        nodeIds.add(edge.to);
      }
    });

    nodeIds.forEach(id => {
      const node = this.getNodeById(id);
      if (node) crateNodes.push(node);
    });

    return crateNodes;
  }
}
