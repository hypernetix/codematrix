import React, { useState, useMemo, useEffect, useRef } from 'react';
import { NodeData, Edge, ViewMode } from '../types';
import { categorizeNodesBySegment, GridSegment } from '../layoutEngine';
import { calculateGridLayout, generateGridTemplateColumns } from '../gridLayoutAlgorithm';
// Previous modal removed in favor of unified toast-based previews
// import { NodeDetailsPopup } from './NodeDetailsPopup';
import { highlightRustHtml } from '../utils/highlight';

interface CustomDiagramPanelProps {
  /** Nodes for the current crate / view */
  nodes: NodeData[];
  /** All nodes from the ERD model (used for cross-file relationships like class_struct -> methods) */
  allNodes: NodeData[];
  /** All edges from the ERD model */
  edges: Edge[];
  viewMode: ViewMode;
  focusedNodeId?: string | null;
  searchResults?: NodeData[];
  onNodeClick?: (node: NodeData | null) => void;
  onUiHintChange?: (hint: string) => void;
  settings: DiagramSettings;
}

interface ClassStructWithMethods {
  classStruct: NodeData;
  methods: NodeData[];
}

interface FolderGroup {
  folder: string;
  segment: GridSegment;
  files: FileGroup[];
}

interface FileGroup {
  fileName: string;
  items: (NodeData | ClassStructWithMethods)[];
}

interface DiagramSettings {
  showReferencesOnHighlight: boolean;
}

// Heatmap colors for heatmap view mode only
const getHeatmapColor = (type: string): string => {
    const heatmapColors: Record<string, string> = {
      crate: '#FF6B6B',
      function: '#FFD93D',
      struct: '#6BCF7F',
      enum: '#4D96FF',
      method: '#F39C12',
      class_struct: '#9B59B6',
      default: '#95A5A6',
    };
    return heatmapColors[type] || heatmapColors.default;
};

const getFolder = (node: NodeData): string => {
  if (!node.filename) return 'Unknown';
  const parts = node.filename.split(/[/\\]/);
  return parts.slice(0, -1).join('/') || 'Root';
};

const getFileName = (node: NodeData): string => {
  if (!node.filename) return 'Unknown';
  const parts = node.filename.split(/[/\\]/);
  return parts[parts.length - 1] || 'Unknown';
};

const getBaseFolder = (folder: string): string => {
  const parts = folder.split('/');
  return parts[0] || folder;
};

const isMethodOrFunction = (node: NodeData): boolean => {
  const t = node.type?.toLowerCase?.() || '';
  return t === 'method' || t === 'function';
};

const formatNodeName = (node: NodeData): string => {
  return isMethodOrFunction(node) ? `${node.name}()` : node.name;
};

export const CustomDiagramPanel: React.FC<CustomDiagramPanelProps> = ({
  nodes: erdNodes,
  allNodes,
  edges: erdEdges,
  viewMode,
  focusedNodeId,
  searchResults,
  onNodeClick,
  onUiHintChange,
  settings,
}) => {
  // Unified previews
  type PermToast = {
    id: string;
    node: NodeData;
    top: number;
    left: number;
    width?: number;
    height?: number;
    z: number;
  };

  const [permToasts, setPermToasts] = useState<PermToast[]>([]);
  const [zCounter, setZCounter] = useState(10000);
  const [, setDraggingId] = useState<string | null>(null); // visual state only (not read)
  const draggingIdRef = useRef<string | null>(null);
  const dragOffsetRef = useRef<{ dx: number; dy: number }>({ dx: 0, dy: 0 });

  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(new Set()); // keys: `${segment}::${folder}`
  const [collapsedFiles, setCollapsedFiles] = useState<Set<string>>(new Set()); // keys: `${segment}::${folder}|${file}`
  const [expandAllState, setExpandAllState] = useState<'none' | 'all-expanded' | 'all-collapsed'>('none');
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoverNode, setHoverNode] = useState<NodeData | null>(null);
  // Raw mouse position; we clamp it to viewport once we know tooltip size
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [toastPos, setToastPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const hoverToastRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const [copyableKey, setCopyableKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Node position tracking for arrows
  const nodeRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [arrowUpdateTrigger, setArrowUpdateTrigger] = useState(0);

  // Controls position state
  const [controlsPos, setControlsPos] = useState({ left: 20, bottom: 20 });
  const [isDraggingControls, setIsDraggingControls] = useState(false);
  const controlsDragRef = useRef<{ offsetX: number; offsetY: number }>({ offsetX: 0, offsetY: 0 });

  // Sync selectedNodeId with focusedNodeId from left menu
  useEffect(() => {
    if (focusedNodeId) {
      setSelectedNodeId(focusedNodeId);
    }
  }, [focusedNodeId]);

  const segmentedNodes = useMemo(() => categorizeNodesBySegment(erdNodes), [erdNodes]);

  // Calculate optimal grid layout based on content distribution
  const gridLayout = useMemo(() => {
    const layout = calculateGridLayout(segmentedNodes);
    return layout;
  }, [segmentedNodes]);

  const gridTemplateColumns = useMemo(() => {
    return generateGridTemplateColumns(gridLayout);
  }, [gridLayout]);

  // Build edge map for relationship highlighting
  const edgeMap = useMemo(() => {
    const map = new Map<string, Set<string>>();
    erdEdges.forEach(edge => {
      if (!map.has(edge.from)) map.set(edge.from, new Set());
      if (!map.has(edge.to)) map.set(edge.to, new Set());
      map.get(edge.from)!.add(edge.to);
      map.get(edge.to)!.add(edge.from);
    });
    return map;
  }, [erdEdges]);

  // Build map of class_struct to methods (must be before folderGroups).
  // IMPORTANT: this must use *all* nodes from the ERD model, not just the
  // current crate nodes, because methods can live in different files/modules
  // than their parent class_struct.
  const classStructMethodsMap = useMemo(() => {
    const map = new Map<string, NodeData[]>();
    erdEdges.forEach(edge => {
      if (edge.type === 'includes' && edge.from.includes('class_struct::') && edge.to.includes('|method::')) {
        const methods = map.get(edge.from) || [];
        // Use allNodes so that methods defined in other files/modules
        // are still discovered and attached to their class_struct.
        const methodNode = allNodes.find(n => n.id === edge.to);
        if (methodNode) {
          methods.push(methodNode);
        }
        map.set(edge.from, methods);
      }
    });
    // Sort methods alphabetically for each class_struct
    map.forEach((methods, key) => {
      map.set(key, methods.sort((a, b) => a.name.localeCompare(b.name)));
    });
    return map;
  }, [allNodes, erdEdges]);

  // Calculate node relationship levels - only selected and direct
  const getNodeRelationship = (nodeId: string): 'selected' | 'direct' | null => {
    if (!selectedNodeId) return null; // No highlighting when nothing selected
    if (nodeId === selectedNodeId) return 'selected';

    const directConnections = edgeMap.get(selectedNodeId);
    if (directConnections?.has(nodeId)) return 'direct';

    // If the nodeId is a class_struct, check if any of its methods are directly connected
    const methodsOfThisClass = classStructMethodsMap.get(nodeId);
    if (methodsOfThisClass) {
      for (const method of methodsOfThisClass) {
        if (directConnections?.has(method.id)) {
          return 'direct'; // Highlight the class_struct if any of its methods are connected
        }
      }
    }

    // No indirect or dimming
    return null;
  };

  const folderGroups = useMemo(() => {
    const groups: FolderGroup[] = [];

    // Build a global set of all methods that belong to any class_struct
    // This must be done BEFORE iterating through segments
    const methodsInClassStructs = new Set<string>();
    classStructMethodsMap.forEach((methods) => {
      methods.forEach(m => methodsInClassStructs.add(m.id));
    });

    segmentedNodes.forEach((nodes, segment) => {
      const folderMap = new Map<string, Map<string, (NodeData | ClassStructWithMethods)[]>>();

      // Build file groups with class_struct+methods or standalone nodes
      nodes.forEach((node) => {
        // Skip methods that belong to a class_struct (they'll be rendered with their parent)
        if (node.type === 'method' && methodsInClassStructs.has(node.id)) {
          return;
        }

        const folder = getFolder(node);
        const fileName = getFileName(node);

        if (!folderMap.has(folder)) {
          folderMap.set(folder, new Map());
        }

        const fileMap = folderMap.get(folder)!;
        if (!fileMap.has(fileName)) {
          fileMap.set(fileName, []);
        }

        // If it's a class_struct with methods, create a grouped item
        if (node.type === 'class_struct') {
          const methods = classStructMethodsMap.get(node.id) || [];
          if (methods.length > 0) {
            fileMap.get(fileName)!.push({ classStruct: node, methods });
          } else {
            fileMap.get(fileName)!.push(node);
          }
        } else {
          fileMap.get(fileName)!.push(node);
        }
      });

      folderMap.forEach((fileMap, folder) => {
        const files: FileGroup[] = [];
        fileMap.forEach((items, fileName) => {
          // Sort items: class_structs and regular nodes by name
          items.sort((a, b) => {
            const aName = 'classStruct' in a ? a.classStruct.name : a.name;
            const bName = 'classStruct' in b ? b.classStruct.name : b.name;
            return aName.localeCompare(bName);
          });
          files.push({ fileName, items });
        });
        groups.push({
          folder,
          segment,
          files: files.sort((a, b) => a.fileName.localeCompare(b.fileName)),
        });
      });
    });

    return groups.sort((a, b) => a.folder.localeCompare(b.folder));
  }, [segmentedNodes, classStructMethodsMap]);

  const isFolderCollapsed = (segment: GridSegment, folder: string): boolean => {
    if (expandAllState === 'all-collapsed') return true;
    if (expandAllState === 'all-expanded') return false;

    const folderKey = `${segment}::${folder}`;
    if (collapsedFolders.has(folderKey)) return true;
    const baseFolder = getBaseFolder(folder);
    const baseKey = `${segment}::${baseFolder}`;
    if (baseFolder !== folder && collapsedFolders.has(baseKey)) {
      return true;
    }
    return false;
  };

  const isFileCollapsed = (segment: GridSegment, folder: string, fileName: string): boolean => {
    if (expandAllState === 'all-collapsed') return true;
    if (expandAllState === 'all-expanded') return false;

    const key = `${segment}::${folder}|${fileName}`;
    return collapsedFiles.has(key);
  };

  const toggleFolder = (segment: GridSegment, folder: string) => {
    setExpandAllState('none');
    setCollapsedFolders((prev) => {
      const newSet = new Set(prev);
      const key = `${segment}::${folder}`;
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  const toggleFile = (segment: GridSegment, folder: string, fileName: string) => {
    setExpandAllState('none');
    const key = `${segment}::${folder}|${fileName}`;
    setCollapsedFiles((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };
  // Copy handlers for folder/file names
  const handleCopyHover = (key: string, e: React.MouseEvent) => {
    if (e.metaKey || e.ctrlKey) setCopyableKey(key);
    else if (copyableKey === key) setCopyableKey(null);
  };
  const handleCopyClick = (key: string, text: string, e: React.MouseEvent) => {
    if (!(e.metaKey || e.ctrlKey)) return;
    e.stopPropagation();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        setCopiedKey(key);
        window.setTimeout(() => setCopiedKey((k) => (k === key ? null : k)), 1000);
      }).catch(() => {
        // fallback: do nothing
      });
    }
  };

  const expandAll = () => {
    setExpandAllState('all-expanded');
    setCollapsedFolders(new Set());
    setCollapsedFiles(new Set());
  };

  const collapseAll = () => {
    setExpandAllState('all-collapsed');
  };

  const handleNodeClick = (node: NodeData, e: React.MouseEvent) => {
    // Cmd/Ctrl + click => make toast permanent
    if (e.metaKey || e.ctrlKey) {
      openPermanentToast(node, e);
      return;
    }
    // Otherwise do nothing on click
  };

  const handleDeselect = () => {
    setSelectedNodeId(null);
  };

  const openPermanentToast = (node: NodeData, e?: React.MouseEvent) => {
    // If toast for this node already exists, just bring to front
    const existing = permToasts.find((t) => t.node.id === node.id);
    if (existing) {
      bringToFront(existing.id);
      return;
    }
    // Place new toast where the hover preview currently is (if matching node),
    // otherwise compute adjacent to cursor (estimate initial size)
    let top = toastPos.top;
    let left = toastPos.left;
    if (!(hoverNode && hoverNode.id === node.id)) {
      const margin = 12;
      const estWidth = 480;
      const estHeight = 260;
      const pos = computeAdjacentToastPos(
        e?.clientX ?? window.innerWidth / 3,
        e?.clientY ?? window.innerHeight / 3,
        estWidth,
        estHeight,
        margin
      );
      top = pos.top;
      left = pos.left;
    }
    setZCounter((z) => z + 1);
    const newZ = zCounter + 1;
    setPermToasts((prev) => [
      ...prev,
      { id: `${node.id}-${Date.now()}`, node, top, left, z: newZ },
    ]);
    // Hide hover preview once pinned
    setHoverNode(null);
  };

  const closeTopToast = () => {
    if (permToasts.length === 0) return;
    const topZ = Math.max(...permToasts.map((t) => t.z));
    setPermToasts((prev) => prev.filter((t) => t.z !== topZ));
  };

  const bringToFront = (id: string) => {
    setZCounter((z) => z + 1);
    const newZ = zCounter + 1;
    setPermToasts((prev) => prev.map((t) => (t.id === id ? { ...t, z: newZ } : t)));
  };

  const handleWindowDragMove = (e: MouseEvent) => {
    if (!draggingIdRef.current) return;
    const { dx, dy } = dragOffsetRef.current;
    const nx = e.clientX - dx;
    const ny = e.clientY - dy;
    const margin = 8;
    const left = Math.max(margin, Math.min(nx, window.innerWidth - margin));
    const top = Math.max(margin, Math.min(ny, window.innerHeight - margin));
    const currentId = draggingIdRef.current;
    setPermToasts((prev) => prev.map((t) => (t.id === currentId ? { ...t, left, top } : t)));
  };

  const handleWindowDragEnd = () => {
    window.removeEventListener('mousemove', handleWindowDragMove);
    window.removeEventListener('mouseup', handleWindowDragEnd);
    draggingIdRef.current = null;
    setDraggingId(null);
  };

  const startDrag = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    bringToFront(id);
    const toast = permToasts.find((t) => t.id === id);
    if (!toast) return;
    const nextOffset = { dx: e.clientX - toast.left, dy: e.clientY - toast.top };
    draggingIdRef.current = id;
    dragOffsetRef.current = nextOffset;
    setDraggingId(id);
    window.addEventListener('mousemove', handleWindowDragMove);
    window.addEventListener('mouseup', handleWindowDragEnd);
  };

  const handleNodeDoubleClick = (node: NodeData, _e?: React.MouseEvent) => {
    // Double click => toggle selection
    if (selectedNodeId === node.id) {
      setSelectedNodeId(null);
      // Notify parent to clear selection
      onNodeClick?.(null as any);
    } else {
      setSelectedNodeId(node.id);
      onNodeClick?.(node);
    }
  };

  const handleWheel = (e: WheelEvent) => {
    if (e.shiftKey) {
      // Zoom with Shift+scroll (6x less sensitive than original)
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.985 : 1.015;
      setScale((prev) => Math.min(Math.max(prev * delta, 0.1), 3));
    } else {
      // Normal scroll without Shift
      e.preventDefault();
      setPan((prev) => ({
        x: prev.x - e.deltaX,
        y: prev.y - e.deltaY,
      }));
    }
  };

  const updateHoverPreview = (node: NodeData, e: React.MouseEvent) => {
    // Do not show hover preview if a permanent toast for this node already exists
    if (permToasts.some((t) => t.node.id === node.id)) {
      setHoverNode(null);
      return;
    }
    const show = (e.metaKey || e.ctrlKey) && !!node.source_code;
    if (show) {
      setHoverNode(node);
      setHoverPos({ x: e.clientX, y: e.clientY });
    } else {
      setHoverNode(null);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      const target = e.target as HTMLElement;
      if (
        target.classList.contains('erd-diagram-canvas') ||
        target.classList.contains('erd-grid-container') ||
        target.classList.contains('erd-grid-cell') ||
        target.classList.contains('erd-grid-header') ||
        target.classList.contains('erd-grid-header-row')
      ) {
        setIsPanning(true);
        setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const resetView = () => {
    setScale(1);
    setPan({ x: 0, y: 0 });
  };

  // Controls dragging handlers
  const handleControlsMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, .erd-zoom-level')) {
      return; // Don't drag when clicking buttons or zoom level
    }
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingControls(true);
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    controlsDragRef.current = {
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - (window.innerHeight - rect.bottom),
    };
  };

  const handleControlsDragMove = (e: MouseEvent) => {
    if (!isDraggingControls) return;
    const { offsetX, offsetY } = controlsDragRef.current;
    const newLeft = e.clientX - offsetX;
    const newBottom = window.innerHeight - e.clientY - offsetY;

    // Clamp to viewport
    const margin = 10;
    const clampedLeft = Math.max(margin, Math.min(newLeft, window.innerWidth - 300));
    const clampedBottom = Math.max(margin, Math.min(newBottom, window.innerHeight - 60));

    setControlsPos({ left: clampedLeft, bottom: clampedBottom });
  };

  const handleControlsDragEnd = () => {
    setIsDraggingControls(false);
  };

  useEffect(() => {
    if (isDraggingControls) {
      window.addEventListener('mousemove', handleControlsDragMove);
      window.addEventListener('mouseup', handleControlsDragEnd);
      return () => {
        window.removeEventListener('mousemove', handleControlsDragMove);
        window.removeEventListener('mouseup', handleControlsDragEnd);
      };
    }
  }, [isDraggingControls]);

  // ESC closes the top-most permanent toast; if none, deselect
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (permToasts.length > 0) {
          closeTopToast();
        } else if (selectedNodeId) {
          setSelectedNodeId(null);
          // Notify parent to clear selection
          onNodeClick?.(null as any);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [permToasts, selectedNodeId, onNodeClick]);

  // Update footer hint
  useEffect(() => {
    if (!onUiHintChange) return;
    if (permToasts.length > 0) {
      onUiHintChange(`Esc: close top toast (${permToasts.length} open)`);
    } else if (selectedNodeId) {
      onUiHintChange('Esc: deselect node');
    } else {
      onUiHintChange('Esc: —');
    }
  }, [permToasts.length, selectedNodeId, onUiHintChange]);

  const segmentGroups = useMemo(() => {
    const segments: GridSegment[] = [
      'left-top', 'middle-top', 'right-top', 'gateway-top',
      'left-middle', 'middle-middle', 'right-middle', 'gateway-middle',
      'left-bottom', 'middle-bottom', 'right-bottom', 'gateway-bottom',
      'left-tests', 'middle-tests', 'right-tests', 'gateway-tests',
    ];

    return segments.map(segment => ({
      segment,
      folders: folderGroups.filter(g => g.segment === segment),
    }));
  }, [folderGroups]);

  // Compute an adjacent position for a tooltip near the cursor that never overlaps it.
  // If mouse X > half canvas width, show on left; otherwise show on right.
  const computeAdjacentToastPos = (
    x: number,
    y: number,
    width: number,
    height: number,
    margin: number
  ): { left: number; top: number } => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // Get canvas bounds to determine center relative to canvas, not window
    let canvasCenterX = vw / 2;
    if (canvasRef.current) {
      const canvasRect = canvasRef.current.getBoundingClientRect();
      canvasCenterX = canvasRect.left + canvasRect.width / 2;
    }

    // If mouse X > half canvas width, show toast on LEFT
    // If mouse X <= half canvas width, show toast on RIGHT
    const isRightSide = x > canvasCenterX;

    // Prioritize left/right based on mouse position relative to canvas center
    // When on right side of canvas -> show toast on left
    // When on left side of canvas -> show toast on right
    const candidates = isRightSide
      ? [
          { left: x - width - margin, top: y + margin }, // bottom-left
          { left: x - width - margin, top: y - height - margin }, // top-left
          { left: x + margin, top: y + margin }, // bottom-right (fallback)
          { left: x + margin, top: y - height - margin }, // top-right (fallback)
        ]
      : [
          { left: x + margin, top: y + margin }, // bottom-right
          { left: x + margin, top: y - height - margin }, // top-right
          { left: x - width - margin, top: y + margin }, // bottom-left (fallback)
          { left: x - width - margin, top: y - height - margin }, // top-left (fallback)
        ];

    for (const c of candidates) {
      if (
        c.left >= margin &&
        c.top >= margin &&
        c.left + width <= vw - margin &&
        c.top + height <= vh - margin
      ) {
        return c;
      }
    }
    // Fallback: clamp to viewport
    return {
      left: Math.min(Math.max(x + margin, margin), vw - width - margin),
      top: Math.min(Math.max(y + margin, margin), vh - height - margin),
    };
  };

  // Clamp hover toast position to viewport and never overlap pointer
  useEffect(() => {
    if (!hoverNode || !hoverToastRef.current) return;
    const el = hoverToastRef.current;
    const rect = el.getBoundingClientRect();
    const margin = 12;
    const pos = computeAdjacentToastPos(hoverPos.x, hoverPos.y, rect.width, rect.height, margin);
    setToastPos({ top: pos.top, left: pos.left });
  }, [hoverNode, hoverPos]);

  // Calculate arrows between selected node and connected nodes
  interface Arrow {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    label: string;
    fromId: string;
    toId: string;
  }

  const arrows = useMemo((): Arrow[] => {
    if (!selectedNodeId || !canvasRef.current || !settings.showReferencesOnHighlight) return [];

    const result: Arrow[] = [];
    const canvasRect = canvasRef.current.getBoundingClientRect();

    // Get selected node element
    const selectedEl = nodeRefs.current.get(selectedNodeId);
    if (!selectedEl) return [];

    const selectedRect = selectedEl.getBoundingClientRect();
    const selectedCenter = {
      x: selectedRect.left + selectedRect.width / 2 - canvasRect.left,
      y: selectedRect.top + selectedRect.height / 2 - canvasRect.top,
    };

    // Find all edges involving the selected node (excluding "includes" relationships)
    erdEdges.forEach(edge => {
      // Skip "includes" edge type
      if (edge.type === 'includes') return;

      // Skip self-referencing edges (self-calls)
      if (edge.from === edge.to) return;

      let connectedNodeId: string | null = null;
      let isOutgoing = false;

      if (edge.from === selectedNodeId) {
        connectedNodeId = edge.to;
        isOutgoing = true;
      } else if (edge.to === selectedNodeId) {
        connectedNodeId = edge.from;
        isOutgoing = false;
      }

      if (!connectedNodeId) return;

      const connectedEl = nodeRefs.current.get(connectedNodeId);
      if (!connectedEl) return;

      const connectedRect = connectedEl.getBoundingClientRect();
      const connectedCenter = {
        x: connectedRect.left + connectedRect.width / 2 - canvasRect.left,
        y: connectedRect.top + connectedRect.height / 2 - canvasRect.top,
      };

      // Calculate arrow start and end points at node edges
      const fromCenter = isOutgoing ? selectedCenter : connectedCenter;
      const toCenter = isOutgoing ? connectedCenter : selectedCenter;
      const fromRect = isOutgoing ? selectedRect : connectedRect;
      const toRect = isOutgoing ? connectedRect : selectedRect;

      // Calculate intersection points with node rectangles
      const dx = toCenter.x - fromCenter.x;
      const dy = toCenter.y - fromCenter.y;
      const angle = Math.atan2(dy, dx);

      // Calculate start point at edge of source node
      const fromHalfWidth = fromRect.width / 2;
      const fromHalfHeight = fromRect.height / 2;
      const fromEdgeX = fromCenter.x + Math.cos(angle) * fromHalfWidth;
      const fromEdgeY = fromCenter.y + Math.sin(angle) * fromHalfHeight;

      // Calculate end point at edge of target node
      const toHalfWidth = toRect.width / 2;
      const toHalfHeight = toRect.height / 2;
      const toEdgeX = toCenter.x - Math.cos(angle) * toHalfWidth;
      const toEdgeY = toCenter.y - Math.sin(angle) * toHalfHeight;

      // Create arrow with edge-to-edge positioning
      const arrow: Arrow = {
        x1: fromEdgeX,
        y1: fromEdgeY,
        x2: toEdgeX,
        y2: toEdgeY,
        label: edge.type,
        fromId: isOutgoing ? selectedNodeId : connectedNodeId,
        toId: isOutgoing ? connectedNodeId : selectedNodeId,
      };

      result.push(arrow);
    });

    return result;
  }, [selectedNodeId, erdEdges, arrowUpdateTrigger, settings.showReferencesOnHighlight]);

  // Trigger arrow updates when pan/zoom changes or selection changes
  useEffect(() => {
    if (selectedNodeId && settings.showReferencesOnHighlight) {
      // Update immediately for real-time movement during scroll/pan
      setArrowUpdateTrigger(prev => prev + 1);
    }
  }, [selectedNodeId, scale, pan, settings.showReferencesOnHighlight]);

  // Attach wheel event listener with passive: false to allow preventDefault
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      canvas.removeEventListener('wheel', handleWheel);
    };
  }, [scale, pan]);

  return (
    <div className="erd-custom-diagram-panel">
      <div
        className={`erd-diagram-controls ${isDraggingControls ? 'dragging' : ''}`}
        style={{ left: `${controlsPos.left}px`, bottom: `${controlsPos.bottom}px` }}
        onMouseDown={handleControlsMouseDown}
      >
        <div className="erd-controls-drag-handle" title="Drag to move controls">⋮⋮</div>
        <button onClick={() => setScale((s) => Math.min(s * 1.2, 3))} title="Zoom In (Shift + Scroll Up)">
          +
        </button>
        <button onClick={() => setScale((s) => Math.max(s * 0.8, 0.1))} title="Zoom Out (Shift + Scroll Down)">
          −
        </button>
        <button onClick={resetView} title="Reset View">
          ⊙
        </button>
        <span className="erd-zoom-level">{Math.round(scale * 100)}%</span>
        <div className="erd-control-divider"></div>
        <button onClick={expandAll} title="Expand All">
          ⊞
        </button>
        <button onClick={collapseAll} title="Collapse All">
          ⊟
        </button>
        <div className="erd-control-divider"></div>
        <button onClick={handleDeselect} title="Deselect Node" disabled={!selectedNodeId}>
          ✕
        </button>
      </div>

      <div
        ref={canvasRef}
        className={`erd-diagram-canvas ${selectedNodeId ? 'has-selection' : ''}`}
        onMouseDown={handleMouseDown}
        onMouseMove={(e) => { handleMouseMove(e); }}
        onMouseUp={() => { handleMouseUp(); }}
        onMouseLeave={handleMouseUp}
        style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
      >
        <div
          className="erd-grid-container"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
            gridTemplateColumns,
          }}
        >
          {/* Header row */}
          <div className="erd-grid-header erd-grid-header-top-left"></div>
          <div className="erd-grid-header erd-grid-header-interface">API Interfaces</div>
          <div className="erd-grid-header erd-grid-header-service">Service</div>
          <div className="erd-grid-header erd-grid-header-repository">Repository</div>
          <div className="erd-grid-header erd-grid-header-gateway">Gateways</div>

          {/* Header column */}
          <div className="erd-grid-header erd-grid-header-row erd-grid-header-data-struct">Data Types</div>
          <div className="erd-grid-header erd-grid-header-row erd-grid-header-classes">Classes, Interfaces</div>
          <div className="erd-grid-header erd-grid-header-row erd-grid-header-free-functions">Free Functions</div>
          <div className="erd-grid-header erd-grid-header-row erd-grid-header-tests">Tests</div>

          {segmentGroups.map(({ segment, folders }) => (
            <div key={segment} className={`erd-grid-cell erd-grid-cell-${segment}`}>
              {folders.map((folderGroup) => {
                const isFolderColl = isFolderCollapsed(segment, folderGroup.folder);

                // Calculate total nodes in folder to determine width
                const totalNodes = folderGroup.files.reduce((sum, file) => {
                  const nodeCount = Array.isArray(file.items) ? file.items.length : 0;
                  return sum + nodeCount;
                }, 0);
                const widthClass = totalNodes > 20 ? 'width-100' : totalNodes > 10 ? 'width-66' : totalNodes > 5 ? 'width-50' : 'width-33';

                return (
                  <div key={`${segment}-${folderGroup.folder}`} className={`erd-folder-container ${isFolderColl ? 'collapsed' : widthClass}`}>
                    <div
                      className="erd-folder-header"
                      onClick={() => toggleFolder(segment, folderGroup.folder)}
                    >
                      <span className="erd-folder-icon">
                        {isFolderColl ? '📁' : '📂'}
                      </span>
                      <span
                        className={`erd-folder-name ${
                          copyableKey === `${segment}::${folderGroup.folder}` ? 'erd-copyable' : ''
                        } ${copiedKey === `${segment}::${folderGroup.folder}` ? 'erd-copied' : ''}`}
                        onMouseEnter={(e) =>
                          handleCopyHover(`${segment}::${folderGroup.folder}`, e)
                        }
                        onMouseMove={(e) =>
                          handleCopyHover(`${segment}::${folderGroup.folder}`, e)
                        }
                        onMouseLeave={() => setCopyableKey(null)}
                        onClick={(e) =>
                          handleCopyClick(
                            `${segment}::${folderGroup.folder}`,
                            folderGroup.folder,
                            e
                          )
                        }
                        title="Cmd/Ctrl + click to copy path"
                      >
                        {folderGroup.folder}
                      </span>
                      <span className="erd-folder-toggle">
                        {isFolderColl ? '▶' : '▼'}
                      </span>
                    </div>

                    {!isFolderColl && (
                      <div className="erd-folder-files-wrapper">
                        {folderGroup.files.map((fileGroup) => {
                          const isFileColl = isFileCollapsed(segment, folderGroup.folder, fileGroup.fileName);

                          return (
                            <div
                              key={`${segment}-${folderGroup.folder}-${fileGroup.fileName}`}
                              className={`erd-file-container ${isFileColl ? 'collapsed' : ''}`}
                            >
                              <div
                                className="erd-file-header"
                                onClick={() => toggleFile(segment, folderGroup.folder, fileGroup.fileName)}
                              >
                                <span className="erd-file-icon">
                                  {isFileColl ? '📄' : '📃'}
                                </span>
                                <span
                                  className={`erd-file-name ${
                                    copyableKey === `${segment}::${folderGroup.folder}|${fileGroup.fileName}`
                                      ? 'erd-copyable'
                                      : ''
                                  } ${
                                    copiedKey === `${segment}::${folderGroup.folder}|${fileGroup.fileName}`
                                      ? 'erd-copied'
                                      : ''
                                  }`}
                                  onMouseEnter={(e) =>
                                    handleCopyHover(
                                      `${segment}::${folderGroup.folder}|${fileGroup.fileName}`,
                                      e
                                    )
                                  }
                                  onMouseMove={(e) =>
                                    handleCopyHover(
                                      `${segment}::${folderGroup.folder}|${fileGroup.fileName}`,
                                      e
                                    )
                                  }
                                  onMouseLeave={() => setCopyableKey(null)}
                                  onClick={(e) =>
                                    handleCopyClick(
                                      `${segment}::${folderGroup.folder}|${fileGroup.fileName}`,
                                      `${folderGroup.folder}/${fileGroup.fileName}`,
                                      e
                                    )
                                  }
                                  title="Cmd/Ctrl + click to copy file path"
                                >
                                  {fileGroup.fileName}
                                </span>
                                <span className="erd-file-toggle">
                                  {isFileColl ? '▶' : '▼'}
                                </span>
                              </div>

                              {!isFileColl && (
                                <div className="erd-nodes-container">
                                  {fileGroup.items.map((item) => {
                                    // Check if item is a ClassStructWithMethods
                                    if ('classStruct' in item) {
                                      const { classStruct, methods } = item;
                                      const isSearchResult = searchResults?.some((n) => n.id === classStruct.id);
                                      const isFocused = classStruct.id === focusedNodeId;
                                      const relationship = getNodeRelationship(classStruct.id);

                                      return (
                                        <div key={classStruct.id} className="erd-class-struct-container">
                                          {/* Render class_struct node */}
                                          <div
                                            ref={(el) => {
                                              if (el) nodeRefs.current.set(classStruct.id, el);
                                              else nodeRefs.current.delete(classStruct.id);
                                            }}
                                            className={`erd-node ${isFocused ? 'focused' : ''} ${
                                              isSearchResult ? 'search-result' : ''
                                            } ${relationship ? `erd-node-${relationship}` : ''}`}
                                            data-node-type={classStruct.type.toLowerCase()}
                                            style={viewMode === 'heatmap' ? {
                                              backgroundColor: getHeatmapColor(classStruct.type),
                                            } : undefined}
                                            onClick={(e) => handleNodeClick(classStruct, e)}
                                            onDoubleClick={(e) => handleNodeDoubleClick(classStruct, e)}
                                            onMouseEnter={(e) => updateHoverPreview(classStruct, e)}
                                            onMouseMove={(e) => updateHoverPreview(classStruct, e)}
                                            onMouseLeave={() => setHoverNode(null)}
                                          >
                                            <div className="erd-node-content">
                                              <div className="erd-node-name">{classStruct.name}</div>
                                            </div>
                                          </div>

                                          {/* Render methods */}
                                          {methods.map((method) => {
                                            const methodIsSearchResult = searchResults?.some((n) => n.id === method.id);
                                            const methodIsFocused = method.id === focusedNodeId;
                                            const methodRelationship = getNodeRelationship(method.id);

                                            return (
                                              <div
                                                key={method.id}
                                                ref={(el) => {
                                                  if (el) nodeRefs.current.set(method.id, el);
                                                  else nodeRefs.current.delete(method.id);
                                                }}
                                                className={`erd-node ${methodIsFocused ? 'focused' : ''} ${
                                                  methodIsSearchResult ? 'search-result' : ''
                                                } ${methodRelationship ? `erd-node-${methodRelationship}` : ''}`}
                                                data-node-type={method.type.toLowerCase()}
                                                style={viewMode === 'heatmap' ? {
                                                  backgroundColor: getHeatmapColor(method.type),
                                                } : undefined}
                                                onClick={(e) => handleNodeClick(method, e)}
                                                onDoubleClick={(e) => handleNodeDoubleClick(method, e)}
                                                onMouseEnter={(e) => updateHoverPreview(method, e)}
                                                onMouseMove={(e) => updateHoverPreview(method, e)}
                                                onMouseLeave={() => setHoverNode(null)}
                                              >
                                                <div className="erd-node-content">
                                                  <div className="erd-node-name">{formatNodeName(method)}</div>
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      );
                                    }

                                    // Regular node
                                    const node = item as NodeData;
                                    const isSearchResult = searchResults?.some((n) => n.id === node.id);
                                    const isFocused = node.id === focusedNodeId;
                                    const relationship = getNodeRelationship(node.id);

                                    return (
                                      <div
                                        key={node.id}
                                        ref={(el) => {
                                          if (el) nodeRefs.current.set(node.id, el);
                                          else nodeRefs.current.delete(node.id);
                                        }}
                                        className={`erd-node ${isFocused ? 'focused' : ''} ${
                                          isSearchResult ? 'search-result' : ''
                                        } ${relationship ? `erd-node-${relationship}` : ''}`}
                                        data-node-type={node.type.toLowerCase()}
                                        style={viewMode === 'heatmap' ? {
                                          backgroundColor: getHeatmapColor(node.type),
                                        } : undefined}
                                        onClick={(e) => handleNodeClick(node, e)}
                                        onDoubleClick={(e) => handleNodeDoubleClick(node, e)}
                                        onMouseEnter={(e) => updateHoverPreview(node, e)}
                                        onMouseMove={(e) => updateHoverPreview(node, e)}
                                        onMouseLeave={() => setHoverNode(null)}
                                      >
                                        <div className="erd-node-content"                                        >
                                          <div className="erd-node-name">{formatNodeName(node)}</div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* SVG overlay for relationship arrows */}
        {selectedNodeId && arrows.length > 0 && (
          <svg
            className="erd-relationship-arrows"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
              zIndex: 50,
            }}
          >
            <defs>
              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="10"
                refX="9"
                refY="3"
                orient="auto"
                markerUnits="strokeWidth"
              >
                <path d="M0,0 L0,6 L9,3 z" fill="hsl(var(--node-selected))" />
              </marker>
            </defs>
            {arrows.map((arrow, idx) => {
              // Calculate midpoint for label
              const midX = (arrow.x1 + arrow.x2) / 2;
              const midY = (arrow.y1 + arrow.y2) / 2;

              // Determine label width based on text length
              const labelText = arrow.label === 'reference' ? 'refer' : arrow.label;
              const labelWidth = Math.max(50, labelText.length * 7);

              return (
                <g key={`${arrow.fromId}-${arrow.toId}-${idx}`}>
                  {/* Arrow line */}
                  <line
                    x1={arrow.x1}
                    y1={arrow.y1}
                    x2={arrow.x2}
                    y2={arrow.y2}
                    stroke="hsl(var(--node-selected))"
                    strokeWidth="1.33"
                    markerEnd="url(#arrowhead)"
                    opacity="0.7"
                  />
                  {/* Label background */}
                  <rect
                    x={midX - labelWidth / 2}
                    y={midY - 10}
                    width={labelWidth}
                    height="20"
                    fill="hsl(var(--background))"
                    stroke="hsl(var(--node-selected))"
                    strokeWidth="1"
                    rx="3"
                    opacity="0.9"
                  />
                  {/* Label text */}
                  <text
                    x={midX}
                    y={midY + 5}
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight="600"
                    fill="hsl(var(--node-selected))"
                  >
                    {labelText}
                  </text>
                </g>
              );
            })}
          </svg>
        )}
      </div>

      {/* Hover toast with source code */}
      {hoverNode?.source_code && (
        <div
          className="erd-hover-toast"
          ref={hoverToastRef}
          style={{ top: toastPos.top, left: toastPos.left }}
        >
          <div className="erd-hover-toast-title">
            {hoverNode.name} ({hoverNode.type})
            {`  -  `}
            {hoverNode.filename || 'unknown'}
            {(hoverNode.start_line != null || hoverNode.end_line != null) && (
              <> {`, ${hoverNode.start_line ?? ''} - ${hoverNode.end_line ?? ''}`}</>
            )}
          </div>
          {hoverNode.description && (
            <div className="erd-hover-toast-desc">{hoverNode.description}</div>
          )}
          <pre className="erd-hover-toast-code erd-popup-code-block">
            <code
              className="language-rust"
              dangerouslySetInnerHTML={{ __html: highlightRustHtml(hoverNode.source_code) }}
            />
          </pre>
        </div>
      )}

      {/* Permanent, movable, resizable toasts */}
      {permToasts.map((t) => (
        <div
          key={t.id}
          className="erd-hover-toast erd-perm-toast"
          style={{
            top: t.top,
            left: t.left,
            zIndex: t.z,
            width: t.width ? `${t.width}px` : undefined,
            height: t.height ? `${t.height}px` : undefined,
          }}
          onMouseDown={() => bringToFront(t.id)}
        >
          <div
            className="erd-hover-toast-title erd-perm-toast-title"
            onMouseDown={(e) => startDrag(t.id, e)}
          >
            {t.node.name} ({t.node.type})
            {`  -  `}
            {t.node.filename || 'unknown'}
            {(t.node.start_line != null || t.node.end_line != null) && (
              <> {`, ${t.node.start_line ?? ''} - ${t.node.end_line ?? ''}`}</>
            )}
            <button
              className="erd-perm-toast-close"
              onClick={(e) => {
                e.stopPropagation();
                setPermToasts((prev) => prev.filter((x) => x.id !== t.id));
              }}
            >
              ×
            </button>
          </div>
          {t.node.description && (
            <div className="erd-hover-toast-desc">{t.node.description}</div>
          )}
          <pre className="erd-hover-toast-code erd-popup-code-block erd-perm-toast-body">
            <code
              className="language-rust"
              dangerouslySetInnerHTML={{ __html: highlightRustHtml(t.node.source_code || '') }}
            />
          </pre>
        </div>
      ))}
    </div>
  );
};
