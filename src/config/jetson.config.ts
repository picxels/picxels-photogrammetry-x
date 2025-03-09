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
  
  // Motor settings
  simulateMotorConnection: false,
};
