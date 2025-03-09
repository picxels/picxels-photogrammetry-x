
// Central export file for the AI utils

// Export from modelInitialization
export {
  initializeAIModels,
  getModelStatus,
  detectTensorRTVersion,
  detectCUDAVersion,
  checkPythonDependencies,
  KNOWN_DEPENDENCY_ISSUES,
  type AIModels,
  type ModelConfig
} from './ai/modelInitialization';

// Export from imageSharpness
export {
  checkImageSharpness
} from './ai/imageSharpness';

// Export from imageMask
export {
  generateImageMask
} from './ai/imageMask';

// Export from subjectAnalysis
export {
  analyzeSubjectWithLLM
} from './ai/subjectAnalysis';

// Export from fallbackUtils
export {
  shouldUseFallbackData,
  notifyFallbackMode
} from './ai/fallbackUtils';

// Export from efficientViT service
export {
  isEfficientViTAvailable,
  installEfficientViT,
  generateMaskWithEfficientViT,
  applyMask,
  processImageForPhotogrammetry
} from '@/services/efficientViT';
