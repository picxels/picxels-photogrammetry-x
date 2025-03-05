
import { executeCommand } from "@/utils/commandUtils";
import { validateCommand } from "@/utils/commandValidationUtils";
import { CameraDevice } from "@/types";
import { DEBUG_SETTINGS } from "@/config/jetson.config";
import { toast } from "@/components/ui/use-toast";
import { parseGphoto2Output } from "@/utils/cameraParsingUtils";

/**
 * Camera Service - provides an abstraction layer for interacting with cameras
 * regardless of the platform (browser or Jetson)
 */
class CameraService {
  /**
   * Detect connected cameras using gphoto2
   */
  async detectCameras(): Promise<{ model: string, port: string }[]> {
    console.log("CameraService: Detecting cameras");
    
    try {
      // First release the camera from any blocking processes
      await this.releaseCamera();
      
      // Execute the auto-detect command with retries
      let attempts = 0;
      const maxAttempts = 3;
      let stdout = '';
      let success = false;
      
      while (attempts < maxAttempts && !success) {
        try {
          console.log(`Camera detection attempt ${attempts + 1}`);
          // Release camera before each attempt
          await this.releaseCamera();
          // Small delay to ensure camera is properly released
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          stdout = await executeCommand('gphoto2 --auto-detect');
          console.log("Raw auto-detect output:", stdout);
          
          if (stdout && (stdout.includes('Model') || stdout.includes('Canon'))) {
            success = true;
            console.log("Successful camera detection");
          } else {
            console.log(`Camera detection attempt ${attempts + 1} failed, output:`, stdout);
          }
        } catch (err) {
          console.error(`Camera detection error (attempt ${attempts + 1}):`, err);
        }
        attempts++;
        
        if (attempts < maxAttempts && !success) {
          console.log(`Waiting before retry ${attempts}`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
      
      // If we didn't get a valid response, check manually if we can see the camera in USB
      if (!success) {
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
            await this.releaseCamera();
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Try one more time after aggressive release
            stdout = await executeCommand('gphoto2 --auto-detect');
            console.log("After release, gphoto2 output:", stdout);
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
   * Release camera from blocking processes
   */
  async releaseCamera(): Promise<void> {
    console.log("CameraService: Releasing camera from blocking processes");
    
    try {
      // Kill any processes that might lock the camera
      await executeCommand("pkill -f gvfsd-gphoto2 || true");
      await executeCommand("pkill -f gvfsd || true");
      await executeCommand("pkill -f gvfs-gphoto2-volume-monitor || true");
      console.log("Camera released successfully");
    } catch (error) {
      console.warn("Error releasing camera:", error);
      // Continue even if release fails - don't throw
    }
  }
  
  /**
   * Check if a specific camera is physically connected and responsive
   */
  async isCameraResponding(cameraId: string, portInfo?: string): Promise<boolean> {
    try {
      console.log(`CameraService: Checking if camera ${cameraId} is responding on port ${portInfo || 'unknown'}`);
      
      if (!portInfo) {
        console.error(`No port information for camera ${cameraId}`);
        return false;
      }
      
      // First release the camera
      await this.releaseCamera();
      
      let attempts = 0;
      const maxAttempts = 3;
      let isResponding = false;
      
      while (attempts < maxAttempts && !isResponding) {
        try {
          console.log(`Executing gphoto2 --port=${portInfo} --summary (attempt ${attempts + 1})`);
          const stdout = await executeCommand(`gphoto2 --port=${portInfo} --summary`);
          
          if (stdout.includes('Camera summary') || stdout.includes('Model')) {
            isResponding = true;
            console.log(`Camera ${cameraId} responded successfully`);
            break;
          } else {
            console.log(`Camera ${cameraId} response check unsuccessful, output:`, stdout);
          }
        } catch (err) {
          console.error(`Camera response check error (attempt ${attempts + 1}):`, err);
        }
        attempts++;
        
        if (attempts < maxAttempts && !isResponding) {
          console.log(`Waiting before retry ${attempts}`);
          // Release camera between attempts
          await this.releaseCamera();
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
      
      console.log(`Camera ${cameraId} responsive: ${isResponding}`);
      return isResponding;
    } catch (error) {
      console.error(`Error checking camera ${cameraId} response:`, error);
      return false;
    }
  }
  
  /**
   * Trigger camera autofocus
   */
  async triggerAutofocus(port?: string): Promise<void> {
    console.log("CameraService: Triggering camera autofocus");
    
    try {
      const portParam = port ? `--port=${port}` : '';
      await executeCommand(`gphoto2 ${portParam} --set-config autofocusdrive=1`);
      // Wait for autofocus to complete
      await new Promise(resolve => setTimeout(resolve, 3000));
      console.log("Autofocus completed");
    } catch (error) {
      console.error("Error triggering autofocus:", error);
      throw error;
    }
  }
  
  /**
   * Set image format to JPEG for capture
   */
  async setImageFormatToJpeg(port?: string): Promise<void> {
    console.log("CameraService: Setting image format to JPEG");
    
    try {
      const portParam = port ? `--port=${port}` : '';
      await executeCommand(`gphoto2 ${portParam} --set-config imageformat=2`);
      console.log("Image format set to JPEG");
    } catch (error) {
      console.error("Error setting image format:", error);
      // Continue even if this fails
    }
  }
  
  /**
   * Capture an image from a specific camera
   */
  async captureImage(portInfo: string, outputPath: string): Promise<string> {
    console.log(`CameraService: Capturing image on port ${portInfo} to ${outputPath}`);
    
    // Release camera to ensure no other process is using it
    await this.releaseCamera();
    
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
  
  /**
   * Get camera summary information
   */
  async getCameraSummary(portInfo: string): Promise<string> {
    console.log(`CameraService: Getting camera summary for port ${portInfo}`);
    
    try {
      const stdout = await executeCommand(`gphoto2 --port=${portInfo} --summary`);
      return stdout;
    } catch (error) {
      console.error("Error getting camera summary:", error);
      throw error;
    }
  }
  
  /**
   * Get camera configuration
   */
  async getCameraConfig(portInfo: string): Promise<string> {
    console.log(`CameraService: Getting camera config for port ${portInfo}`);
    
    try {
      const stdout = await executeCommand(`gphoto2 --port=${portInfo} --list-config`);
      return stdout;
    } catch (error) {
      console.error("Error getting camera config:", error);
      throw error;
    }
  }
  
  /**
   * Get available camera settings for a specific configuration
   */
  async getConfigOptions(portInfo: string, configName: string): Promise<string[]> {
    console.log(`CameraService: Getting config options for ${configName} on port ${portInfo}`);
    
    try {
      const stdout = await executeCommand(`gphoto2 --port=${portInfo} --get-config ${configName}`);
      
      // Parse the output to extract the available choices
      const choices: string[] = [];
      const lines = stdout.split('\n');
      
      let inChoicesSection = false;
      for (const line of lines) {
        if (line.includes('Choice:')) {
          inChoicesSection = true;
          const choiceParts = line.split(' ');
          if (choiceParts.length >= 4) {
            choices.push(choiceParts.slice(3).join(' '));
          }
        } else if (inChoicesSection && !line.includes('Choice:')) {
          inChoicesSection = false;
        }
      }
      
      return choices;
    } catch (error) {
      console.error(`Error getting config options for ${configName}:`, error);
      return [];
    }
  }
  
  /**
   * Set a specific camera configuration
   */
  async setConfig(portInfo: string, configName: string, value: string | number): Promise<void> {
    console.log(`CameraService: Setting ${configName}=${value} on port ${portInfo}`);
    
    try {
      await executeCommand(`gphoto2 --port=${portInfo} --set-config ${configName}=${value}`);
    } catch (error) {
      console.error(`Error setting ${configName}:`, error);
      throw error;
    }
  }
}

// Export a singleton instance
export const cameraService = new CameraService();
