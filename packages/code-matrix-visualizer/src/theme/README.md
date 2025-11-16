# Code Matrix Visualizer Theme System

A comprehensive theming system inspired by Tailwind CSS and shadcn/ui design patterns.

## Overview

The theme system provides a consistent, type-safe way to style the Code Matrix Visualizer using CSS variables and Tailwind color palettes.

## Architecture

### 1. Theme Types (`types.ts`)
Defines the structure of a theme with TypeScript interfaces:
- Primary/secondary colors with foreground variants
- Component-specific colors (leftMenu, toolbar, footer, canvas, nodes, popup)
- Shadows and transitions

### 2. Tailwind Colors (`tailwindColors.ts`)
HSL-formatted Tailwind color palette subset:
- All colors use `hsl(H S% L%)` format for consistency
- Includes common scales: gray, slate, blue, indigo, purple, green, orange, red, amber, cyan, pink
- Each scale has 11 shades (50-950)

### 3. Theme Definitions (`themes.ts`)
Three built-in themes:
- **Default**: Clean, professional look with gray/blue palette
- **Light**: Bright, high-contrast theme
- **Dark**: Low-light friendly with muted colors

### 4. Theme Application (`applyTheme.ts`)
Utility to inject CSS variables into the document:
- Converts HSL colors to CSS variable format
- Sets all theme properties on `:root`
- Automatically applied when theme changes

## Usage

### Basic Usage

```typescript
import { CodeMatrixVisualizer, themes, applyTheme } from 'code-matrix-visualizer';

// Apply a theme
applyTheme(themes.dark);

// Use in component
<CodeMatrixVisualizer erdData={data} />
```

### Creating Custom Themes

```typescript
import { CodeMatrixTheme, tailwindColors } from 'code-matrix-visualizer';

const customTheme: CodeMatrixTheme = {
  name: 'custom',
  colors: {
    primary: {
      DEFAULT: tailwindColors.purple[600],
      foreground: tailwindColors.white,
    },
    secondary: {
      DEFAULT: tailwindColors.gray[100],
      foreground: tailwindColors.gray[900],
    },
    // ... other color definitions
  },
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
  },
  transitions: {
    fast: '150ms',
    base: '250ms',
  },
};

applyTheme(customTheme);
```

## CSS Variables

All theme colors are exposed as CSS variables:

### Base Colors
- `--primary` / `--primary-foreground`
- `--secondary` / `--secondary-foreground`
- `--background` / `--foreground`
- `--muted` / `--muted-foreground`
- `--border`

### Component Colors
- `--left-menu` / `--left-menu-foreground` / `--left-menu-hover` / `--left-menu-selected` / `--left-menu-border`
- `--toolbar` / `--toolbar-foreground` / `--toolbar-border`
- `--footer` / `--footer-foreground` / `--footer-border`
- `--canvas` / `--canvas-grid` / `--canvas-grid-header`
- `--popup-background` / `--popup-foreground` / `--popup-border` / `--popup-header`

### Node Colors
- `--node-struct` / `--node-enum` / `--node-function` / `--node-method` / `--node-class-struct`
- `--node-selected` / `--node-direct` / `--node-dimmed`

### Utilities
- `--shadow-sm` / `--shadow-md` / `--shadow-lg`
- `--transition-fast` / `--transition-base`

## Design Principles

1. **Single Source of Truth**: Theme objects in TypeScript are the source of truth
2. **Type Safety**: Full TypeScript support for theme definitions
3. **Consistency**: All colors use HSL format for easy manipulation
4. **Composability**: Themes can be extended and customized
5. **Performance**: CSS variables for runtime theme switching
6. **Accessibility**: Proper contrast ratios in all themes

## Examples

### Theme Switching

```typescript
import { themes, applyTheme } from 'code-matrix-visualizer';

// Switch to dark theme
applyTheme(themes.dark);

// Switch to light theme
applyTheme(themes.light);
```

### Custom Node Colors

```typescript
const customTheme = {
  ...themes.default,
  colors: {
    ...themes.default.colors,
    node: {
      struct: tailwindColors.emerald[100],
      enum: tailwindColors.rose[100],
      function: tailwindColors.violet[100],
      method: tailwindColors.amber[100],
      class_struct: tailwindColors.sky[100],
      selected: tailwindColors.red[500],
      direct: tailwindColors.blue[500],
      dimmed: tailwindColors.gray[300],
    },
  },
};
```

## Integration with Existing Styles

The theme system uses CSS variables that can be referenced in any stylesheet:

```css
.custom-element {
  background: hsl(var(--primary));
  color: hsl(var(--primary-foreground));
  border: 1px solid hsl(var(--border));
  box-shadow: var(--shadow-md);
  transition: all var(--transition-fast);
}
```

## Future Enhancements

- Theme persistence in localStorage
- Theme editor UI
- More built-in themes
- Theme validation utilities
- Color contrast checker
