import { CameraDevice, CapturedImage } from "@/types";
import { cameraDetectionService } from "@/services/cameraDetectionService";
import { cameraCaptureService } from "@/services/cameraCaptureService";
import { cameraConfigService } from "@/services/cameraConfigService";
import { toast } from "@/components/ui/use-toast";
import { generateRandomId } from "./utils";
import { DEBUG_SETTINGS } from "@/config/jetson.config";
import { saveByteArray } from "./fileSystem";

// Import the processImage and ensureColorProfile functions 
import { processImage, ensureColorProfile } from "./imageProcessingUtils";

/**
 * Detect connected cameras and update their connection status.
 */
export const detectAndConnectCameras = async (
  existingCameras: CameraDevice[],
  setCameras: React.Dispatch<React.SetStateAction<CameraDevice[]>>
): Promise<void> => {
  try {
    console.log("Detecting and connecting cameras...");
    
    // Detect cameras using gphoto2
    const detectedCameras = await cameraDetectionService.detectCameras();
    
    // Update the camera list based on detection
    const updatedCameras: CameraDevice[] = await Promise.all(
      detectedCameras.map(async (detectedCamera) => {
        const existingCamera = existingCameras.find((cam) => cam.port === detectedCamera.port);
        
        // Check if the camera is responding
        const isResponding = await cameraDetectionService.isCameraResponding(
          detectedCamera.model,
          detectedCamera.port
        );
        
        if (existingCamera) {
          // Update existing camera's connection status
          return {
            ...existingCamera,
            name: detectedCamera.model,
            connected: isResponding,
            status: isResponding ? "idle" : "error",
          };
        } else {
          // Add new camera to the list
          return {
            id: generateRandomId(),
            name: detectedCamera.model,
            type: "gphoto2",
            port: detectedCamera.port,
            connected: isResponding,
            status: isResponding ? "idle" : "error",
          };
        }
      })
    );
    
    // Add any disconnected cameras from the existing list
    existingCameras.forEach((existingCamera) => {
      if (!updatedCameras.find((cam) => cam.port === existingCamera.port)) {
        updatedCameras.push({
          ...existingCamera,
          connected: false,
          status: "error",
        });
      }
    });
    
    // Update the state with the new camera list
    setCameras(updatedCameras);
    
    console.log("Camera detection and connection complete.");
  } catch (error) {
    console.error("Error detecting and connecting cameras:", error);
    toast({
      title: "Camera Detection Failed",
      description: "Failed to detect cameras. Please check connections.",
      variant: "destructive",
    });
  }
};

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

/**
 * Get a camera by its ID.
 */
export const getCameraById = async (cameraId: string): Promise<CameraDevice | undefined> => {
  try {
    // Mock implementation (replace with actual data fetching)
    const cameras = await listConnectedCameras();
    
    const camera = cameras.find((camera) => camera.id === cameraId);
    
    if (!camera) {
      console.warn(`Camera with ID ${cameraId} not found`);
      return undefined;
    }
    
    return camera;
  } catch (error) {
    console.error(`Error getting camera by ID ${cameraId}:`, error);
    return undefined;
  }
};

/**
 * List connected cameras (mock implementation).
 */
export const listConnectedCameras = async (): Promise<CameraDevice[]> => {
  // Mock implementation (replace with actual data fetching)
  return new Promise((resolve) => {
    setTimeout(() => {
      const mockCameras: CameraDevice[] = [
        {
          id: "camera-1",
          name: "Mock Camera 1",
          type: "gphoto2",
          port: "/dev/usb/mock1",
          connected: true,
          status: "idle",
        },
        {
          id: "camera-2",
          name: "Mock Camera 2",
          type: "gphoto2",
          port: "/dev/usb/mock2",
          connected: false,
          status: "error",
        },
      ];
      resolve(mockCameras);
    }, 500);
  });
};
