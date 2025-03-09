
import { executeCommand } from "@/utils/commandUtils";
import { cameraCoreService } from "./cameraCoreService";

/**
 * Camera Configuration Service - handles camera settings and configuration
 */
class CameraConfigService {
  /**
   * Trigger camera autofocus
   */
  async triggerAutofocus(port?: string): Promise<void> {
    console.log("CameraConfigService: Triggering camera autofocus");
    
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
    console.log("CameraConfigService: Setting image format to JPEG");
    
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
   * Get camera summary information
   */
  async getCameraSummary(portInfo: string): Promise<string> {
    console.log(`CameraConfigService: Getting camera summary for port ${portInfo}`);
    
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
    console.log(`CameraConfigService: Getting camera config for port ${portInfo}`);
    
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
    console.log(`CameraConfigService: Getting config options for ${configName} on port ${portInfo}`);
    
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
    console.log(`CameraConfigService: Setting ${configName}=${value} on port ${portInfo}`);
    
    try {
      await executeCommand(`gphoto2 --port=${portInfo} --set-config ${configName}=${value}`);
    } catch (error) {
      console.error(`Error setting ${configName}:`, error);
      throw error;
    }
  }
}

// Export a singleton instance
export const cameraConfigService = new CameraConfigService();
