import React, { useRef } from 'react';
import { NodeStats } from '../types';

interface FooterProps {
  stats: NodeStats;
  hint?: string;
  onToggleHints?: () => void;
  onToggleStats?: () => void;
  onToggleThemes?: () => void;
  onToggleSettings?: () => void;
  theme?: 'default' | 'light' | 'dark';
  hintsButtonRef?: React.RefObject<HTMLButtonElement>;
  statsButtonRef?: React.RefObject<HTMLButtonElement>;
  themesButtonRef?: React.RefObject<HTMLButtonElement>;
  settingsButtonRef?: React.RefObject<HTMLButtonElement>;
}

export const Footer: React.FC<FooterProps> = ({
  stats,
  hint,
  onToggleHints,
  onToggleStats,
  onToggleThemes,
  onToggleSettings,
  hintsButtonRef,
  statsButtonRef,
  themesButtonRef,
  settingsButtonRef,
}) => {
  const sortedStats = Object.entries(stats).sort((a, b) => a[0].localeCompare(b[0]));
  const totalNodes = Object.values(stats).reduce((sum, count) => sum + count, 0);

  return (
    <div className="erd-footer">
      <div className="erd-footer-actions">
        <button ref={settingsButtonRef} className="erd-footer-link" onClick={onToggleSettings}>
          Settings
        </button>
        <span className="erd-footer-sep">|</span>
        <button ref={hintsButtonRef} className="erd-footer-link" onClick={onToggleHints}>
          Diagram Hints
        </button>
        <span className="erd-footer-sep">|</span>
        <button ref={statsButtonRef} className="erd-footer-link" onClick={onToggleStats}>
          Statistics
        </button>
        <span className="erd-footer-sep">|</span>
        <button ref={themesButtonRef} className="erd-footer-link" onClick={onToggleThemes}>
          Theme
        </button>
      </div>
    </div>
  );
};
