import React from 'react';
import { NodeData } from '../types';
import { highlightRustHtml } from '../utils/highlight';

interface NodeDetailsPopupProps {
  node: NodeData;
  onClose: () => void;
}

export const NodeDetailsPopup: React.FC<NodeDetailsPopupProps> = ({ node, onClose }) => {
  // Build breadcrumb hierarchy from node ID
  const buildBreadcrumb = (id: string): string[] => {
    const parts = id.split('|');
    const breadcrumb: string[] = [];

    parts.forEach(part => {
      // Extract the type and name from each part (e.g., "class_struct::Name" -> "Name")
      const match = part.match(/::(.+)$/);
      if (match) {
        breadcrumb.push(match[1]);
      } else if (part.startsWith('crate::')) {
        breadcrumb.push(part.replace('crate::', ''));
      }
    });

    return breadcrumb;
  };

  // Syntax highlighting extracted to utility

  const breadcrumb = buildBreadcrumb(node.id);

  return (
    <>
      {/* Backdrop */}
      <div
        className="erd-popup-backdrop"
        onClick={onClose}
      />

      {/* Popup */}
      <div className="erd-popup-container">
        <div className="erd-popup-header">
          <h3>{node.name} <span className="erd-popup-type">({node.type})</span></h3>
          <button className="erd-popup-close" onClick={onClose}>×</button>
        </div>

        <div className="erd-popup-content">
          {/* Breadcrumb Hierarchy */}
          {breadcrumb.length > 0 && (
            <div className="erd-popup-breadcrumb">
              {breadcrumb.map((crumb, idx) => (
                <React.Fragment key={idx}>
                  {idx > 0 && <span className="erd-breadcrumb-separator">→</span>}
                  <span className="erd-breadcrumb-item">{crumb}</span>
                </React.Fragment>
              ))}
            </div>
          )}

          {/* File path and lines */}
          {node.filename && (
            <div className="erd-popup-file-info">
              <div className="erd-popup-file-path">{node.filename}</div>
              {node.start_line && node.end_line && (
                <div className="erd-popup-file-lines">
                  Lines {node.start_line}-{node.end_line}
                </div>
              )}
            </div>
          )}

          {/* Description */}
          {node.description && (
            <div className="erd-popup-description">
              <label>Description:</label>
              <p>{node.description}</p>
            </div>
          )}

          {/* Source Code */}
          {node.source_code && (
            <div className="erd-popup-source">
              <label>Source Code:</label>
              <pre className="erd-popup-code-block">
                <code
                  className="language-rust"
                  dangerouslySetInnerHTML={{ __html: highlightRustHtml(node.source_code) }}
                />
              </pre>
            </div>
          )}

          {/* Additional Details (if any) */}
          {node.details && Object.keys(node.details).length > 0 && (
            <div className="erd-popup-details">
              {node.details.attributes && node.details.attributes.length > 0 && (
                <div className="erd-popup-detail-item">
                  <strong>Attributes ({node.details.attributes.length}):</strong>
                  <ul>
                    {node.details.attributes.slice(0, 10).map((attr: any, idx: number) => (
                      <li key={idx}>
                        {attr.name}: {attr.type || 'unknown'}
                      </li>
                    ))}
                    {node.details.attributes.length > 10 && (
                      <li>... and {node.details.attributes.length - 10} more</li>
                    )}
                  </ul>
                </div>
              )}

              {node.details.values && node.details.values.length > 0 && (
                <div className="erd-popup-detail-item">
                  <strong>Values ({node.details.values.length}):</strong>
                  <ul>
                    {node.details.values.slice(0, 10).map((val: string, idx: number) => (
                      <li key={idx}>{val}</li>
                    ))}
                    {node.details.values.length > 10 && (
                      <li>... and {node.details.values.length - 10} more</li>
                    )}
                  </ul>
                </div>
              )}

              {node.details.input_params && node.details.input_params.length > 0 && (
                <div className="erd-popup-detail-item">
                  <strong>Parameters ({node.details.input_params.length}):</strong>
                  <ul>
                    {node.details.input_params.map((param: any, idx: number) => (
                      <li key={idx}>
                        {param.name}: {param.type}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {node.details.return_values && node.details.return_values.length > 0 && (
                <div className="erd-popup-detail-item">
                  <strong>Returns:</strong>
                  <ul>
                    {node.details.return_values.map((ret: string, idx: number) => (
                      <li key={idx}>{ret}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};
