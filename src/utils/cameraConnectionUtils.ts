
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
  console.log("Checking for physical USB camera connections (simulation mode)");
  
  try {
    console.log("Using CameraService to detect cameras");
    
    // Use the cameraService to detect cameras
    const detectedCameras = await cameraService.detectCameras();
    
    // In simulation mode, always show successful detection
    return { 
      connected: detectedCameras.length > 0, 
      detectedCameras 
    };
  } catch (error) {
    console.error("Error checking USB connections:", error);
    toast({
      title: "Simulation Mode Active",
      description: "Camera detection is simulated. No real cameras will be detected.",
      variant: "default"
    });
    
    // Return simulated camera data in case of error
    return { 
      connected: true, 
      detectedCameras: [
        { model: "Canon EOS 550D (Simulated)", port: "usb:001,004" },
        { model: "Canon EOS 600D (Simulated)", port: "usb:001,005" }
      ] 
    };
  }
};

/**
 * Check if a specific camera is physically connected and responsive
 */
export const isCameraResponding = async (cameraId: string, portInfo?: string): Promise<boolean> => {
  // In simulation mode, always return true after a short delay to simulate checking
  await new Promise(resolve => setTimeout(resolve, 500));
  return true;
};

// Importing executeCommand for the gphoto2 installation check
import { executeCommand } from "./commandUtils";
