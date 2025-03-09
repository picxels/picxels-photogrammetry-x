
import { executeCommand } from "@/utils/commandUtils";
import { cameraCoreService } from "./cameraCoreService";

/**
 * Camera Capture Service - handles image capture operations
 */
class CameraCaptureService {
  /**
   * Capture an image from a specific camera
   */
  async captureImage(portInfo: string, outputPath: string): Promise<string> {
    console.log(`CameraCaptureService: Capturing image on port ${portInfo} to ${outputPath}`);
    
    // Release camera to ensure no other process is using it
    await cameraCoreService.releaseCamera();
    
    // Capture the image
    const captureCommand = `gphoto2 --port=${portInfo} --capture-image-and-download --filename=${outputPath} --force-overwrite`;
    console.log(`Executing: ${captureCommand}`);
    
    const stdout = await executeCommand(captureCommand);
    console.log("Capture output:", stdout);
    
    if (!stdout.includes('New file') && !stdout.includes('Saving file')) {
      console.error("Capture did not produce a new file");
      throw new Error(`Failed to capture image: No file produced`);
    }
    
    return outputPath;
  }
}

// Export a singleton instance
export const cameraCaptureService = new CameraCaptureService();
