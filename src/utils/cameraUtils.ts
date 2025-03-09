
import { toast } from "@/components/ui/use-toast";
import { CAMERA_DEVICE_PATHS } from "@/config/jetson.config";

// Re-export from platformUtils
export { isJetsonPlatform, isDevelopmentMode } from './platformUtils';

// Re-export from commandUtils
export { 
  executeCommand, 
  releaseCamera, 
  triggerAutofocus, 
  setImageFormatToJpeg 
} from './commandUtils';

// Re-export from platformCommandUtils
export { executeJetsonCommand } from './platformCommandUtils';

// Re-export from commandValidationUtils
export { validateCommand, sanitizeCommand } from './commandValidationUtils';

// Re-export from cameraModelUtils
export { mapCameraModelToType } from './cameraModelUtils';

// Re-export from cameraParsingUtils
export { parseGphoto2Output } from './cameraParsingUtils';

// Re-export from cameraConnectionUtils
export { 
  checkUSBCameraConnections,
  isCameraResponding
} from './cameraConnectionUtils';

// Re-export from cameraDiscoveryUtils
export { detectCameras } from './cameraDiscoveryUtils';

// Re-export from captureUtils
export {
  captureImage
} from './captureUtils';

// Re-export from imageProcessingUtils
export {
  checkImageSharpness,
  generateImageMask,
  processImage,
  ensureColorProfile
} from './imageProcessingUtils';

// Re-export from sessionUtils
export {
  createSession,
  createNewPass,
  addPassToSession,
  addImageToPass,
  renameSession,
  renamePass,
  completePass
} from './sessionUtils';

// Export camera services
export { cameraService } from '@/services/cameraService';
export { cameraCoreService } from '@/services/cameraCoreService';
export { cameraDetectionService } from '@/services/cameraDetectionService';
export { cameraConfigService } from '@/services/cameraConfigService';
export { cameraCaptureService } from '@/services/cameraCaptureService';
