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
}

export interface Session {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  images: ImageData[];
  imageQuality?: number;
  subjectMatter?: string;
  // Add any other session properties needed
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

export interface CameraProfile {
  id: string;
  name: string;
  settings: CameraSettings;
}
