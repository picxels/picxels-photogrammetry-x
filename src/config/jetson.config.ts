
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

// Camera device paths and configuration
export const CAMERA_DEVICE_PATHS = {
  usbCameras: [
    "/dev/bus/usb/001/",
    "/dev/bus/usb/002/"
  ],
  gphoto2SupportedModels: [
    "Canon EOS Rebel T2i",
    "Canon EOS Rebel T3i",
    "Canon EOS 550D",  // European/Japanese name for T2i
    "Canon EOS 600D",   // European/Japanese name for T3i
    "Canon EOS Digital Rebel T2i",
    "Canon EOS Digital Rebel T3i"
  ],
  // Camera detection settings
  detection: {
    checkIntervalMs: 5000,           // How often to check for camera connection changes
    requiredResponseTimeoutMs: 5000, // Timeout for camera response
    maxCaptureTimeoutMs: 15000,      // Maximum time to wait for image capture (15 seconds)
    maxRetryAttempts: 3,             // Maximum number of retry attempts for commands
    retryDelayMs: 1000,              // Delay between retry attempts in milliseconds
    
    // Commands for camera detection and interaction
    usbBusCheckCommand: "lsusb",     // Command to check USB bus
    gphoto2ListCommand: "gphoto2 --auto-detect", // Command to list detected cameras
    gphoto2SummaryCommand: "gphoto2 --port={port} --summary", // Command to check camera responsiveness
    gphoto2CaptureCommand: "gphoto2 --port={port} --capture-image-and-download --filename={filename}", // Command for capture
    temporaryImageStorage: "/tmp/picxels/captures", // Directory to temporarily store captured images
    
    // Allowed gphoto2 camera commands for security
    allowedCommands: [
      "gphoto2 --auto-detect",
      "gphoto2 --abilities",
      "gphoto2 --port={port} --summary",
      "gphoto2 --port={port} --capture-image-and-download",
      "gphoto2 --port={port} --get-config",
      "mkdir -p {storage}",
      "ls {storage}",
      "convert {image} {output}"
    ],
    
    // Command parameter templates that can be substituted
    commandTemplates: {
      port: "usb:\\d+,\\d+", // Regex pattern for allowable port values
      storage: "/tmp/picxels/captures(/[\\w\\-\\.]+)*", // Regex for allowable storage paths
      filename: "/tmp/picxels/captures(/[\\w\\-\\.]+)*\\.jpe?g", // Regex for allowable filenames
      image: "/tmp/picxels/captures(/[\\w\\-\\.]+)*\\.jpe?g", // Regex for allowable image paths
      output: "/tmp/picxels/captures(/[\\w\\-\\.]+)*\\.(png|jpe?g|tiff)" // Regex for allowable output paths
    }
  }
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
  simulateCameraConnection: false,  // Set to true to force simulate camera connections in dev mode
  simulateMotorConnection: false,
  forceUseLocalSamples: false,
  
  // RC Node connection debug settings
  disableCors: true,         // If true, attempts to disable CORS for RC Node requests
  rcNodeDebugMode: true,     // Enables more detailed RC Node error logging
  forceUseXhr: false,        // Use XMLHttpRequest instead of fetch for RC Node
  useDetectPortScan: false,  // Scan common ports on RC Node host to find service
  ignoreHttpsErrors: true,   // Ignore HTTPS certificate errors
  saveRawResponseData: true, // Save raw response data for debugging
  useRelaxedAuthFlow: true,  // Try with and without auth token for connections
  useQueryAuthInstead: true, // Use query parameter auth instead of header
  
  // Extra connection fallbacks
  tryDifferentMethods: true, // Try different connection methods automatically
  openBrowserTest: false,    // Open browser window for manual testing
  
  // Network settings
  bypassNetworkIsolation: true, // Allow connections that might normally be restricted
  probeAllPorts: false,         // Test multiple ports on the target server
  logAllHeaders: true,          // Log all request/response headers
  
  // Camera debug options
  cameraDebugMode: true,        // Enable camera debug messages
  simulateBadConnection: false, // Simulate intermittent camera connections
  forceDisableAllCameras: false // Force all cameras to appear disconnected
};

// Network and communication settings
export const NETWORK_SETTINGS = {
  rcNodeConnectionTimeout: 10000,    // 10 seconds for initial connection test
  rcNodeCommandTimeout: 30000,       // 30 seconds for commands
  rcNodeHeartbeatInterval: 60000,    // Check connection every minute
  rcNodeReconnectAttempts: 3,        // Number of reconnect attempts
  rcNodeDefaultPort: 8000,           // Default port for RC Node
  allowLocalNetworkOnly: false,      // Restrict connections to local network
  enableIpv6: false,                 // Enable IPv6 connections
  
  // Additional network settings for troubleshooting
  alternativePorts: [8001, 8443, 443], // Alternative ports to try if default fails
  tryHttpAndHttps: true,                // Try both HTTP and HTTPS
  useCustomDns: false                   // Use custom DNS resolution
};

// Script configurations
export const SCRIPT_CONFIGS = {
  // Required npm scripts that should be added to package.json
  // Note: These must be added manually since we can't modify package.json directly
  requiredScripts: {
    start: "vite preview --host --port 8080",
    dev: "vite --host --port 8080",
    build: "vite build"
  },
  
  // Instructions for adding missing scripts
  setupInstructions: [
    "npm pkg set scripts.start=\"vite preview --host --port 8080\"",
    "npm pkg set scripts.dev=\"vite --host --port 8080\"",
    "npm pkg set scripts.build=\"vite build\""
  ],
  
  // Alternative start command if npm scripts aren't available
  alternativeStartCommand: "npx vite preview --host --port 8080",
  
  // Systemd service configuration
  systemdServiceName: "picxels",
  systemdServicePath: "/etc/systemd/system/picxels.service",
  
  // Extra paths for troubleshooting
  logPath: "/var/log/picxels",
  tempPath: "/tmp/picxels"
};

