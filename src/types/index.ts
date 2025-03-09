
export interface RCNodeConfig {
  nodeUrl: string;
  authToken: string;
  isConnected: boolean;
}

export interface ExportSettings {
  exportPng: boolean;
  exportTiff: boolean;
  exportMasks: boolean;
  sendToRealityCapture: boolean;
}

export interface CameraSettings {
  // Define camera settings properties here
  iso?: number;
  shutterSpeed?: string;
  aperture?: number;
  whiteBalance?: string;
  focusMode?: string;
}

export interface Session {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  images: ImageData[];
  imageQuality?: number;
  subjectMatter?: string;
  description?: string; // Added field for subject description
  tags?: string[]; // Added field for subject tags
  status: SessionStatus; // Added session status tracking
  passes: Pass[];
  processed: boolean; // Flag to track if processed by RCNode
  processingDate?: Date; // When it was sent to RCNode
  processingJobId?: string; // RCNode job identifier
  exportPath?: string; // Path where processed files are stored
}

// Added SessionStatus enum to track session progress
export enum SessionStatus {
  INITIALIZING = "initializing", // Just created, no initial capture yet
  INITIALIZED = "initialized",   // First image taken, metadata generated
  IN_PROGRESS = "in_progress",   // Multiple passes captured
  COMPLETED = "completed",       // All required images captured
  PROCESSING = "processing",     // Currently being processed by RCNode
  PROCESSED = "processed"        // Processing complete
}

export interface Pass {
  id: string;
  name: string;
  timestamp: number;
  images: CapturedImage[];
  completed: boolean;
}

export interface ImageData {
  id: string;
  url: string;
  camera: string;
  angle: number;
  timestamp: Date;
  hasMask?: boolean;
  // Add other image properties as needed
}

export interface CapturedImage {
  id: string;
  sessionId: string;
  path: string;
  timestamp: number;
  camera: string;
  angle?: number;
  previewUrl: string;
  sharpness?: number;
  hasMask?: boolean;
  hasColorProfile?: boolean;
  colorProfileType?: string;
  maskedPath?: string;
  // Added new fields for our enhanced workflow
  originalPath?: string;    // Path to original CR2 file if applicable
  tiffPath?: string;        // Path to 16-bit TIFF version
  jpegPath?: string;        // Path to 8-bit JPEG version
  maskPath?: string;        // Path to mask file
  croppedPath?: string;     // Path to cropped version
  width?: number;          // Original width of image
  height?: number;         // Original height of image
  croppedWidth?: number;   // Width after cropping
  croppedHeight?: number;  // Height after cropping
  metadata?: ImageMetadata; // EXIF and other metadata
}

// New interface for storing image metadata
export interface ImageMetadata {
  exif?: Record<string, any>;
  camera?: string;
  lens?: string;
  focalLength?: number;
  iso?: number;
  aperture?: number;
  shutterSpeed?: string;
  captureTime?: Date;
}

export interface CameraProfile {
  id: string;
  name: string;
  settings: CameraSettings;
}

export interface CameraDevice {
  id: string;
  name: string;
  type: string;
  port?: string;  // Added port property to store the USB port information
  connected: boolean;
  status: "idle" | "capturing" | "error" | "ready";
}

export interface MotorPosition {
  angle: number;
  step: number;
}

export interface MotorSettings {
  stepsPerRotation: number;
  stepSize: number;
  maxSpeed: number;
  acceleration: number;
  scanSteps: number;
  pauseTimeBetweenSteps: number;
  currentPosition?: MotorPosition;
}

export interface AnalysisResult {
  subject: string;
  confidence: number;
  description?: string;     // Enhanced description field
  suggestions?: string[];
  metadata?: Record<string, any>;
  tags?: string[];
}

export interface SessionDatabase {
  sessions: Session[];
  lastUpdated: Date;
  version: string;
}

// Import workflow types
export * from './workflow';
