import React, { useState } from 'react';
import { NodeData } from '../types';

// Code Matrix Logo SVG Component
const CodeMatrixLogo: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 182 172"
    xmlns="http://www.w3.org/2000/svg"
    fill="currentColor"
  >
    <path d="M116.000000,173.000000 C77.693260,173.000000 39.386517,173.000000 1.039886,173.000000 C1.039886,115.733055 1.039886,58.466068 1.039886,1.099543 C61.558079,1.099543 122.116371,1.099543 183.000000,1.099543 C183.000000,54.687122 183.000000,108.374901 182.584686,162.584991 C176.229156,163.404861 170.276810,163.554733 164.352188,164.041809 C158.501129,164.522842 151.981766,161.842819 147.111481,167.630005 C146.517868,168.335358 144.574234,167.982132 143.255783,167.987076 C135.940292,168.014542 128.624496,168.031998 121.309181,167.988022 C117.876114,167.967392 115.947342,169.398224 116.000000,173.000000 M147.782043,120.655670 C153.341461,120.149734 158.900879,119.643806 164.678635,119.118004 C162.066223,85.948837 159.504944,53.428749 156.915466,20.550846 C155.230667,21.132587 153.812088,21.527674 152.469208,22.100273 C131.837952,30.897339 111.281212,39.874542 90.544220,48.414200 C85.777046,50.377354 85.287720,52.881695 86.977394,57.392010 C106.833366,50.723858 126.422478,44.145317 146.524796,37.394440 C148.416916,61.520573 150.254837,84.955505 152.100342,108.487198 C119.409935,113.789177 87.330902,118.991997 54.791321,124.269516 C55.915951,126.697273 56.689903,128.368011 57.221455,130.869049 C49.316452,136.856598 41.411446,142.844162 33.506443,148.831711 C33.754726,149.205032 34.003014,149.578339 34.251297,149.951660 C70.701424,155.039337 107.151550,160.127014 143.582214,165.211975 C150.567352,151.587372 157.350754,138.356247 164.155014,125.084435 C158.145065,125.084435 152.572830,125.084435 147.000153,124.267273 C147.000107,123.177765 147.000061,122.088249 147.782043,120.655670 M100.119652,99.545570 C106.879860,98.979042 113.640068,98.412521 120.643143,97.825638 C119.936081,88.602211 119.255905,79.729446 118.543053,70.430489 C109.191910,71.138420 100.300453,71.811546 90.902237,72.523033 C91.635452,81.825066 92.335358,90.704468 93.069359,100.016464 C95.321526,99.896629 97.269936,99.792961 100.119652,99.545570 M65.015800,114.357414 C69.539894,113.990097 74.063995,113.622772 78.738693,113.243225 C78.064453,105.412674 77.461166,98.406143 76.847969,91.284531 C69.213402,91.899933 62.306198,92.456703 54.858826,93.057022 C55.446846,100.483910 56.012512,107.628471 56.602894,115.085205 C59.523289,114.851593 61.817814,114.668045 65.015800,114.357414 M53.131264,66.260406 C47.207554,66.613419 41.283844,66.966438 35.167038,67.330956 C35.698364,73.764656 36.183460,79.638557 36.686749,85.732765 C43.116112,85.213913 48.877914,84.748932 54.951679,84.258781 C54.503914,78.229225 54.086250,72.605026 53.131264,66.260406 M81.921761,72.748695 C81.921761,66.802216 81.921761,60.855740 81.921761,54.442200 C74.936874,55.015621 69.104698,55.494408 63.005951,55.995079 C63.524117,62.328644 63.990807,68.033073 64.489151,74.124329 C70.250053,73.713608 75.662392,73.327736 81.921761,72.748695z"/>
  </svg>
);

interface LeftMenuProps {
  nodesByType: Map<string, NodeData[]>;
  onNodeSelect: (node: NodeData | null) => void;
  selectedNodeId?: string | null;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const LeftMenu: React.FC<LeftMenuProps> = ({
  nodesByType,
  onNodeSelect,
  selectedNodeId,
  isCollapsed,
  onToggleCollapse,
}) => {
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  const toggleGroup = (type: string) => {
    setCollapsedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(type)) {
        newSet.delete(type);
      } else {
        newSet.add(type);
      }
      return newSet;
    });
  };

  if (isCollapsed) {
    return (
      <div className="erd-left-menu collapsed">
        <div className="erd-menu-header">
          <button className="erd-menu-logo-button" onClick={onToggleCollapse} title="Expand menu">
            <CodeMatrixLogo className="erd-menu-logo" />
          </button>
        </div>
      </div>
    );
  }

  const sortedTypes = Array.from(nodesByType.keys()).sort();

  return (
    <div className="erd-left-menu">
      <div className="erd-menu-header">
        <button className="erd-menu-logo-button" onClick={onToggleCollapse} title="Collapse menu">
          <CodeMatrixLogo className="erd-menu-logo" />
        </button>
        <h3>Code Matrix</h3>
      </div>
      <div className="erd-menu-content">
        {sortedTypes.map(type => {
          const nodes = nodesByType.get(type) || [];
          const isGroupCollapsed = collapsedGroups.has(type);

          return (
            <div key={type} className="erd-menu-group">
              <div
                className="erd-menu-group-header"
                onClick={() => toggleGroup(type)}
              >
                <span className="erd-menu-group-icon">
                  {isGroupCollapsed ? '▶' : '▼'}
                </span>
                <span className="erd-menu-group-title">
                  {type} ({nodes.length})
                </span>
              </div>
              {!isGroupCollapsed && (
                <div className="erd-menu-group-items">
                  {nodes.map(node => (
                    <div
                      key={node.id}
                      className={`erd-menu-item ${selectedNodeId === node.id ? 'selected' : ''}`}
                      onClick={() => onNodeSelect(node)}
                      title={node.id}
                    >
                      <span className={`erd-menu-item-icon ${node.public ? 'public' : 'private'}`}>
                        {node.public ? '🔓' : '🔒'}
                      </span>
                      <span className="erd-menu-item-name">{node.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
