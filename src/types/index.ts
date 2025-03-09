
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
  completed?: boolean; // Added this field
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
  status?: SessionStatus; // Added status field
  updatedAt?: Date; // Added updatedAt field
  createdAt?: Date; // Added createdAt field
  description?: string; // Added description field
  tags?: string[]; // Added tags field
  processed?: boolean; // Added processed field
  processingDate?: number; // Added processingDate field
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

// Adding missing types
export enum SessionStatus {
  INITIALIZING = "initializing",
  INITIALIZED = "initialized",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  PROCESSING = "processing"
}

export interface CameraDevice {
  id: string;
  name: string;
  type: string;
  port?: string;
  connected: boolean;
  status?: 'idle' | 'ready' | 'capturing' | 'error';
}

export interface CapturedImage {
  id: string;
  camera: string;
  previewUrl: string;
  filePath: string;
  timestamp: number;
  angle?: number;
  sharpness?: number;
  hasMask?: boolean;
}

export interface ImageData {
  id: string;
  url: string;
  camera: string;
  angle: number;
  timestamp: Date;
  hasMask?: boolean;
}

export interface MotorPosition {
  angle: number;
  step: number;
}

export interface MotorSettings {
  stepsPerRotation: number;
  currentPosition?: MotorPosition;
  minSpeed?: number;
  maxSpeed?: number;
  acceleration?: number;
  connected?: boolean;
}

export interface AnalysisResult {
  subjectMatter: string;
  description: string;
  tags: string[];
  confidence: number;
}

export interface RCCommand {
  command: string;
  params?: string[];
  description?: string;
}

export interface ExportSettings {
  format: string;
  quality: number;
  includeTextures: boolean;
  textureSize?: number;
  outputPath: string;
}

export interface SessionDatabase {
  sessions: Session[];
  lastOpened: string | null;
}
