import { useState, useRef, useEffect } from 'react';
import { CodeMatrixVisualizer, CodeMatrixModel, NodeData, applyTheme, themes } from 'code-matrix-visualizer';
import 'code-matrix-visualizer/dist/styles.css';

function App() {
  const [erdData, setErdData] = useState<CodeMatrixModel | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Apply default theme on mount for consistent button styling
  useEffect(() => {
    applyTheme(themes.default);
  }, []);

  const handleFileLoad = (data: CodeMatrixModel, name: string) => {
    setErdData(data);
    setFileName(name);
    setError(null);
  };

  const handleFileError = (errorMessage: string) => {
    setError(errorMessage);
  };

  const readErdFile = (file: File) => {
    console.log('[App] readErdFile:', file?.name, file?.size);
    if (!file) {
      console.log('[App] No file to read');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      console.log('[App] File read complete');
      try {
        const content = event.target?.result as string;
        console.log('[App] Content length:', content?.length);
        const data = JSON.parse(content) as CodeMatrixModel;
        console.log('[App] JSON parsed ok. Nodes:', data.nodes?.length, 'Edges:', data.edges?.length);
        if (!data.nodes || !Array.isArray(data.nodes) || !data.edges || !Array.isArray(data.edges)) {
          throw new Error('Invalid CodeMatrix file format. Expected "nodes" and "edges" arrays.');
        }
        handleFileLoad(data, file.name);
      } catch (err) {
        console.error('[App] Parse error:', err);
        const message = err instanceof Error ? err.message : 'Failed to parse JSON file';
        handleFileError(message);
      }
    };
    reader.onerror = () => {
      console.error('[App] FileReader error');
      handleFileError('Failed to read file');
    };
    reader.readAsText(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('[App] handleFileChange called');
    console.log('[App] Event:', e);
    console.log('[App] Files:', e.target.files);

    const file = e.target.files?.[0];
    if (!file) {
      console.log('[App] No file selected');
      return;
    }

    console.log('[App] File selected:', file.name, 'Size:', file.size);
    readErdFile(file);

    // Reset input so the same file can be loaded again
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) {
      setIsDragging(true);
      console.log('[App] Drag over');
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isDragging) {
      setIsDragging(false);
      console.log('[App] Drag leave');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    console.log('[App] Drop event:', e.dataTransfer);
    const file = e.dataTransfer?.files?.[0];
    if (file) {
      readErdFile(file);
    } else {
      console.warn('[App] No file in drop');
    }
  };

  const handleNodeClick = (node: NodeData) => {
    console.log('Node clicked:', node);
  };

  if (!erdData) {
    return (
      <div onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px',
        color: '#666',
        gap: '20px',
        padding: '20px',
        border: isDragging ? '2px dashed #3498db' : 'none',
        borderRadius: isDragging ? '8px' : (undefined as unknown as number | string | undefined)
      }}>
        <h1 style={{ fontSize: '32px', color: '#333', marginBottom: '10px' }}>Code Matrix Viewer</h1>
        <p>Please load generated CodeMatrix JSON file to get started</p>

        {/* Styled file input button matching in-product style */}
        <label
          htmlFor="file-input-real"
          className="erd-file-btn"
        >
          📁 Choose File
          <input
            id="file-input-real"
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFileChange}
            onClick={() => console.log('[App] Visible input clicked')}
            style={{ display: 'none' }}
          />
        </label>

        <div style={{ fontSize: '14px', color: '#888' }}>
          Or drag & drop your CodeMatrix JSON file anywhere on this page
        </div>

        {error && (
          <div style={{
            color: '#e74c3c',
            backgroundColor: '#ffe6e6',
            padding: '15px 20px',
            borderRadius: '8px',
            border: '1px solid #e74c3c',
            maxWidth: '500px',
            textAlign: 'center'
          }}>
            <strong>Error:</strong> {error}
          </div>
        )}

        <div style={{
          fontSize: '14px',
          color: '#999',
          textAlign: 'center',
          maxWidth: '400px'
        }}>
          <p>Load an CodeMatrix JSON file with the following format:</p>
          <code style={{
            display: 'block',
            marginTop: '10px',
            padding: '10px',
            backgroundColor: '#f5f5f5',
            borderRadius: '4px',
            fontSize: '12px',
            textAlign: 'left'
          }}>
            {`{ "nodes": [...], "edges": [...] }`}
          </code>
        </div>
      </div>
    );
  }

  return (
    <CodeMatrixVisualizer
      erdData={erdData}
      onNodeClick={handleNodeClick}
      onFileLoad={handleFileLoad}
      onFileError={handleFileError}
      currentFileName={fileName}
    />
  );
}

export default App;
