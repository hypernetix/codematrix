import React, { useState, useMemo, useRef, useEffect } from 'react';
import { CodeMatrixVisualizerProps, ViewMode, NodeData } from '../types';
import { ERDParser } from '../parser';
import { LeftMenu } from './LeftMenu';
import { Toolbar } from './Toolbar';
import { Footer } from './Footer';
import { CustomDiagramPanel } from './CustomDiagramPanel';
import { ThemeName, themes, applyTheme } from '../theme';
import '../styles.css';

export const CodeMatrixVisualizer: React.FC<CodeMatrixVisualizerProps> = ({
  erdData,
  onNodeClick,
  onFileLoad,
  onFileError,
  currentFileName,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('relationship');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null | undefined>();
  const [isMenuCollapsed, setIsMenuCollapsed] = useState(false);
  const [uiHint, setUiHint] = useState<string>('');
  const [theme, setTheme] = useState<ThemeName>(() => {
    try {
      const saved = localStorage.getItem('erd_theme');
      if (saved === 'light' || saved === 'dark' || saved === 'default') return saved;
    } catch {}
    return 'default';
  });
  const [showHints, setShowHints] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showThemes, setShowThemes] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [popupPosition, setPopupPosition] = useState({ left: 0, bottom: 32 });

  // Settings state with localStorage persistence
  const [diagramSettings, setDiagramSettings] = useState(() => {
    const stored = localStorage.getItem('diagram-settings');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return { showReferencesOnHighlight: true };
      }
    }
    return { showReferencesOnHighlight: true };
  });

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('diagram-settings', JSON.stringify(diagramSettings));
  }, [diagramSettings]);

  // Refs for footer buttons
  const hintsButtonRef = useRef<HTMLButtonElement>(null);
  const statsButtonRef = useRef<HTMLButtonElement>(null);
  const themesButtonRef = useRef<HTMLButtonElement>(null);
  const settingsButtonRef = useRef<HTMLButtonElement>(null);

  const parser = useMemo(() => new ERDParser(erdData), [erdData]);

  // Get all crates
  const crates = useMemo(() => parser.getCrates(), [parser]);

  // Select first crate by default
  const [selectedCrate, setSelectedCrate] = useState<string | null>(() =>
    crates.length > 0 ? crates[0].id : null
  );

  // Update selected crate if crates change
  React.useEffect(() => {
    if (crates.length > 0 && !selectedCrate) {
      setSelectedCrate(crates[0].id);
    }
  }, [crates, selectedCrate]);

  // Get nodes for selected crate
  const crateNodes = useMemo(() => {
    if (!selectedCrate) return parser.getNodes();
    return parser.getNodesByCrate(selectedCrate);
  }, [selectedCrate, parser]);

  const nodesByType = useMemo(() => {
    const nodesByType = new Map<string, NodeData[]>();
    crateNodes.forEach(node => {
      const type = node.type;
      if (!nodesByType.has(type)) {
        nodesByType.set(type, []);
      }
      nodesByType.get(type)!.push(node);
    });
    // Sort nodes alphabetically within each type
    nodesByType.forEach((nodes) => {
      nodes.sort((a, b) => a.name.localeCompare(b.name));
    });
    return nodesByType;
  }, [crateNodes]);

  const stats = useMemo(() => {
    const stats: Record<string, number> = {};
    crateNodes.forEach(node => {
      const type = node.type;
      stats[type] = (stats[type] || 0) + 1;
    });
    return stats;
  }, [crateNodes]);

  // Apply theme
  useEffect(() => {
    const currentTheme = themes[theme];
    applyTheme(currentTheme);
    try {
      localStorage.setItem('erd_theme', theme);
    } catch {}
  }, [theme]);

  // Calculate popup position based on which button is clicked
  const updatePopupPosition = (buttonRef: React.RefObject<HTMLButtonElement>) => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPopupPosition({
        left: rect.left,
        bottom: window.innerHeight - rect.top,
      });
    }
  };

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return undefined;
    return crateNodes.filter(node =>
      node.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      node.id.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, crateNodes]);

  const handleNodeSelect = (node: NodeData | null) => {
    if (node === null) {
      setSelectedNodeId(null);
    } else {
    setSelectedNodeId(node.id);
    if (onNodeClick) {
      onNodeClick(node);
      }
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim() && searchResults && searchResults.length > 0) {
      setSelectedNodeId(searchResults[0].id);
    }
  };

  const handleCrateChange = (crateId: string) => {
    setSelectedCrate(crateId);
    setSelectedNodeId(undefined);
    setSearchQuery('');
  };

  return (
    <div className={`code-matrix-visualizer theme-${theme}`}>
      <LeftMenu
        nodesByType={nodesByType}
        onNodeSelect={handleNodeSelect}
        selectedNodeId={selectedNodeId}
        isCollapsed={isMenuCollapsed}
        onToggleCollapse={() => setIsMenuCollapsed(!isMenuCollapsed)}
      />
      <div className="erd-main-content">
        <Toolbar
          crates={crates}
          selectedCrate={selectedCrate}
          onCrateChange={handleCrateChange}
          onSearch={handleSearch}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onFileLoad={onFileLoad}
          onFileError={onFileError}
          currentFileName={currentFileName}
        />
        <CustomDiagramPanel
          nodes={crateNodes}
          allNodes={parser.getNodes()}
          edges={parser.getEdges()}
          viewMode={viewMode}
          focusedNodeId={selectedNodeId}
          searchResults={searchResults}
          onNodeClick={handleNodeSelect}
          onUiHintChange={setUiHint}
          settings={diagramSettings}
        />
        {/* Slide-up panels */}
        <div
          className={`erd-slide-panel ${showHints ? 'open' : ''}`}
          style={{ left: `${popupPosition.left}px` }}
        >
          <div className="erd-slide-header">
            <span>Diagram Hints</span>
            <button onClick={() => setShowHints(false)}>×</button>
          </div>
          <div className="erd-slide-body">
            <div className="erd-footer-hints-grid">
              <div className="erd-footer-hint-item"><span className="kbd">⌘</span>/<span className="kbd">Ctrl</span> + Mouse — show code</div>
              <div className="erd-footer-hint-item"><span className="kbd">⌘</span>/<span className="kbd">Ctrl</span> + Mouse + Click — stick code</div>
              <div className="erd-footer-hint-item"><span className="kbd">Esc</span> — close stuck code</div>
              <div className="erd-footer-hint-item"><span className="kbd">Shift</span> + Scroll — zoom in/out</div>
            </div>
          </div>
        </div>
        <div
          className={`erd-slide-panel ${showStats ? 'open' : ''}`}
          style={{ left: `${popupPosition.left}px` }}
        >
          <div className="erd-slide-header">
            <span>Statistics</span>
            <button onClick={() => setShowStats(false)}>×</button>
          </div>
          <div className="erd-slide-body">
            <div className="erd-stats-grid">
              {Object.entries(stats).sort((a,b)=>a[0].localeCompare(b[0])).map(([type, count]) => (
                <div key={type} className="erd-stats-row">
                  <span className="erd-stats-type">{type}</span>
                  <span className="erd-stats-count">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div
          className={`erd-slide-panel ${showThemes ? 'open' : ''}`}
          style={{ left: `${popupPosition.left}px` }}
        >
          <div className="erd-slide-body">
            <div className="erd-theme-list">
              {(['default','light','dark'] as ThemeName[]).map(t => (
                <button
                  key={t}
                  className={`erd-theme-btn ${theme===t?'active':''}`}
                  onClick={() => setTheme(t)}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div
          className={`erd-slide-panel ${showSettings ? 'open' : ''}`}
          style={{ left: `${popupPosition.left}px` }}
        >
          <div className="erd-slide-header">
            <span>Settings</span>
            <button onClick={() => setShowSettings(false)}>×</button>
          </div>
          <div className="erd-slide-body">
            <div className="erd-settings-list">
              <label className="erd-settings-item">
                <input
                  type="checkbox"
                  checked={diagramSettings.showReferencesOnHighlight}
                  onChange={(e) => setDiagramSettings({
                    ...diagramSettings,
                    showReferencesOnHighlight: e.target.checked
                  })}
                />
                <span>Show references when highlight a node</span>
              </label>
            </div>
          </div>
        </div>
        <Footer
          stats={stats}
          hint={uiHint}
          hintsButtonRef={hintsButtonRef}
          statsButtonRef={statsButtonRef}
          themesButtonRef={themesButtonRef}
          settingsButtonRef={settingsButtonRef}
          onToggleHints={() => {
            updatePopupPosition(hintsButtonRef);
            setShowHints((v) => !v);
            setShowStats(false);
            setShowThemes(false);
            setShowSettings(false);
          }}
          onToggleStats={() => {
            updatePopupPosition(statsButtonRef);
            setShowStats((v) => !v);
            setShowHints(false);
            setShowThemes(false);
            setShowSettings(false);
          }}
          onToggleThemes={() => {
            updatePopupPosition(themesButtonRef);
            setShowThemes((v) => !v);
            setShowHints(false);
            setShowStats(false);
            setShowSettings(false);
          }}
          onToggleSettings={() => {
            updatePopupPosition(settingsButtonRef);
            setShowSettings((v) => !v);
            setShowHints(false);
            setShowStats(false);
            setShowThemes(false);
          }}
          theme={theme}
        />
      </div>
    </div>
  );
};
