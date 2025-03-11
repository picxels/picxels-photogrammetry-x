
export const CAMERA_DEVICE_PATHS = [
  "/dev/video0",
  "/dev/video1",
  "/dev/video2",
  "/dev/video3",
  "/dev/video4",
  "/dev/video5",
  "/dev/video6",
  "/dev/video7",
  "/dev/video8",
  "/dev/video9",
];

export const DEBUG_SETTINGS = {
  // Debug mode settings
  enableVerboseLogging: true,
  logNetworkRequests: true,
  
  // Camera simulation settings
  simulateCameraConnection: false,
  forceDisableAllCameras: false,
  forceSimulationOnJetson: false,
  autoFocusBeforeCapture: true,
  
  // Platform detection
  forceJetsonPlatformDetection: true,
  
  // API settings
  apiServerError: false,
  disableCors: false,
  ignoreHttpsErrors: false,
  forceUseXhr: false,
  
  // Sample images
  forceUseLocalSamples: false,
  
  // RC Node settings
  rcNodeDebugMode: false,
  useRelaxedAuthFlow: false,
  
  // Motor settings
  simulateMotorConnection: false,
};

// Add missing configurations needed by modelInitialization.ts
export const MODEL_PATHS = {
  sharpness: {
    onnx: "/models/sharpness/model.onnx",
    tensorrt: "/models/sharpness/model_optimized.engine"
  },
  mask: {
    onnx: "/models/mask/model.onnx",
    tensorrt: "/models/mask/model_optimized.engine"
  },
  llm: {
    onnx: "/models/llm/model.onnx",
    tensorrt: "/models/llm/model_optimized.engine"
  }
};

export const SYSTEM_REQUIREMENTS = {
  minTensorRTVersion: "10.0.0",
  minCudaVersion: "12.0",
  recommendedMemory: 8 // in GB
};

export const PERFORMANCE_SETTINGS = {
  useMaxPerformanceMode: true,
  enablePowerSaving: false,
  useLowPrecision: true
};
