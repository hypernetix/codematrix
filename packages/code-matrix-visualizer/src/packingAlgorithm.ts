/**
 * 2D Bin Packing Algorithm for optimal node layout
 * Implements a shelf-based packing algorithm for maximum density
 */

export interface PackableItem {
  id: string;
  width: number;
  height: number;
  data: any;
}

export interface PackedItem extends PackableItem {
  x: number;
  y: number;
}

export interface PackingResult {
  items: PackedItem[];
  containerWidth: number;
  containerHeight: number;
}

interface Shelf {
  y: number;
  height: number;
  width: number;
  items: PackedItem[];
}

/**
 * Shelf-based bin packing algorithm
 * Packs items into horizontal shelves, minimizing wasted space
 */
export function packItems(
  items: PackableItem[],
  containerWidth: number,
  options: {
    padding?: number;
    sortByHeight?: boolean;
  } = {}
): PackingResult {
  const padding = options.padding || 3;
  const sortByHeight = options.sortByHeight !== false;

  // Sort items by height (descending) for better packing
  const sortedItems = sortByHeight
    ? [...items].sort((a, b) => b.height - a.height)
    : [...items];

  const shelves: Shelf[] = [];
  const packedItems: PackedItem[] = [];
  let currentY = padding;

  for (const item of sortedItems) {
    const itemWidth = item.width + padding;
    const itemHeight = item.height + padding;

    // Try to find a shelf that can fit this item
    let placed = false;
    for (const shelf of shelves) {
      if (shelf.width + itemWidth <= containerWidth && itemHeight <= shelf.height) {
        // Place item on this shelf
        packedItems.push({
          ...item,
          x: shelf.width,
          y: shelf.y,
        });
        shelf.width += itemWidth;
        shelf.items.push(packedItems[packedItems.length - 1]);
        placed = true;
        break;
      }
    }

    // If no shelf can fit, create a new shelf
    if (!placed) {
      const newShelf: Shelf = {
        y: currentY,
        height: itemHeight,
        width: itemWidth,
        items: [],
      };

      packedItems.push({
        ...item,
        x: padding,
        y: currentY,
      });

      newShelf.items.push(packedItems[packedItems.length - 1]);
      shelves.push(newShelf);
      currentY += itemHeight;
    }
  }

  const containerHeight = currentY;

  return {
    items: packedItems,
    containerWidth,
    containerHeight,
  };
}

/**
 * Guillotine-based packing algorithm
 * More efficient for items of varying sizes
 */
export function packItemsGuillotine(
  items: PackableItem[],
  containerWidth: number,
  options: {
    padding?: number;
  } = {}
): PackingResult {
  const padding = options.padding || 3;

  // Sort by area (largest first) for better packing
  const sortedItems = [...items].sort((a, b) => {
    const areaA = a.width * a.height;
    const areaB = b.width * b.height;
    return areaB - areaA;
  });

  interface FreeRect {
    x: number;
    y: number;
    width: number;
    height: number;
  }

  const freeRects: FreeRect[] = [
    { x: padding, y: padding, width: containerWidth - padding * 2, height: Infinity },
  ];
  const packedItems: PackedItem[] = [];

  for (const item of sortedItems) {
    const itemWidth = item.width + padding;
    const itemHeight = item.height + padding;

    // Find best fitting free rectangle
    let bestRect: FreeRect | null = null;
    let bestFit = Infinity;

    for (const rect of freeRects) {
      if (rect.width >= itemWidth && rect.height >= itemHeight) {
        // Use best short side fit
        const leftoverHoriz = rect.width - itemWidth;
        const leftoverVert = rect.height - itemHeight;
        const shortSideFit = Math.min(leftoverHoriz, leftoverVert);

        if (shortSideFit < bestFit) {
          bestFit = shortSideFit;
          bestRect = rect;
        }
      }
    }

    if (bestRect) {
      // Place item
      packedItems.push({
        ...item,
        x: bestRect.x,
        y: bestRect.y,
      });

      // Split the free rectangle
      const newRects: FreeRect[] = [];

      // Right rectangle
      if (bestRect.width > itemWidth) {
        newRects.push({
          x: bestRect.x + itemWidth,
          y: bestRect.y,
          width: bestRect.width - itemWidth,
          height: itemHeight,
        });
      }

      // Bottom rectangle
      if (bestRect.height > itemHeight) {
        newRects.push({
          x: bestRect.x,
          y: bestRect.y + itemHeight,
          width: bestRect.width,
          height: bestRect.height - itemHeight,
        });
      }

      // Remove used rectangle and add new ones
      const rectIndex = freeRects.indexOf(bestRect);
      freeRects.splice(rectIndex, 1);
      freeRects.push(...newRects);

      // Remove overlapping rectangles
      for (let i = freeRects.length - 1; i >= 0; i--) {
        for (let j = i - 1; j >= 0; j--) {
          if (rectanglesOverlap(freeRects[i], freeRects[j])) {
            freeRects.splice(i, 1);
            break;
          }
        }
      }
    }
  }

  // Calculate actual container height
  const maxY = Math.max(...packedItems.map(item => item.y + item.height), 0);
  const containerHeight = maxY + padding;

  return {
    items: packedItems,
    containerWidth,
    containerHeight,
  };
}

function rectanglesOverlap(a: { x: number; y: number; width: number; height: number }, b: { x: number; y: number; width: number; height: number }): boolean {
  return !(
    a.x + a.width <= b.x ||
    b.x + b.width <= a.x ||
    a.y + a.height <= b.y ||
    b.y + b.height <= a.y
  );
}

/**
 * Column-based packing for file groups
 * Packs items into multiple columns for better horizontal space usage
 */
export function packIntoColumns(
  items: PackableItem[],
  containerWidth: number,
  options: {
    padding?: number;
    minColumnWidth?: number;
    maxColumns?: number;
  } = {}
): PackingResult {
  const padding = options.padding || 3;
  const minColumnWidth = options.minColumnWidth || 150;
  const maxColumns = options.maxColumns || 4;

  // Calculate number of columns that fit
  const numColumns = Math.min(
    Math.max(1, Math.floor(containerWidth / minColumnWidth)),
    maxColumns
  );

  const columnWidth = Math.floor(containerWidth / numColumns);
  const columns: PackedItem[][] = Array.from({ length: numColumns }, () => []);
  const columnHeights: number[] = Array(numColumns).fill(padding);

  // Distribute items across columns (round-robin for balance)
  items.forEach((item, index) => {
    const columnIndex = index % numColumns;
    const column = columns[columnIndex];
    const y = columnHeights[columnIndex];

    const packedItem: PackedItem = {
      ...item,
      x: columnIndex * columnWidth + padding,
      y,
    };

    column.push(packedItem);
    columnHeights[columnIndex] = y + item.height + padding;
  });

  const packedItems = columns.flat();
  const containerHeight = Math.max(...columnHeights, padding);

  return {
    items: packedItems,
    containerWidth,
    containerHeight,
  };
}
