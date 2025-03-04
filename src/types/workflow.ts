
export interface RCCommand {
  command: string;
  params?: string[];
  description?: string; // Optional description of what the command does
}

export interface WorkflowStage {
  name: string;
  commands: RCCommand[];
  description?: string; // Optional stage description
}

export interface Workflow {
  workflow_name: string;
  stages: WorkflowStage[];
  metadata?: {
    description?: string;
    author?: string;
    version?: string;
    tags?: string[];
    requiredMarkers?: boolean;
    requiresMasks?: boolean;
    requiresTextures?: boolean;
  };
}

export interface WorkflowFile {
  id: string;
  name: string;
  path: string;
}

export interface WorkflowProgress {
  currentStage: string;
  currentCommand: string;
  percentComplete: number;
  status: 'idle' | 'running' | 'completed' | 'error';
  message?: string;
  previewUrl?: string; // URL for 3D preview if available
}

export interface RCPreviewData {
  previewUrl?: string;
  modelStats?: {
    vertices: number;
    triangles: number;
    textureSize: string;
  };
  renderViews?: string[]; // URLs to rendered views
}

export interface SketchfabMetadata {
  title: string;
  description: string;
  tags: string[];
  isPrivate: boolean;
  isPublished: boolean;
  password?: string;
}
