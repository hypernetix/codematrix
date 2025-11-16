import { NodeData } from './types';

export type GridSegment =
  | 'left-top' | 'left-middle' | 'left-bottom' | 'left-tests'
  | 'middle-top' | 'middle-middle' | 'middle-bottom' | 'middle-tests'
  | 'right-top' | 'right-middle' | 'right-bottom' | 'right-tests'
  | 'gateway-top' | 'gateway-middle' | 'gateway-bottom' | 'gateway-tests';

export interface SegmentedNodes {
  segment: GridSegment;
  nodes: NodeData[];
}

export interface LayoutConfig {
  columnWidth: number;
  rowHeight: number;
  padding: number;
  dataTypeBoxWidth: number;
  dataTypeBoxHeight: number;
  structWithMethodsBoxWidth: number;
  structWithMethodsBoxHeight: number;
  classNodeWidth: number;
  classNodeHeight: number;
  methodNodeWidth: number;
  methodNodeHeight: number;
}

const DEFAULT_LAYOUT_CONFIG: LayoutConfig = {
  columnWidth: 600,
  rowHeight: 400,
  padding: 20,
  dataTypeBoxWidth: 160, // 8x ratio
  dataTypeBoxHeight: 60,  // 3x ratio (8x3 = 160x60)
  structWithMethodsBoxWidth: 320, // 16x ratio (2x wider)
  structWithMethodsBoxHeight: 60,  // 3x ratio
  classNodeWidth: 160,  // 8x ratio for class/struct nodes
  classNodeHeight: 60,  // 3x ratio
  methodNodeWidth: 240, // 12x ratio for method nodes
  methodNodeHeight: 60, // 3x ratio
};

function hasInfraInPath(node: NodeData): boolean {
  return node.filename?.includes('/infra/') || node.filename?.includes('\\infra\\') || false;
}

function hasApiOrContractInPath(node: NodeData): boolean {
  const filename = node.filename || '';
  return filename.includes('/api/') ||
         filename.includes('\\api\\') ||
         filename.includes('/contract/') ||
         filename.includes('\\contract\\');
}

function hasGatewayInPath(node: NodeData): boolean {
  const filename = node.filename || '';
  const name = node.name.toLowerCase();
  return filename.includes('/gateway/') ||
         filename.includes('\\gateway\\') ||
         filename.includes('/gateways/') ||
         filename.includes('\\gateways\\') ||
         filename.includes('/client/') ||
         filename.includes('\\client\\') ||
         filename.includes('/clients/') ||
         filename.includes('\\clients\\') ||
         name.includes('gateway') ||
         name.includes('client');
}

function isTestNode(node: NodeData): boolean {
  const filename = (node.filename || '').toLowerCase();
  const name = node.name.toLowerCase();
  const id = node.id.toLowerCase();
  const hierarchy = (node.hierarchy || '').toLowerCase();

  // PRIORITY 1: Check if filename contains "tests/" anywhere in the path
  // This is the most reliable indicator
  if (filename.includes('tests/') || filename.includes('tests\\')) {
    return true;
  }

  // PRIORITY 2: Check if node lives in a "test" folder (singular)
  const inTestFolder = filename.includes('/test/') || filename.includes('\\test\\');

  // PRIORITY 3: Check if hierarchy contains tests
  const inTestsHierarchy = hierarchy.includes('tests') || hierarchy.includes('test');

  // PRIORITY 4: Check if name or id has _test or test_ in it
  const hasTestInName = name.includes('_test') ||
                        name.includes('test_') ||
                        id.includes('_test') ||
                        id.includes('test_');

  // PRIORITY 5: Check if it's in a test module (e.g., "mod test" in Rust)
  const inTestModule = id.includes('::test::') ||
                       id.includes('::tests::') ||
                       id.startsWith('test::') ||
                       id.startsWith('tests::');

  return inTestFolder || inTestsHierarchy || hasTestInName || inTestModule;
}

function isDataType(node: NodeData): boolean {
  const type = node.type.toLowerCase();
  if (type === 'enum') return true;
  if (type === 'struct' || type === 'dto') {
    // Check if it has methods in details
    const details = node.details || {};
    const attributes = details.attributes || [];
    // If it only has attributes and no methods, it's a data type
    return !details.methods && !details.functions;
  }
  return false;
}

function isStructWithMethods(node: NodeData): boolean {
  const type = node.type.toLowerCase();
  if (type === 'struct' || type === 'dto') {
    const details = node.details || {};
    return !!(details.methods || details.functions);
  }
  return false;
}

function isFreeFunction(node: NodeData): boolean {
  return node.type.toLowerCase() === 'function';
}

function getNodeFolder(node: NodeData): string {
  if (!node.filename) return '';
  const parts = node.filename.split(/[/\\]/);
  return parts.slice(0, -1).join('/');
}

function isClassStruct(node: NodeData): boolean {
  return node.type.toLowerCase() === 'class_struct';
}

function isMethod(node: NodeData): boolean {
  return node.type.toLowerCase() === 'method';
}

function getParentClassId(node: NodeData): string | null {
  // Methods have IDs like: "crate::users_info|class_struct::Service|method::new"
  // Extract the parent class_struct ID
  if (!isMethod(node)) return null;

  const parts = node.id.split('|');
  if (parts.length >= 2) {
    // Return everything up to the last pipe (which is the method part)
    return parts.slice(0, -1).join('|');
  }
  return null;
}

interface ClassWithMethods {
  classNode: NodeData;
  methods: NodeData[];
}

function groupClassesWithMethods(nodes: NodeData[]): { groups: ClassWithMethods[], orphanNodes: NodeData[] } {
  const classNodes = nodes.filter(isClassStruct);
  const methodNodes = nodes.filter(isMethod);
  const otherNodes = nodes.filter(n => !isClassStruct(n) && !isMethod(n));

  // Create a map of class ID to methods
  const methodsByClass = new Map<string, NodeData[]>();

  methodNodes.forEach(method => {
    const parentId = getParentClassId(method);
    if (parentId) {
      if (!methodsByClass.has(parentId)) {
        methodsByClass.set(parentId, []);
      }
      methodsByClass.get(parentId)!.push(method);
    }
  });

  // Create groups
  const groups: ClassWithMethods[] = classNodes.map(classNode => ({
    classNode,
    methods: (methodsByClass.get(classNode.id) || []).sort((a, b) => a.name.localeCompare(b.name))
  }));

  // Sort groups by class name
  groups.sort((a, b) => a.classNode.name.localeCompare(b.classNode.name));

  return { groups, orphanNodes: otherNodes };
}

export function categorizeNodesBySegment(nodes: NodeData[]): Map<GridSegment, NodeData[]> {
  const segments = new Map<GridSegment, NodeData[]>();

  // Initialize all segments
  const allSegments: GridSegment[] = [
    'left-top', 'left-middle', 'left-bottom', 'left-tests',
    'middle-top', 'middle-middle', 'middle-bottom', 'middle-tests',
    'right-top', 'right-middle', 'right-bottom', 'right-tests',
    'gateway-top', 'gateway-middle', 'gateway-bottom', 'gateway-tests'
  ];

  allSegments.forEach(seg => segments.set(seg, []));

  nodes.forEach(node => {
    // Skip crate nodes
    if (node.type.toLowerCase() === 'crate') return;

    // Determine column
    let column: 'left' | 'middle' | 'right' | 'gateway';
    if (hasGatewayInPath(node)) {
      column = 'gateway';
    } else if (hasInfraInPath(node)) {
      column = 'right';
    } else if (hasApiOrContractInPath(node)) {
      column = 'left';
    } else {
      column = 'middle';
    }

    // Determine row
    let row: 'top' | 'middle' | 'bottom' | 'tests';
    if (isTestNode(node)) {
      row = 'tests';
    } else if (isDataType(node)) {
      row = 'top';
    } else if (isClassStruct(node) || isMethod(node)) {
      // Both class_struct and method nodes go to middle row
      row = 'middle';
    } else if (isStructWithMethods(node)) {
      row = 'middle';
    } else if (isFreeFunction(node)) {
      row = 'bottom';
    } else {
      // Default: other node types go to middle row
      row = 'middle';
    }

    const segment: GridSegment = `${column}-${row}` as GridSegment;
    segments.get(segment)!.push(node);
  });

  return segments;
}

export function layoutNodesInSegment(
  nodes: NodeData[],
  segment: GridSegment,
  config: LayoutConfig = DEFAULT_LAYOUT_CONFIG
): Array<{ node: NodeData; x: number; y: number; width: number; height: number }> {
  const [column, row] = segment.split('-') as ['left' | 'middle' | 'right', 'top' | 'middle' | 'bottom'];

  // Calculate segment base position
  const baseX = column === 'left' ? 0 : column === 'middle' ? config.columnWidth : config.columnWidth * 2;
  const baseY = row === 'top' ? 0 : row === 'middle' ? config.rowHeight : config.rowHeight * 2;

  const result: Array<{ node: NodeData; x: number; y: number; width: number; height: number }> = [];

  // Group nodes by folder for data types (top row)
  if (row === 'top') {
    const nodesByFolder = new Map<string, NodeData[]>();
    nodes.forEach(node => {
      const folder = getNodeFolder(node);
      if (!nodesByFolder.has(folder)) {
        nodesByFolder.set(folder, []);
      }
      nodesByFolder.get(folder)!.push(node);
    });

    // Pack boxes with left float
    let currentX = baseX + config.padding;
    let currentY = baseY + config.padding;
    let maxHeightInRow = 0;

    // Sort folders for consistent layout
    const sortedFolders = Array.from(nodesByFolder.keys()).sort();

    sortedFolders.forEach(folder => {
      const folderNodes = nodesByFolder.get(folder)!.sort((a, b) => a.name.localeCompare(b.name));

      folderNodes.forEach(node => {
        // Check if we need to wrap to next row
        if (currentX + config.dataTypeBoxWidth > baseX + config.columnWidth - config.padding) {
          currentX = baseX + config.padding;
          currentY += maxHeightInRow + config.padding / 2;
          maxHeightInRow = 0;
        }

        result.push({
          node,
          x: currentX,
          y: currentY,
          width: config.dataTypeBoxWidth,
          height: config.dataTypeBoxHeight,
        });

        currentX += config.dataTypeBoxWidth + config.padding / 2;
        maxHeightInRow = Math.max(maxHeightInRow, config.dataTypeBoxHeight);
      });
    });
  }
  // Structs with methods (middle row)
  else if (row === 'middle') {
    // Group class_struct nodes with their methods
    const { groups, orphanNodes } = groupClassesWithMethods(nodes);

    let currentX = baseX + config.padding;
    let currentY = baseY + config.padding;

    // Layout each class+methods group as a vertical stack
    groups.forEach(group => {
      let groupY = currentY;
      const groupStartX = currentX;

      // Calculate total height of this group
      const groupHeight = config.classNodeHeight +
                         (group.methods.length * (config.methodNodeHeight + config.padding / 4));

      // Check if we need to start a new column (move to the right)
      if (groupHeight > config.rowHeight - config.padding * 2) {
        // Group is too tall, start new column
        currentX += Math.max(config.classNodeWidth, config.methodNodeWidth) + config.padding;
        groupY = baseY + config.padding;
      } else if (groupY + groupHeight > baseY + config.rowHeight - config.padding) {
        // Not enough vertical space, start new column
        currentX += Math.max(config.classNodeWidth, config.methodNodeWidth) + config.padding;
        groupY = baseY + config.padding;
      }

      // Layout the class_struct node (8x3)
      result.push({
        node: group.classNode,
        x: currentX,
        y: groupY,
        width: config.classNodeWidth,
        height: config.classNodeHeight,
      });

      groupY += config.classNodeHeight + config.padding / 4;

      // Layout methods vertically below the class (12x3 each)
      group.methods.forEach(method => {
        result.push({
          node: method,
          x: currentX,
          y: groupY,
          width: config.methodNodeWidth,
          height: config.methodNodeHeight,
        });

        groupY += config.methodNodeHeight + config.padding / 4;
      });

      // Move to next vertical position for next group
      currentY = groupY + config.padding / 2;

      // If we've used too much vertical space, move to next column
      if (currentY > baseY + config.rowHeight - config.padding - config.classNodeHeight) {
        currentX += Math.max(config.classNodeWidth, config.methodNodeWidth) + config.padding;
        currentY = baseY + config.padding;
      }
    });

    // Layout orphan nodes (non-class_struct, non-method nodes in middle row)
    orphanNodes.sort((a, b) => a.name.localeCompare(b.name)).forEach(node => {
      // Check if we need to start new column
      if (currentY + config.structWithMethodsBoxHeight > baseY + config.rowHeight - config.padding) {
        currentX += config.structWithMethodsBoxWidth + config.padding;
        currentY = baseY + config.padding;
      }

      result.push({
        node,
        x: currentX,
        y: currentY,
        width: config.structWithMethodsBoxWidth,
        height: config.structWithMethodsBoxHeight,
      });

      currentY += config.structWithMethodsBoxHeight + config.padding / 2;
    });
  }
  // Free functions (bottom row)
  else {
    let currentX = baseX + config.padding;
    let currentY = baseY + config.padding;
    let maxHeightInRow = 0;

    nodes.sort((a, b) => a.name.localeCompare(b.name)).forEach(node => {
      // Functions should be 12x3 (methodNodeWidth)
      const boxWidth = config.methodNodeWidth;
      const boxHeight = config.methodNodeHeight;

      // Check if we need to wrap to next row
      if (currentX + boxWidth > baseX + config.columnWidth - config.padding) {
        currentX = baseX + config.padding;
        currentY += maxHeightInRow + config.padding / 2;
        maxHeightInRow = 0;
      }

      result.push({
        node,
        x: currentX,
        y: currentY,
        width: boxWidth,
        height: boxHeight,
      });

      currentX += boxWidth + config.padding / 2;
      maxHeightInRow = Math.max(maxHeightInRow, boxHeight);
    });
  }

  return result;
}

export function createGridLayout(nodes: NodeData[], config: LayoutConfig = DEFAULT_LAYOUT_CONFIG) {
  const segmentedNodes = categorizeNodesBySegment(nodes);
  const allPositions: Array<{ node: NodeData; x: number; y: number; width: number; height: number }> = [];

  segmentedNodes.forEach((segmentNodes, segment) => {
    const positions = layoutNodesInSegment(segmentNodes, segment, config);
    allPositions.push(...positions);
  });

  return allPositions;
}
