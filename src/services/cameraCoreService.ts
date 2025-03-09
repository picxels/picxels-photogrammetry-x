
import { executeCommand } from "@/utils/commandUtils";

/**
 * Core Camera Service - provides basic camera operations
 */
class CameraCoreService {
  /**
   * Release camera from blocking processes
   */
  async releaseCamera(): Promise<void> {
    console.log("CameraCoreService: Releasing camera from blocking processes");
    
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
   * Execute a command with camera release and retry logic
   */
  async executeWithRetry(command: string, maxAttempts = 3, description: string): Promise<string> {
    console.log(`CameraCoreService: ${description} (will try up to ${maxAttempts} times)`);
    
    let attempts = 0;
    let success = false;
    let stdout = '';
    
    while (attempts < maxAttempts && !success) {
      try {
        console.log(`${description} attempt ${attempts + 1}`);
        // Release camera before each attempt
        await this.releaseCamera();
        // Small delay to ensure camera is properly released
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        stdout = await executeCommand(command);
        
        if (stdout) {
          success = true;
          console.log(`Successful ${description.toLowerCase()}`);
        } else {
          console.log(`${description} attempt ${attempts + 1} failed, output:`, stdout);
        }
      } catch (err) {
        console.error(`${description} error (attempt ${attempts + 1}):`, err);
      }
      attempts++;
      
      if (attempts < maxAttempts && !success) {
        console.log(`Waiting before retry ${attempts}`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    return stdout;
  }
}

// Export a singleton instance
export const cameraCoreService = new CameraCoreService();
