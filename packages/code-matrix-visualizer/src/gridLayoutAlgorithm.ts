import { NodeData } from './types';

/**
 * Grid column width options
 */
export type ColumnWidth = '1fr' | '2/3fr' | '1/3fr';

/**
 * Column content statistics
 */
export interface ColumnStats {
  column: 'left' | 'middle' | 'right' | 'gateway';
  totalNodes: number;
  dataStructNodes: number;
  classNodes: number;
  freeFunctionNodes: number;
  testNodes: number;
  maxNodesInAnyRow: number;
}

/**
 * Grid layout configuration with calculated column widths
 */
export interface GridLayoutConfig {
  leftColumnWidth: ColumnWidth;
  middleColumnWidth: ColumnWidth;
  rightColumnWidth: ColumnWidth;
  gatewayColumnWidth: '1/3fr'; // Gateway is always 1/3
}

/**
 * Calculate statistics for a column based on its nodes
 */
function calculateColumnStats(
  column: 'left' | 'middle' | 'right' | 'gateway',
  nodesByRow: Map<string, NodeData[]>
): ColumnStats {
  const dataStructNodes = nodesByRow.get(`${column}-top`)?.length || 0;
  const classNodes = nodesByRow.get(`${column}-middle`)?.length || 0;
  const freeFunctionNodes = nodesByRow.get(`${column}-bottom`)?.length || 0;
  const testNodes = nodesByRow.get(`${column}-tests`)?.length || 0;

  const totalNodes = dataStructNodes + classNodes + freeFunctionNodes + testNodes;
  const maxNodesInAnyRow = Math.max(dataStructNodes, classNodes, freeFunctionNodes, testNodes);

  return {
    column,
    totalNodes,
    dataStructNodes,
    classNodes,
    freeFunctionNodes,
    testNodes,
    maxNodesInAnyRow,
  };
}

/**
 * Determine column width based on content statistics
 *
 * New Algorithm: Let browser decide based on content
 * - Use auto for columns to fit their content
 * - Use minmax for flexible sizing with constraints
 * - Gateway is always narrow (auto with max constraint)
 */
function determineColumnWidth(
  stats: ColumnStats,
  allStats: ColumnStats[]
): ColumnWidth {
  const { totalNodes } = stats;

  // Gateway is always narrow
  if (stats.column === 'gateway') {
    return '1/3fr';
  }

  // If column is empty, use minimal space
  if (totalNodes === 0) {
    return '1/3fr';
  }

  // All other columns use 1fr to share space equally
  // The browser will handle the actual sizing based on content
  return '1fr';
}

/**
 * Calculate optimal grid layout configuration based on node distribution
 *
 * Simplified algorithm: Let the browser handle sizing with minmax
 * All columns get equal opportunity (1fr), browser fits content optimally
 */
export function calculateGridLayout(
  nodesBySegment: Map<string, NodeData[]>
): GridLayoutConfig {
  // Calculate statistics for each column
  const leftStats = calculateColumnStats('left', nodesBySegment);
  const middleStats = calculateColumnStats('middle', nodesBySegment);
  const rightStats = calculateColumnStats('right', nodesBySegment);
  const gatewayStats = calculateColumnStats('gateway', nodesBySegment);

  const allStats = [leftStats, middleStats, rightStats, gatewayStats];

  // Determine width for each column (simplified)
  const leftColumnWidth = determineColumnWidth(leftStats, allStats);
  const middleColumnWidth = determineColumnWidth(middleStats, allStats);
  const rightColumnWidth = determineColumnWidth(rightStats, allStats);

  return {
    leftColumnWidth,
    middleColumnWidth,
    rightColumnWidth,
    gatewayColumnWidth: '1/3fr',
  };
}

/**
 * Convert column width to CSS grid fraction value
 */
export function columnWidthToCss(width: ColumnWidth): string {
  switch (width) {
    case '1fr':
      return '1fr';
    case '2/3fr':
      return '0.66fr';
    case '1/3fr':
      return '0.33fr';
  }
}

/**
 * Generate CSS grid-template-columns string from layout config
 */
export function generateGridTemplateColumns(config: GridLayoutConfig): string {
  return `20px ${columnWidthToCss(config.leftColumnWidth)} ${columnWidthToCss(config.middleColumnWidth)} ${columnWidthToCss(config.rightColumnWidth)} ${columnWidthToCss(config.gatewayColumnWidth)}`;
}
