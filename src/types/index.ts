
export interface CameraDevice {
  id: string;
  name: string;
  type: 'T2i' | 'T3i';
  connected: boolean;
  status: 'idle' | 'capturing' | 'error';
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
}

export interface Session {
  id: string;
  name: string;
  timestamp: number;
  images: CapturedImage[];
  subjectMatter?: string;
  completed: boolean;
  imageQuality?: number;
}

export interface MotorPosition {
  angle: number;
  step: number;
}

export interface MotorSettings {
  stepsPerRevolution: number;
  maxSpeed: number;
  acceleration: number;
  currentPosition: MotorPosition;
}

export interface AnalysisResult {
  subject: string;
  confidence: number;
  tags: string[];
}

export interface ExportSettings {
  exportPng: boolean;
  exportTiff: boolean;
  exportMasks: boolean;
  sendToRealityCapture: boolean;
}
