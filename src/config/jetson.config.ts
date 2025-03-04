
/**
 * Jetson Orin Nano Configuration
 * 
 * This file contains configurations specific to running the application
 * on the Jetson Orin Nano platform with NVIDIA Jetson Linux 36.4.3 GA.
 */

// AI Model paths for Jetson Orin Nano
export const MODEL_PATHS = {
  sharpness: {
    onnx: "/opt/picxels/models/sharpness/focus_net.onnx",
    tensorrt: "/opt/picxels/models/sharpness/focus_net.trt"
  },
  mask: {
    onnx: "/opt/picxels/models/masks/mobile_sam.onnx",
    tensorrt: "/opt/picxels/models/masks/mobile_sam.trt"
  },
  llm: {
    onnx: "/opt/picxels/models/llm/phi2.onnx",
    tensorrt: "/opt/picxels/models/llm/phi2.trt"
  }
};

// GPIO pin configurations for Jetson
export const MOTOR_GPIO_CONFIG = {
  enablePin: 18,
  directionPin: 23,
  stepPin: 24,
  sleepPin: 17
};

// Camera device paths
export const CAMERA_DEVICE_PATHS = {
  usbCameras: [
    "/dev/bus/usb/001/",
    "/dev/bus/usb/002/"
  ],
  gphoto2SupportedModels: [
    "Canon EOS Rebel T2i",
    "Canon EOS Rebel T3i"
  ]
};

// System requirements
export const SYSTEM_REQUIREMENTS = {
  minCudaVersion: "11.4",
  minTensorRTVersion: "8.5.2",
  recommendedNvccPath: "/usr/local/cuda/bin/nvcc",
  pythonVersion: "3.8",
  nodeVersion: "22.14.0",
  npmVersion: "10.9.2"
};

// Performance settings
export const PERFORMANCE_SETTINGS = {
  useMaxPerformanceMode: true,
  enableGPUOptimization: true,
  maxImagesInMemory: 12,
  useTensorCores: true
};

// Debug settings
export const DEBUG_SETTINGS = {
  enableVerboseLogging: true,
  logNetworkRequests: true,
  simulateCameraConnection: false,
  simulateMotorConnection: false,
  forceUseLocalSamples: false,
  // New settings for better diagnostics
  disableCors: false,         // If true, attempts to proxy RC Node requests
  rcNodeDebugMode: true,      // Enables more detailed RC Node error logging
  forceUseXhr: false,         // Use XMLHttpRequest instead of fetch for RC Node
  useDetectPortScan: false,   // Scan common ports on RC Node host to find service
  ignoreHttpsErrors: true,    // Ignore HTTPS certificate errors
  saveRawResponseData: true,  // Save raw response data for debugging
  useRelaxedAuthFlow: false   // Try with and without auth token for connections
};

// Network and communication settings
export const NETWORK_SETTINGS = {
  rcNodeConnectionTimeout: 10000,    // 10 seconds for initial connection test
  rcNodeCommandTimeout: 30000,       // 30 seconds for commands
  rcNodeHeartbeatInterval: 60000,    // Check connection every minute
  rcNodeReconnectAttempts: 3,        // Number of reconnect attempts
  rcNodeDefaultPort: 8000,           // Default port for RC Node
  allowLocalNetworkOnly: false,      // Restrict connections to local network
  enableIpv6: false                  // Enable IPv6 connections
};
