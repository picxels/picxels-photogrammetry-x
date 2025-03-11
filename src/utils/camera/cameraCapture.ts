
import { CameraDevice, CapturedImage } from "@/types";
import { toast } from "@/components/ui/use-toast";
import { cameraCaptureService } from "@/services/cameraCaptureService";
import { cameraConfigService } from "@/services/cameraConfigService";
import { generateRandomId } from "../utils";
import { DEBUG_SETTINGS } from "@/config/jetson.config";
import { saveByteArray } from "../fileSystem";
import { getCameraById } from "./cameraDetection";

/**
 * Capture an image from a specific camera.
 */
export const captureImage = async (
  cameraId: string,
  sessionId: string,
  currentAngle?: number
): Promise<CapturedImage> => {
  try {
    console.log(`Capturing image from camera ${cameraId} for session ${sessionId}`);
    
    // Get the camera
    const camera = await getCameraById(cameraId);
    
    if (!camera) {
      throw new Error(`Camera with ID ${cameraId} not found`);
    }
    
    if (!camera.port) {
      throw new Error(`Camera with ID ${cameraId} has no port information`);
    }
    
    // Generate a unique filename
    const timestamp = Date.now();
    const filename = `img_${timestamp}.jpg`;
    
    // Define the full file path
    const filePath = `/tmp/${filename}`;
    
    // Trigger autofocus before capture
    if (DEBUG_SETTINGS.autoFocusBeforeCapture) {
      await cameraConfigService.triggerAutofocus(camera.port);
    }
    
    // Set image format to JPEG
    await cameraConfigService.setImageFormatToJpeg(camera.port);
    
    // Capture the image using gphoto2
    const capturedPath = await cameraCaptureService.captureImage(camera.port, filePath);
    
    // Create a preview URL for the captured image
    const previewUrl = `/public/temp/${filename}`;
    
    // Create a public copy for web access
    await saveByteArray(capturedPath, `public/temp/${filename}`);
    
    // Create a CapturedImage object
    const capturedImage: CapturedImage = {
      id: generateRandomId(),
      camera: cameraId,
      previewUrl: previewUrl,
      filePath: capturedPath,
      timestamp: timestamp,
      angle: currentAngle,
      sessionId: sessionId,
      path: `/tmp/${filename}`
    };
    
    console.log(`Image captured successfully from camera ${cameraId}: ${capturedPath}`);
    return capturedImage;
  } catch (error) {
    console.error(`Error capturing image from camera ${cameraId}:`, error);
    toast({
      title: "Capture Failed",
      description: `Failed to capture image from camera ${cameraId}.`,
      variant: "destructive",
    });
    throw error;
  }
};
