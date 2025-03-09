
import { toast } from "@/components/ui/use-toast";
import { cameraDetectionService } from "@/services/cameraDetectionService";
import { isDevelopmentMode, isJetsonPlatform, shouldUseSimulationMode } from "./platformUtils";

/**
 * Checks for physical USB camera connections
 * Uses the camera detection service to find connected cameras
 */
export const checkUSBCameraConnections = async (): Promise<{
  connected: boolean;
  detectedCameras: { model: string, port: string }[];
}> => {
  console.log("Checking for physical USB camera connections");
  
  try {
    // First check if we should use real camera detection or simulation
    if (isJetsonPlatform() && !shouldUseSimulationMode()) {
      console.log("Using real camera detection on Jetson platform");
      
      // Use the cameraDetectionService to detect cameras directly
      const detectedCameras = await cameraDetectionService.detectCameras();
      console.log("Real camera detection results:", detectedCameras);
      
      return { 
        connected: detectedCameras.length > 0, 
        detectedCameras 
      };
    } else {
      console.log("Using simulated camera detection");
      
      // Only show simulation toast in development mode
      if (isDevelopmentMode()) {
        toast({
          title: "Simulation Mode Active",
          description: "Camera detection is simulated. No real cameras will be detected.",
          variant: "default"
        });
      }
      
      // Return simulated camera data
      return { 
        connected: true, 
        detectedCameras: [
          { model: "Canon EOS 550D (Simulated)", port: "usb:001,004" },
          { model: "Canon EOS 600D (Simulated)", port: "usb:001,005" }
        ] 
      };
    }
  } catch (error) {
    console.error("Error checking USB connections:", error);
    
    // Show error toast
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
    // If we should use real camera detection
    if (isJetsonPlatform() && !shouldUseSimulationMode()) {
      console.log(`Checking if real camera ${cameraId} is responding on port ${portInfo || 'unknown'}`);
      
      if (!portInfo) {
        console.error(`No port information for camera ${cameraId}`);
        return false;
      }
      
      // Use the detection service to check if camera is responding
      return await cameraDetectionService.isCameraResponding(cameraId, portInfo);
    } else {
      // In simulation mode, add a short delay to simulate checking
      await new Promise(resolve => setTimeout(resolve, 500));
      return true; // Always return true in simulation mode
    }
  } catch (error) {
    console.error("Error checking camera responsiveness:", error);
    return false;
  }
};
