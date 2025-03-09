import { executeCommand, releaseCamera, triggerAutofocus, setImageFormatToJpeg } from "@/utils/commandUtils";
import { parseGphoto2Output } from "@/utils/cameraParsingUtils";
import { toast } from "@/components/ui/use-toast";

/**
 * Camera Service - provides an abstraction layer for interacting with cameras
 * regardless of the platform (browser or Jetson)
 */
class CameraService {
  /**
   * Release camera from blocking processes
   */
  async releaseCamera(): Promise<void> {
    return releaseCamera();
  }

  /**
   * Detect connected cameras using gphoto2
   */
  async detectCameras(): Promise<{ model: string, port: string }[]> {
    console.log("CameraService: Detecting cameras");

    try {
      // First release the camera from any blocking processes
      await this.releaseCamera();

      // Execute the auto-detect command with retries
      const stdout = await this.executeWithRetry(
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
            await this.releaseCamera();
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
      console.log(`CameraService: Checking if camera ${cameraId} is responding on port ${portInfo || 'unknown'}`);

      if (!portInfo) {
        console.error(`No port information for camera ${cameraId}`);
        return false;
      }

      // Execute the command with retry logic
      const stdout = await this.executeWithRetry(
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

  /**
   * Trigger camera autofocus
   */
  async triggerAutofocus(port?: string): Promise<void> {
    return triggerAutofocus(port);
  }

  /**
   * Set image format to JPEG for capture
   */
  async setImageFormatToJpeg(port?: string): Promise<void> {
    return setImageFormatToJpeg(port);
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
   * Execute a command with camera release and retry logic
   */
  async executeWithRetry(command: string, maxAttempts = 3, description: string): Promise<string> {
    console.log(`CameraService: ${description} (will try up to ${maxAttempts} times)`);

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
export const cameraService = new CameraService();
