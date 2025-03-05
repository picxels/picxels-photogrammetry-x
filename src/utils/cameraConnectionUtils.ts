
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
    
    if (detectedCameras.length === 0) {
      console.log("No cameras detected");
      
      // Check if gphoto2 is installed as a fallback
      try {
        const whichResult = await executeCommand('which gphoto2');
        console.log("gphoto2 location:", whichResult);
        
        if (!whichResult || whichResult.trim() === '') {
          toast({
            title: "gphoto2 Not Found",
            description: "gphoto2 is not installed or not in PATH. Install with: sudo apt-get install gphoto2",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error("gphoto2 is not installed or not in PATH:", error);
        toast({
          title: "gphoto2 Not Found",
          description: "gphoto2 is not installed or not in PATH. Install with: sudo apt-get install gphoto2",
          variant: "destructive"
        });
      }
    }
    
    return { 
      connected: detectedCameras.length > 0, 
      detectedCameras 
    };
  } catch (error) {
    console.error("Error checking USB connections:", error);
    toast({
      title: "Camera Connection Error",
      description: "Failed to check for USB camera connections",
      variant: "destructive"
    });
    return { connected: false, detectedCameras: [] };
  }
};

/**
 * Check if a specific camera is physically connected and responsive
 */
export const isCameraResponding = async (cameraId: string, portInfo?: string): Promise<boolean> => {
  return cameraService.isCameraResponding(cameraId, portInfo);
};

// Importing executeCommand for the gphoto2 installation check
import { executeCommand } from "./commandUtils";
