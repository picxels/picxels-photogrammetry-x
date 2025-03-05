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
  passes: Pass[];
  // Add any other session properties needed
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
  suggestions?: string[];
  metadata?: Record<string, any>;
  tags?: string[];
}

// Import workflow types
export * from './workflow';
