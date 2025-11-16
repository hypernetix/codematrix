/**
 * Theme application utility
 * Generates CSS variables from theme objects dynamically
 */

import { CodeMatrixTheme } from './types';

/**
 * Normalize color value for CSS variable
 * Strips hsl() wrapper for compatibility
 */
const hslToVar = (color: string): string => {
  if (color === 'transparent') {
    return 'transparent';
  }

  if (color.startsWith('hsl(')) {
    return color.replace('hsl(', '').replace(')', '');
  }

  return color;
};

/**
 * Apply theme to document by injecting CSS variables
 * @param theme - Theme object to apply
 */
export const applyTheme = (theme: CodeMatrixTheme): void => {
  const root = document.documentElement;

  // Set theme attribute
  root.setAttribute('data-theme', theme.name);

  // Primary colors
  root.style.setProperty('--primary', hslToVar(theme.colors.primary.DEFAULT));
  root.style.setProperty('--primary-foreground', hslToVar(theme.colors.primary.foreground));

  // Secondary colors
  root.style.setProperty('--secondary', hslToVar(theme.colors.secondary.DEFAULT));
  root.style.setProperty('--secondary-foreground', hslToVar(theme.colors.secondary.foreground));

  // Base colors
  root.style.setProperty('--background', hslToVar(theme.colors.background));
  root.style.setProperty('--foreground', hslToVar(theme.colors.foreground));
  root.style.setProperty('--muted', hslToVar(theme.colors.muted.DEFAULT));
  root.style.setProperty('--muted-foreground', hslToVar(theme.colors.muted.foreground));
  root.style.setProperty('--border', hslToVar(theme.colors.border));

  // Left menu
  root.style.setProperty('--left-menu', hslToVar(theme.colors.leftMenu.DEFAULT));
  root.style.setProperty('--left-menu-foreground', hslToVar(theme.colors.leftMenu.foreground));
  root.style.setProperty('--left-menu-hover', hslToVar(theme.colors.leftMenu.hover));
  root.style.setProperty('--left-menu-selected', hslToVar(theme.colors.leftMenu.selected));
  root.style.setProperty('--left-menu-selected-border', hslToVar(theme.colors.leftMenu.selectedBorder));
  root.style.setProperty('--left-menu-border', hslToVar(theme.colors.leftMenu.border));
  root.style.setProperty('--left-menu-toggle-hover', hslToVar(theme.colors.leftMenu.toggleHover));

  // Toolbar
  root.style.setProperty('--toolbar', hslToVar(theme.colors.toolbar.DEFAULT));
  root.style.setProperty('--toolbar-foreground', hslToVar(theme.colors.toolbar.foreground));
  root.style.setProperty('--toolbar-border', hslToVar(theme.colors.toolbar.border));

  // Footer
  root.style.setProperty('--footer', hslToVar(theme.colors.footer.DEFAULT));
  root.style.setProperty('--footer-foreground', hslToVar(theme.colors.footer.foreground));
  root.style.setProperty('--footer-border', hslToVar(theme.colors.footer.border));

  // Canvas
  root.style.setProperty('--canvas', hslToVar(theme.colors.canvas.DEFAULT));
  root.style.setProperty('--canvas-grid', hslToVar(theme.colors.canvas.grid));
  root.style.setProperty('--canvas-grid-header', hslToVar(theme.colors.canvas.gridHeader));
  root.style.setProperty('--canvas-grid-pattern', theme.colors.canvas.gridPattern);

  // Controls
  root.style.setProperty('--controls-background', hslToVar(theme.colors.controls.background));
  root.style.setProperty('--controls-foreground', hslToVar(theme.colors.controls.foreground));
  root.style.setProperty('--controls-border', hslToVar(theme.colors.controls.border));
  root.style.setProperty('--controls-hover', hslToVar(theme.colors.controls.hover));
  root.style.setProperty('--controls-disabled', hslToVar(theme.colors.controls.disabled));

  // Folder
  root.style.setProperty('--folder-background', hslToVar(theme.colors.folder.background));
  root.style.setProperty('--folder-foreground', hslToVar(theme.colors.folder.foreground));
  root.style.setProperty('--folder-border', hslToVar(theme.colors.folder.border));

  // File
  root.style.setProperty('--file-background', hslToVar(theme.colors.file.background));
  root.style.setProperty('--file-foreground', hslToVar(theme.colors.file.foreground));
  root.style.setProperty('--file-border', hslToVar(theme.colors.file.border));

  // Grid Cell
  root.style.setProperty('--grid-cell-background', hslToVar(theme.colors.gridCell.background));
  root.style.setProperty('--grid-cell-border', hslToVar(theme.colors.gridCell.border));

  // Nodes
  root.style.setProperty('--node-struct', hslToVar(theme.colors.node.struct));
  root.style.setProperty('--node-enum', hslToVar(theme.colors.node.enum));
  root.style.setProperty('--node-function', hslToVar(theme.colors.node.function));
  root.style.setProperty('--node-method', hslToVar(theme.colors.node.method));
  root.style.setProperty('--node-class-struct', hslToVar(theme.colors.node.class_struct));
  root.style.setProperty('--node-selected', hslToVar(theme.colors.node.selected));
  root.style.setProperty('--node-direct', hslToVar(theme.colors.node.direct));
  root.style.setProperty('--node-dimmed', hslToVar(theme.colors.node.dimmed));

  // Popup
  root.style.setProperty('--popup-background', hslToVar(theme.colors.popup.background));
  root.style.setProperty('--popup-foreground', hslToVar(theme.colors.popup.foreground));
  root.style.setProperty('--popup-border', hslToVar(theme.colors.popup.border));
  root.style.setProperty('--popup-header', hslToVar(theme.colors.popup.header));

  // Input
  root.style.setProperty('--input-background', hslToVar(theme.colors.input.background));
  root.style.setProperty('--input-foreground', hslToVar(theme.colors.input.foreground));
  root.style.setProperty('--input-border', hslToVar(theme.colors.input.border));
  root.style.setProperty('--input-placeholder', hslToVar(theme.colors.input.placeholder));

  // Button
  root.style.setProperty('--button-background', hslToVar(theme.colors.button.background));
  root.style.setProperty('--button-foreground', hslToVar(theme.colors.button.foreground));
  root.style.setProperty('--button-border', hslToVar(theme.colors.button.border));
  root.style.setProperty('--button-hover', hslToVar(theme.colors.button.hover));

  // Shadows
  root.style.setProperty('--shadow-sm', theme.shadows.sm);
  root.style.setProperty('--shadow-md', theme.shadows.md);
  root.style.setProperty('--shadow-lg', theme.shadows.lg);

  // Transitions
  root.style.setProperty('--transition-fast', theme.transitions.fast);
  root.style.setProperty('--transition-base', theme.transitions.base);
};
