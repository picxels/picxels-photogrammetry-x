export interface SessionImage {
  id: string;
  filename: string;
  filePath: string;
  camera: string;
  angle: string;
  position?: [number, number, number];
  dateCaptured: number;
  metadata?: Record<string, any>;
  maskPath?: string;
  analyzed?: boolean;
  qualityScore?: number;
}

export interface Pass {
  id: string;
  name: string;
  images: string[]; // Array of SessionImage IDs
  dateCreated: number;
  dateModified: number;
}

export interface RCNodeConfig {
  nodeUrl: string;
  authToken: string;
  isConnected: boolean;
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  stages: WorkflowStage[];
  createdAt: number;
  updatedAt: number;
}

export interface WorkflowStage {
  id: string;
  name: string;
  commands: string[];
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
}

export interface RCPreviewData {
  renderViews?: string[];
  pointClouds?: string[];
  orthographicViews?: string[];
  metadata?: Record<string, any>;
}

export interface SketchfabMetadata {
  title: string;
  description: string;
  tags: string[];
  isPrivate: boolean;
  isPublished: boolean;
  password?: string;
  storeLink?: string;
  socialSharing?: SocialMediaShare[];
}

export interface SocialMediaShare {
  platform: 'instagram' | 'twitter' | 'facebook' | 'reddit' | 'tiktok';
  enabled: boolean;
  customText?: string;
}

export interface MotorControlState {
  currentPosition: [number, number, number];
}

export interface Session {
  id: string;
  name: string;
  images: SessionImage[];
  passes: Pass[];
  dateCreated: number;
  dateModified: number;
  subjectMatter?: string;
  imageQuality?: number;
  previewImage?: string;
  processedModels?: ProcessedModel[];
}

export interface ProcessedModel {
  id?: string;
  name?: string;
  processedAt?: number;
  workflowId?: string;
  previewUrl?: string;
  downloadUrl?: string;
  format?: string;
  status?: 'processing' | 'completed' | 'failed';
  metadata?: Record<string, any>;
}
