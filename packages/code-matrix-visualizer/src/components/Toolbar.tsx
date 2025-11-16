import React, { useState } from 'react';
import { ViewMode, NodeData, CodeMatrixModel } from '../types';

interface ToolbarProps {
  crates: NodeData[];
  selectedCrate: string | null;
  onCrateChange: (crateId: string) => void;
  onSearch: (query: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onFileLoad?: (data: CodeMatrixModel, fileName: string) => void;
  onFileError?: (error: string) => void;
  currentFileName?: string;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  crates,
  selectedCrate,
  onCrateChange,
  onSearch,
  viewMode,
  onViewModeChange,
  onFileLoad,
  onFileError,
  currentFileName,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    onSearch(query);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const data = JSON.parse(content) as CodeMatrixModel;

        // Validate the data has the expected structure
        if (!data.nodes || !Array.isArray(data.nodes) || !data.edges || !Array.isArray(data.edges)) {
          throw new Error('Invalid CodeMatrix file format. Expected "nodes" and "edges" arrays.');
        }

        onFileLoad?.(data, file.name);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to parse JSON file';
        onFileError?.(message);
      }
    };

    reader.onerror = () => {
      onFileError?.('Failed to read file');
    };

    reader.readAsText(file);

    // Reset input so the same file can be loaded again
    e.target.value = '';
  };

  return (
    <div className="erd-toolbar">
      <div className="erd-toolbar-section">
        <label
          className="erd-open-file-btn"
          htmlFor="toolbar-file-input-real"
          title="Open CodeMatrix JSON file"
        >
          📁 Open File
          <input
            id="toolbar-file-input-real"
            type="file"
            accept=".json"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
        </label>
        {currentFileName && (
          <span className="erd-current-file" title={currentFileName}>
            {currentFileName}
          </span>
        )}
      </div>
      {crates.length > 0 && (
        <div className="erd-toolbar-section">
          <label className="erd-toolbar-label">Crate:</label>
          <select
            className="erd-crate-select"
            value={selectedCrate || ''}
            onChange={(e) => onCrateChange(e.target.value)}
          >
            {crates.map(crate => (
              <option key={crate.id} value={crate.id}>
                {crate.name}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="erd-toolbar-section">
        <div className="erd-search-container">
          <input
            type="text"
            className="erd-search-input"
            placeholder="Focus search..."
            value={searchQuery}
            onChange={handleSearchChange}
          />
          <span className="erd-search-icon">🔍</span>
        </div>
      </div>
      <div className="erd-toolbar-section">
        <label className="erd-toolbar-label">View Mode:</label>
        <select
          className="erd-view-mode-select"
          value={viewMode}
          onChange={(e) => onViewModeChange(e.target.value as ViewMode)}
        >
          <option value="relationship">Relationship</option>
          <option value="heatmap">Heatmap</option>
          <option value="code-coverage">Code Coverage</option>
        </select>
      </div>
    </div>
  );
};
