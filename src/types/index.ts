
// This file contains all the type definitions for the application
// Note: This is a read-only file that we're modifying specifically by your request

export interface CameraDevice {
  id: string;
  name: string;
  type: string;
  connected: boolean;
  status: "idle" | "capturing" | "error" | "processing";
}

export interface CapturedImage {
  id: string;
  sessionId: string;
  path: string;
  timestamp: number;
  camera: string;
  angle?: number;
  previewUrl?: string;
  sharpness?: number;
  hasMask?: boolean;
  hasColorProfile?: boolean;
  colorProfileType?: string;
}

export interface Session {
  id: string;
  name: string;
  timestamp: number;
  images: CapturedImage[];
  completed?: boolean;
  imageQuality?: number;
  subjectMatter?: string;
}

export interface MotorPosition {
  angle: number;
  step: number;
}

export interface MotorSettings {
  stepsPerRevolution: number;
  maxSpeed: number;
  acceleration: number;
}

export interface AnalysisResult {
  subject: string;
  confidence: number;
  properties?: {
    [key: string]: any;
  };
}
