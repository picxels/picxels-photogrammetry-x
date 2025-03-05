import { toast } from "@/components/ui/use-toast";
import { cameraService } from "@/services/cameraService";

/**
 * Checks for physical USB camera connections
 * Uses gphoto2 --auto-detect to find connected cameras
 */
export const checkUSBCameraConnections = async (): Promise<{
  connected: boolean;
  detectedCameras: { model: string, port: string }[];
}> => {
  console.log("Checking for physical USB camera connections");
  
  try {
    console.log("Using CameraService to detect cameras");
    
    // Use the cameraService to detect cameras
    const detectedCameras = await cameraService.detectCameras();
    
    return { 
      connected: detectedCameras.length > 0, 
      detectedCameras 
    };
  } catch (error) {
    console.error("Error checking USB connections:", error);
    
    // Check if we're in simulation mode
    if (window.DEBUG_SETTINGS?.simulateCameraConnection) {
      toast({
        title: "Simulation Mode Active",
        description: "Camera detection is simulated. No real cameras will be detected.",
        variant: "default"
      });
      
      // Return simulated camera data
      return { 
        connected: true, 
        detectedCameras: [
          { model: "Canon EOS 550D (Simulated)", port: "usb:001,004" },
          { model: "Canon EOS 600D (Simulated)", port: "usb:001,005" }
        ] 
      };
    }
    
    // If not in simulation mode and error occurs, show error toast
    toast({
      title: "Camera Detection Failed",
      description: "Unable to connect to cameras. Check USB connections and try again.",
      variant: "destructive"
    });
    
    // Return empty array to indicate no cameras found
    return { connected: false, detectedCameras: [] };
  }
};

/**
 * Check if a specific camera is physically connected and responsive
 */
export const isCameraResponding = async (cameraId: string, portInfo?: string): Promise<boolean> => {
  try {
    // If we're in simulation mode, always return true after a short delay
    if (window.DEBUG_SETTINGS?.simulateCameraConnection) {
      await new Promise(resolve => setTimeout(resolve, 500));
      return true;
    }
    
    // Otherwise check if camera is actually responding
    const result = await cameraService.isCameraResponding(cameraId, portInfo);
    return result;
  } catch (error) {
    console.error("Error checking camera responsiveness:", error);
    return false;
  }
};

// Importing executeCommand for the gphoto2 installation check
import { executeCommand } from "./commandUtils";
