
import { executeCommand } from "@/utils/commandUtils";
import { cameraCoreService } from "./cameraCoreService";
import { parseGphoto2Output } from "@/utils/cameraParsingUtils";
import { toast } from "@/components/ui/use-toast";

/**
 * Camera Detection Service - handles detecting connected cameras
 */
class CameraDetectionService {
  /**
   * Detect connected cameras using gphoto2
   */
  async detectCameras(): Promise<{ model: string, port: string }[]> {
    console.log("CameraDetectionService: Detecting cameras");
    
    try {
      // First release the camera from any blocking processes
      await cameraCoreService.releaseCamera();
      
      // Execute the auto-detect command with retries
      const stdout = await cameraCoreService.executeWithRetry(
        'gphoto2 --auto-detect',
        3,
        'Camera detection'
      );
      
      // If we didn't get a valid response, check manually if we can see the camera in USB
      if (!stdout.includes('Model') && !stdout.includes('Canon')) {
        try {
          console.log("Checking USB devices manually with lsusb");
          const lsusbOutput = await executeCommand('lsusb');
          console.log("lsusb output:", lsusbOutput);
          
          // Look for Canon cameras in lsusb output
          if (lsusbOutput && lsusbOutput.toLowerCase().includes('canon')) {
            console.log("Canon camera detected in lsusb output but not by gphoto2");
            toast({
              title: "Camera Connection Issue",
              description: "Camera detected in USB but not by gphoto2. Trying to release camera.",
              variant: "default"
            });
            
            // If we see Canon in lsusb but not in gphoto2, try more aggressive release
            await cameraCoreService.releaseCamera();
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Try one more time after aggressive release
            const retryStdout = await executeCommand('gphoto2 --auto-detect');
            console.log("After release, gphoto2 output:", retryStdout);
            
            // Parse the output from retry attempt
            const detectedCameras = parseGphoto2Output(retryStdout);
            console.log("Parsed camera info (retry):", detectedCameras);
            return detectedCameras;
          }
        } catch (err) {
          console.error("lsusb check failed:", err);
        }
      }
      
      // Parse the output to get detected cameras
      const detectedCameras = parseGphoto2Output(stdout);
      console.log("Parsed camera info:", detectedCameras);
      
      return detectedCameras;
    } catch (error) {
      console.error("Error in camera detection:", error);
      return [];
    }
  }
  
  /**
   * Check if a specific camera is physically connected and responsive
   */
  async isCameraResponding(cameraId: string, portInfo?: string): Promise<boolean> {
    try {
      console.log(`CameraDetectionService: Checking if camera ${cameraId} is responding on port ${portInfo || 'unknown'}`);
      
      if (!portInfo) {
        console.error(`No port information for camera ${cameraId}`);
        return false;
      }
      
      // Execute the command with retry logic
      const stdout = await cameraCoreService.executeWithRetry(
        `gphoto2 --port=${portInfo} --summary`,
        3,
        `Camera ${cameraId} response check`
      );
      
      // Check if we got a valid response
      const isResponding = stdout.includes('Camera summary') || stdout.includes('Model');
      console.log(`Camera ${cameraId} responsive: ${isResponding}`);
      
      return isResponding;
    } catch (error) {
      console.error(`Error checking camera ${cameraId} response:`, error);
      return false;
    }
  }
}

// Export a singleton instance
export const cameraDetectionService = new CameraDetectionService();
