
import { validateCommand } from "@/utils/commandValidationUtils";
import { DEBUG_SETTINGS } from "@/config/jetson.config";
import { cameraCoreService } from "./cameraCoreService";
import { cameraDetectionService } from "./cameraDetectionService";
import { cameraConfigService } from "./cameraConfigService";
import { cameraCaptureService } from "./cameraCaptureService";

/**
 * Camera Service - provides an abstraction layer for interacting with cameras
 * regardless of the platform (browser or Jetson)
 */
class CameraService {
  // Re-export methods from the core service
  async releaseCamera(): Promise<void> {
    return cameraCoreService.releaseCamera();
  }
  
  // Re-export methods from the detection service
  async detectCameras(): Promise<{ model: string, port: string }[]> {
    return cameraDetectionService.detectCameras();
  }
  
  async isCameraResponding(cameraId: string, portInfo?: string): Promise<boolean> {
    return cameraDetectionService.isCameraResponding(cameraId, portInfo);
  }
  
  // Re-export methods from the config service
  async triggerAutofocus(port?: string): Promise<void> {
    return cameraConfigService.triggerAutofocus(port);
  }
  
  async setImageFormatToJpeg(port?: string): Promise<void> {
    return cameraConfigService.setImageFormatToJpeg(port);
  }
  
  async getCameraSummary(portInfo: string): Promise<string> {
    return cameraConfigService.getCameraSummary(portInfo);
  }
  
  async getCameraConfig(portInfo: string): Promise<string> {
    return cameraConfigService.getCameraConfig(portInfo);
  }
  
  async getConfigOptions(portInfo: string, configName: string): Promise<string[]> {
    return cameraConfigService.getConfigOptions(portInfo, configName);
  }
  
  async setConfig(portInfo: string, configName: string, value: string | number): Promise<void> {
    return cameraConfigService.setConfig(portInfo, configName, value);
  }
  
  // Re-export methods from the capture service
  async captureImage(portInfo: string, outputPath: string): Promise<string> {
    return cameraCaptureService.captureImage(portInfo, outputPath);
  }
}

// Export a singleton instance
export const cameraService = new CameraService();
