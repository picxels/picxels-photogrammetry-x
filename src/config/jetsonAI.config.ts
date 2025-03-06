
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
    inputSize: 512, // Input resolution
    confidenceThreshold: 0.75,
    useMetadataCache: true
  },
  
  // Nano-VLM model paths and configurations
  nanoVLM: {
    enabled: true,
    modelPath: "/opt/picxels/models/nanovlm/nanovlm.engine",
    modelType: "tensorrt",
    maxTokenLength: 512,
    temperature: 0.7,
    useQuantization: true
  },
  
  // NanoDB configuration for optimized local data storage
  nanoDB: {
    enabled: false, // Not implemented in first phase
    databasePath: "/opt/picxels/data/nanodb",
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
  realTimeFeedback: false, // Not implemented in first phase
  sessionMetadataGeneration: false, // Not implemented in first phase
  naturalLanguageCommands: false // Not implemented in first phase
};

// Debugging and development options
export const AI_DEBUG_OPTIONS = {
  logInferenceTime: true,
  saveIntermediateResults: false,
  visualizeSegmentation: true,
  logMemoryUsage: true,
  profiling: false
};
