export interface NodeData {
  id: string;
  type: string;
  name: string;
  public: boolean;
  filename?: string;
  start_line?: number;
  end_line?: number;
  container?: string;
  description?: string;
  source_code?: string;
  details: Record<string, any>;
}

export interface Edge {
  from: string;
  to: string;
  type: string;
}

export interface CodeMatrixModel {
  nodes: NodeData[];
  edges: Edge[];
}

export type ViewMode = 'relationship' | 'heatmap' | 'code-coverage';

export interface NodeStats {
  [nodeType: string]: number;
}

export interface CodeMatrixVisualizerProps {
  erdData: CodeMatrixModel;
  onNodeClick?: (node: NodeData) => void;
  onEdgeClick?: (edge: Edge) => void;
  onFileLoad?: (data: CodeMatrixModel, fileName: string) => void;
  onFileError?: (error: string) => void;
  currentFileName?: string;
}
