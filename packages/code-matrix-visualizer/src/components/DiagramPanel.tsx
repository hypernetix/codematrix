import React, { useCallback, useEffect, useMemo, useState } from 'react';
import ReactFlow, {
  Node,
  Edge as FlowEdge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  Position,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { NodeData, Edge, ViewMode } from '../types';
import { createGridLayout } from '../layoutEngine';
import { NodeDetailsPopup } from './NodeDetailsPopup';

interface DiagramPanelProps {
  nodes: NodeData[];
  edges: Edge[];
  viewMode: ViewMode;
  focusedNodeId?: string;
  searchResults?: NodeData[];
  onNodeClick?: (node: NodeData) => void;
  useGridLayout?: boolean;
}

const getNodeColor = (type: string, viewMode: ViewMode): string => {
  if (viewMode === 'heatmap') {
    // Different colors for heatmap mode
    const heatmapColors: Record<string, string> = {
      crate: '#ff6b6b',
      function: '#ffd93d',
      struct: '#6bcf7f',
      enum: '#4d96ff',
      default: '#95a5a6',
    };
    return heatmapColors[type] || heatmapColors.default;
  }

  // Default relationship colors
  const colors: Record<string, string> = {
    crate: '#3498db',
    function: '#9b59b6',
    struct: '#2ecc71',
    enum: '#e74c3c',
    default: '#95a5a6',
  };
  return colors[type] || colors.default;
};

export const DiagramPanel: React.FC<DiagramPanelProps> = ({
  nodes: erdNodes,
  edges: erdEdges,
  viewMode,
  focusedNodeId,
  searchResults,
  onNodeClick,
  useGridLayout = true,
}) => {
  const [selectedNodeForPopup, setSelectedNodeForPopup] = useState<NodeData | null>(null);
  const flowNodes: Node[] = useMemo(() => {
    if (useGridLayout) {
      // Use the new grid layout
      const layoutPositions = createGridLayout(erdNodes);

      return layoutPositions.map(({ node, x, y, width, height }) => {
        const isSearchResult = searchResults?.some(n => n.id === node.id);
        const isFocused = node.id === focusedNodeId;

        // Determine if this is a data type node (top row - no edges)
        const isDataType = node.type.toLowerCase() === 'enum' ||
                          (node.type.toLowerCase() === 'struct' && !node.details?.methods);

        return {
          id: node.id,
          type: 'default',
          data: {
            label: (
              <div style={{ textAlign: 'center', overflow: 'hidden' }}>
                <div style={{ fontWeight: 'bold', fontSize: '11px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {node.name}
                </div>
                <div style={{ fontSize: '9px', color: '#666' }}>{node.type}</div>
              </div>
            ),
            erdNode: node,
          },
          position: { x, y },
          style: {
            background: getNodeColor(node.type, viewMode),
            color: '#fff',
            border: isFocused ? '3px solid #ff0000' : isSearchResult ? '2px solid #ffeb3b' : '1px solid #222',
            borderRadius: '4px',
            padding: '8px',
            width: width,
            height: height,
            fontSize: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          },
          sourcePosition: Position.Right,
          targetPosition: Position.Left,
        };
      });
    } else {
      // Use the old layout
      const nodesByType = new Map<string, NodeData[]>();
      erdNodes.forEach(node => {
        if (!nodesByType.has(node.type)) {
          nodesByType.set(node.type, []);
        }
        nodesByType.get(node.type)!.push(node);
      });

      const nodes: Node[] = [];
      let yOffset = 0;
      const typeSpacing = 200;

      Array.from(nodesByType.entries()).forEach(([type, typeNodes]) => {
        typeNodes.forEach((node, index) => {
          const isSearchResult = searchResults?.some(n => n.id === node.id);
          const isFocused = node.id === focusedNodeId;

          nodes.push({
            id: node.id,
            type: 'default',
            data: {
              label: (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '12px' }}>{node.name}</div>
                  <div style={{ fontSize: '10px', color: '#666' }}>{node.type}</div>
                </div>
              ),
              erdNode: node,
            },
            position: { x: index * 250, y: yOffset },
            style: {
              background: getNodeColor(node.type, viewMode),
              color: '#fff',
              border: isFocused ? '3px solid #ff0000' : isSearchResult ? '2px solid #ffeb3b' : '1px solid #222',
              borderRadius: '8px',
              padding: '10px',
              width: 180,
              fontSize: '11px',
            },
            sourcePosition: Position.Right,
            targetPosition: Position.Left,
          });
        });
        yOffset += typeSpacing;
      });

      return nodes;
    }
  }, [erdNodes, viewMode, focusedNodeId, searchResults, useGridLayout]);

  const flowEdges: FlowEdge[] = useMemo(() => {
    if (useGridLayout) {
      // In grid layout, only show edges for nodes that are not in the top row (data types)
      const dataTypeNodeIds = new Set(
        erdNodes
          .filter(node => {
            const isDataType = node.type.toLowerCase() === 'enum' ||
                              (node.type.toLowerCase() === 'struct' && !node.details?.methods);
            return isDataType;
          })
          .map(node => node.id)
      );

      return erdEdges
        .filter(edge => !dataTypeNodeIds.has(edge.from) && !dataTypeNodeIds.has(edge.to))
        .map((edge, index) => ({
          id: `edge-${index}`,
          source: edge.from,
          target: edge.to,
          type: 'smoothstep',
          animated: viewMode === 'relationship',
          label: edge.type,
          labelStyle: { fontSize: 8, fill: '#666' },
          style: { stroke: '#888', strokeWidth: 1 },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#888',
          },
        }));
    } else {
      return erdEdges.map((edge, index) => ({
        id: `edge-${index}`,
        source: edge.from,
        target: edge.to,
        type: 'smoothstep',
        animated: viewMode === 'relationship',
        label: edge.type,
        labelStyle: { fontSize: 10, fill: '#666' },
        style: { stroke: '#888', strokeWidth: 2 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#888',
        },
      }));
    }
  }, [erdEdges, viewMode, useGridLayout, erdNodes]);

  const [nodes, setNodes, onNodesChange] = useNodesState(flowNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(flowEdges);

  useEffect(() => {
    setNodes(flowNodes);
  }, [flowNodes, setNodes]);

  useEffect(() => {
    setEdges(flowEdges);
  }, [flowEdges, setEdges]);

  const onNodeClickHandler = useCallback((event: React.MouseEvent, node: Node) => {
    if (onNodeClick && node.data.erdNode) {
      onNodeClick(node.data.erdNode);
    }
  }, [onNodeClick]);

  const onNodeDoubleClickHandler = useCallback((event: React.MouseEvent, node: Node) => {
    if (node.data.erdNode) {
      setSelectedNodeForPopup(node.data.erdNode);
    }
  }, []);

  return (
    <div className="erd-diagram-panel">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClickHandler}
        onNodeDoubleClick={onNodeDoubleClickHandler}
        fitView
        attributionPosition="bottom-left"
      >
        <Background />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            const erdNode = node.data.erdNode as NodeData;
            return erdNode ? getNodeColor(erdNode.type, viewMode) : '#95a5a6';
          }}
          nodeStrokeWidth={3}
          zoomable
          pannable
        />
      </ReactFlow>

      {selectedNodeForPopup && (
        <NodeDetailsPopup
          node={selectedNodeForPopup}
          onClose={() => setSelectedNodeForPopup(null)}
        />
      )}
    </div>
  );
};
