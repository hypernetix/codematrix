/**
 * Theme definitions for Code Matrix Visualizer
 * Using Tailwind color palette
 */

import { CodeMatrixTheme } from './types';
import { tailwindColors as colors } from './tailwindColors';

export const defaultTheme: CodeMatrixTheme = {
  name: 'default',
  colors: {
    primary: {
      DEFAULT: colors.blue[600],
      foreground: colors.white,
    },
    secondary: {
      DEFAULT: colors.gray[100],
      foreground: colors.gray[900],
    },
    background: colors.white,
    foreground: colors.gray[900],
    muted: {
      DEFAULT: colors.gray[100],
      foreground: colors.gray[600],
    },
    border: colors.gray[200],

    leftMenu: {
      DEFAULT: colors.white,
      foreground: colors.gray[700],
      hover: colors.gray[100],
      selected: colors.blue[100],
      selectedBorder: colors.blue[500],
      border: colors.gray[200],
      toggleHover: colors.gray[200],
    },
    toolbar: {
      DEFAULT: colors.gray[50],
      foreground: colors.gray[900],
      border: colors.gray[200],
    },
    footer: {
      DEFAULT: colors.gray[50],
      foreground: colors.gray[900],
      border: colors.gray[200],
    },
    canvas: {
      DEFAULT: colors.gray[50],
      grid: colors.gray[200],
      gridHeader: 'hsl(0 0% 100% / 0)',
      gridPattern: 'hsl(0 0% 0% / 0.03)',
    },
    controls: {
      background: colors.white,
      foreground: colors.gray[700],
      border: colors.gray[300],
      hover: colors.gray[100],
      disabled: colors.gray[300],
    },
    folder: {
      background: colors.gray[100],
      foreground: colors.gray[600],
      border: colors.gray[200],
    },
    file: {
      background: colors.gray[50],
      foreground: colors.gray[600],
      border: colors.gray[200],
    },
    gridCell: {
      background: colors.white,
      border: colors.gray[200],
    },
    node: {
      struct: colors.emerald[500],
      enum: colors.cyan[500],
      function: colors.indigo[500],
      method: colors.blue[400],
      class_struct: colors.blue[500],
      selected: colors.indigo[500],
      direct: colors.indigo[500],
      dimmed: colors.gray[300],
    },
    popup: {
      background: colors.white,
      foreground: colors.gray[900],
      border: colors.gray[300],
      header: colors.gray[50],
    },
    input: {
      background: colors.white,
      foreground: colors.gray[900],
      border: colors.gray[300],
      placeholder: colors.gray[400],
    },
    button: {
      background: colors.gray[700],
      foreground: colors.white,
      border: colors.gray[700],
      hover: colors.gray[800],
    },
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

export const lightTheme: CodeMatrixTheme = {
  name: 'light',
  colors: {
    primary: {
      DEFAULT: colors.blue[500],
      foreground: colors.white,
    },
    secondary: {
      DEFAULT: colors.gray[50],
      foreground: colors.gray[900],
    },
    background: colors.white,
    foreground: colors.gray[900],
    muted: {
      DEFAULT: colors.gray[50],
      foreground: colors.gray[500],
    },
    border: colors.gray[200],

    leftMenu: {
      DEFAULT: colors.gray[50],
      foreground: colors.gray[700],
      hover: colors.gray[100],
      selected: colors.blue[50],
      selectedBorder: colors.blue[400],
      border: colors.gray[200],
      toggleHover: colors.gray[200],
    },
    toolbar: {
      DEFAULT: colors.white,
      foreground: colors.gray[900],
      border: colors.gray[100],
    },
    footer: {
      DEFAULT: colors.white,
      foreground: colors.gray[900],
      border: colors.gray[100],
    },
    canvas: {
      DEFAULT: colors.white,
      grid: colors.gray[100],
      gridHeader: 'hsl(0 0% 100% / 0)',
      gridPattern: 'hsl(0 0% 0% / 0.02)',
    },
    controls: {
      background: colors.white,
      foreground: colors.gray[700],
      border: colors.gray[200],
      hover: colors.gray[50],
      disabled: colors.gray[300],
    },
    folder: {
      background: colors.gray[50],
      foreground: colors.gray[600],
      border: colors.gray[100],
    },
    file: {
      background: colors.white,
      foreground: colors.gray[600],
      border: colors.gray[100],
    },
    gridCell: {
      background: colors.white,
      border: colors.gray[100],
    },
    node: {
      struct: colors.slate[400],
      enum: colors.slate[300],
      function: colors.zinc[400],
      method: colors.gray[400],
      class_struct: colors.gray[500],
      selected: colors.slate[600],
      direct: colors.slate[700],
      dimmed: colors.gray[200],
    },
    popup: {
      background: colors.white,
      foreground: colors.gray[900],
      border: colors.gray[200],
      header: colors.gray[50],
    },
    input: {
      background: colors.white,
      foreground: colors.gray[900],
      border: colors.gray[200],
      placeholder: colors.gray[400],
    },
    button: {
      background: colors.gray[600],
      foreground: colors.white,
      border: colors.gray[600],
      hover: colors.gray[700],
    },
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

export const darkTheme: CodeMatrixTheme = {
  name: 'dark',
  colors: {
    primary: {
      DEFAULT: colors.blue[500],
      foreground: colors.white,
    },
    secondary: {
      DEFAULT: colors.gray[800],
      foreground: colors.gray[100],
    },
    background: colors.gray[950],
    foreground: colors.gray[100],
    muted: {
      DEFAULT: colors.gray[800],
      foreground: colors.gray[400],
    },
    border: colors.gray[800],

    leftMenu: {
      DEFAULT: colors.gray[900],
      foreground: colors.gray[300],
      hover: colors.gray[800],
      selected: colors.blue[900],
      selectedBorder: colors.blue[600],
      border: colors.gray[800],
      toggleHover: colors.gray[800],
    },
    toolbar: {
      DEFAULT: colors.gray[900],
      foreground: colors.gray[100],
      border: colors.gray[800],
    },
    footer: {
      DEFAULT: colors.gray[900],
      foreground: colors.gray[100],
      border: colors.gray[800],
    },
    canvas: {
      DEFAULT: colors.gray[950],
      grid: colors.gray[800],
      gridHeader: 'hsl(0 0% 100% / 0)',
      gridPattern: 'hsl(0 0% 100% / 0.03)',
    },
    controls: {
      background: colors.gray[800],
      foreground: colors.gray[200],
      border: colors.gray[700],
      hover: colors.gray[700],
      disabled: colors.gray[600],
    },
    folder: {
      background: colors.gray[800],
      foreground: colors.gray[400],
      border: colors.gray[700],
    },
    file: {
      background: colors.gray[900],
      foreground: colors.gray[400],
      border: colors.gray[700],
    },
    gridCell: {
      background: colors.gray[900],
      border: colors.gray[800],
    },
    node: {
      struct: colors.green[600],
      enum: colors.red[600],
      function: colors.purple[600],
      method: colors.cyan[600],
      class_struct: colors.indigo[600],
      selected: colors.indigo[600],
      direct: colors.blue[500],
      dimmed: colors.gray[800],
    },
    popup: {
      background: colors.gray[900],
      foreground: colors.gray[100],
      border: colors.gray[700],
      header: colors.gray[800],
    },
    input: {
      background: colors.gray[800],
      foreground: colors.gray[100],
      border: colors.gray[700],
      placeholder: colors.gray[500],
    },
    button: {
      background: colors.gray[700],
      foreground: colors.white,
      border: colors.gray[700],
      hover: colors.gray[600],
    },
  },
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.4)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
  },
  transitions: {
    fast: '150ms',
    base: '250ms',
  },
};

export const themes = {
  default: defaultTheme,
  light: lightTheme,
  dark: darkTheme,
};
