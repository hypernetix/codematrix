/**
 * Theme type definitions for Code Matrix Visualizer
 */

export interface CodeMatrixTheme {
  name: string;
  colors: {
    primary: {
      DEFAULT: string;
      foreground: string;
    };
    secondary: {
      DEFAULT: string;
      foreground: string;
    };
    background: string;
    foreground: string;
    muted: {
      DEFAULT: string;
      foreground: string;
    };
    border: string;

    // Component-specific colors
    leftMenu: {
      DEFAULT: string;
      foreground: string;
      hover: string;
      selected: string;
      selectedBorder: string;
      border: string;
      toggleHover: string;
    };
    toolbar: {
      DEFAULT: string;
      foreground: string;
      border: string;
    };
    footer: {
      DEFAULT: string;
      foreground: string;
      border: string;
    };
    canvas: {
      DEFAULT: string;
      grid: string;
      gridHeader: string;
      gridPattern: string;
    };
    controls: {
      background: string;
      foreground: string;
      border: string;
      hover: string;
      disabled: string;
    };
    folder: {
      background: string;
      foreground: string;
      border: string;
    };
    file: {
      background: string;
      foreground: string;
      border: string;
    };
    gridCell: {
      background: string;
      border: string;
    };
    node: {
      struct: string;
      enum: string;
      function: string;
      method: string;
      class_struct: string;
      selected: string;
      direct: string;
      dimmed: string;
    };
    popup: {
      background: string;
      foreground: string;
      border: string;
      header: string;
    };
    input: {
      background: string;
      foreground: string;
      border: string;
      placeholder: string;
    };
    button: {
      background: string;
      foreground: string;
      border: string;
      hover: string;
    };
  };
  shadows: {
    sm: string;
    md: string;
    lg: string;
  };
  transitions: {
    fast: string;
    base: string;
  };
}

export type ThemeName = 'default' | 'light' | 'dark';
