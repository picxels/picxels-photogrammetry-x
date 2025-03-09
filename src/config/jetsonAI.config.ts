
/**
 * Jetson AI Labs Integration Configuration
 * 
 * This file contains configurations for integrating with Jetson AI Lab projects:
 * - EfficientViT for image segmentation
 * - Nano-VLM for visual language processing
 * - NanoDB for optimized local storage
 */

// Model paths and configurations
export const JETSON_AI_MODELS = {
  // EfficientViT model paths and configurations
  efficientViT: {
    enabled: true,
    modelPath: "/opt/picxels/models/efficientViT/efficientViT-L1.engine",
    modelType: "tensorrt",
    inputSize: 1024, // Updated input resolution to 1024x1024
    outputSize: 3456, // Output size for final masks
    confidenceThreshold: 0.75,
    useMetadataCache: true
  },
  
  // Nano-VLM model paths and configurations - updated for VILA1.5-8B
  nanoVLM: {
    enabled: true,
    modelPath: "/opt/picxels/models/nanovlm/vila_llama3_8b.engine",
    modelType: "tensorrt",
    maxTokenLength: 2048,
    temperature: 0.7,
    useQuantization: true,
    maxImageSize: 1024, // Resize image to this size for inference
    model: "Efficient-Large-Model/Llama-3-VILA1.5-8B" // Model identifier
  },
  
  // NanoDB configuration for optimized local data storage
  nanoDB: {
    enabled: true, // Enabled for session database
    databasePath: "/opt/picxels/data/nanodb",
    sessionDatabaseFile: "sessions.db",
    useCompression: true,
    syncInterval: 60000 // ms
  }
};

// Performance and hardware configurations for AI models
export const AI_HARDWARE_CONFIG = {
  maxBatchSize: 4,
  useTensorCores: true,
  useMaxPerformance: true,
  powerMode: "MAX_P", // MAX_N, MAX_P, MAX_Q profiles
  precisionMode: "FP16", // FP32, FP16, INT8
  useDLA: true, // Use Deep Learning Accelerator
  dlaCore: 0, // DLA core to use (0 or 1)
  cudaStreamPriority: "high", // high, normal, low
  optimizationLevel: 3, // 0-3, higher is more optimization
  workspaceSize: 1024 // MB
};

// Feature flags for controlling which AI capabilities are enabled
export const AI_FEATURES = {
  enhancedSegmentation: true, // Use EfficientViT for segmentation
  smartSubjectAnalysis: true, // Use Nano-VLM for subject analysis
  backgroundRemoval: true, // Improved background removal using EfficientViT
  objectQualityAssessment: true, // Quality assessment of the subject
  realTimeFeedback: true, // Provide AI feedback during capture
  sessionMetadataGeneration: true, // Generate metadata for sessions
  naturalLanguageCommands: false, // Not implemented in first phase
  imageBatchProcessing: true, // Process multiple images at once
  imageResizing: true, // Automatically resize images
  imageCropping: true, // Automatically crop images to square
  saveOriginalFiles: true // Keep original files after processing
};

// Image processing settings
export const IMAGE_PROCESSING = {
  finalImageSize: 3456, // Final size for processed images (3456x3456)
  jpegQuality: 95, // Quality for JPEG exports
  tiffCompression: "LZW", // Compression for TIFF files
  preserveExif: true, // Keep EXIF data in processed images
  colorProfilePath: "/opt/picxels/color_profiles", // Path to color profiles
  cropToSquare: true, // Crop images to square
  tempDir: "/tmp/picxels/processing", // Temporary directory for processing
  outputDir: "/opt/picxels/sessions", // Output directory for sessions
  createSubfolders: true, // Create subfolders for different formats
  folderStructure: {
    original: "original",
    tiff: "tiff_16bit",
    jpeg: "jpeg_8bit",
    masks: "masks",
    thumbnails: "thumbnails"
  }
};

// Capture settings
export const CAPTURE_SETTINGS = {
  angleIncrement: 5.625, // 360/64 = 5.625 degrees per step
  totalImages: 64, // 64 images for complete 360 rotation
  triggerDelay: 500, // ms to wait after motor movement before capture
  stabilizationDelay: 1000, // ms to wait for camera/subject to stabilize
  maxConcurrentCaptures: 2, // Maximum concurrent camera captures
  autoFocusBeforeCapture: true, // Trigger autofocus before each capture
  verifyImageAfterCapture: true, // Check image quality after capture
  retryFailedCaptures: true, // Retry if capture fails
  maxRetries: 3 // Maximum number of retries
};

// Debugging and development options
export const AI_DEBUG_OPTIONS = {
  logInferenceTime: true,
  saveIntermediateResults: false,
  visualizeSegmentation: true,
  logMemoryUsage: true,
  profiling: false,
  mockAIResponses: false, // Set to true for testing without actual AI
  mockResponseDelay: 1500, // Simulated processing time in ms
};
