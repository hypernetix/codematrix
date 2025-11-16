# Contributing to CodeMatrix Visualizer

Thank you for your interest in contributing to the CodeMatrix visualizer! This document provides guidelines and information for contributors.

## Quick Start

### Prerequisites

- **Node.js 18+** and **npm** for package management
- **Git** for version control
- A modern web browser (Chrome, Firefox, Safari, or Edge)
- Code editor (VS Code recommended)

### Development Setup

```bash
# Clone the repository
git clone https://github.com/hypernetix/codematrix.git
cd codematrix

# Install dependencies for both the package and app
npm install

# Start the development server
npm run dev
```

The application will start at `http://localhost:3000`.

## Development Workflow

### 1. Create a Feature Branch or fork the repository

```bash
git checkout -b feature/your-feature-name
```

Use descriptive branch names:
- `feature/add-heatmap-view`
- `fix/self-referencing-edges`
- `docs/update-json-format`
- `feat/export-diagram-pdf`

### 2. Make Your Changes

Follow the coding standards and patterns used in the project.

### 3. Validate Your Changes

- Test the visualizer with your changes:
```bash
npm run dev
```

- Build the package to ensure no build errors:
```bash
cd packages/code-matrix-visualizer
npm run build
```

- Test with different CodeMatrix JSON files to ensure compatibility

### 4. Commit Changes

Follow a structured commit message format:

```text
<type>(<module>): <description>
```

- `<type>`: change category (see table below)
- `<module>` (optional): the area touched (e.g., spec, examples, schemas)
- `<description>`: concise, imperative summary

Accepted commit types:

| Type       | Meaning                                                     |
|------------|-------------------------------------------------------------|
| feat       | New feature                                                 |
| fix        | Bug fixes                                                   |
| tech       | Technical change or refactoring                             |
| docs       | Documentation updates                                       |
| test       | Adding or modifying tests                                   |
| style      | Formatting changes (whitespace, code formatting, etc.)      |
| chore      | Misc tasks (tooling, scripts, dependencies)                 |
| perf       | Performance improvements                                    |
| breaking   | Backward incompatible changes                               |

Examples:

```text
feat(visualizer): add export diagram as PDF feature
fix(edges): filter out self-referencing edges
docs(readme): update JSON format specification
perf(layout): optimize grid layout algorithm
```

Best practices:

- Keep the title concise (ideally < 50 chars)
- Use imperative mood (e.g., "Fix schema", not "Fixed schema")
- Make commits atomic (one logical change per commit)
- Add details in the body when necessary (what/why, not how)
