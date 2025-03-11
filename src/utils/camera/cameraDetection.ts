
import { CameraDevice } from "@/types";
import { toast } from "@/components/ui/use-toast";
import { cameraDetectionService } from "@/services/cameraDetectionService";
import { generateRandomId } from "../utils";

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
