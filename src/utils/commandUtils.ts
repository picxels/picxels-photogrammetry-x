
import { isJetsonPlatform, isDevelopmentMode } from "./platformUtils";
import { executeJetsonCommand, executeDevCommand } from "./platformCommandUtils";
import { validateCommand, sanitizeCommand } from "./commandValidationUtils";

/**
 * Executes a shell command on the appropriate platform
 * This is critical for interacting with gphoto2
 */
export const executeCommand = async (command: string): Promise<string> => {
  console.log(`Executing command: ${command}`);
  
  // Validate the command for security
  if (!validateCommand(command)) {
    throw new Error(`Command not allowed: ${command}`);
  }
  
  // Sanitize the command to prevent injection
  const sanitizedCommand = sanitizeCommand(command);
  
  if (isJetsonPlatform() || !isDevelopmentMode()) {
    try {
      return await executeJetsonCommand(sanitizedCommand);
    } catch (error) {
      console.error(`Error executing command '${sanitizedCommand}':`, error);
      throw error;
    }
  } else {
    // Development mode simulation
    return executeDevCommand(sanitizedCommand);
  }
};

/**
 * Release camera resources - based on Python script's release_camera()
 * This is important to avoid conflict with other processes
 */
export const releaseCamera = async (): Promise<void> => {
  console.log("Releasing camera from blocking processes...");
  
  if (isJetsonPlatform() || !isDevelopmentMode()) {
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
};

/**
 * Trigger camera autofocus - based on Python script's autofocus()
 */
export const triggerAutofocus = async (port?: string): Promise<void> => {
  console.log("Triggering camera autofocus...");
  
  if (isJetsonPlatform() || !isDevelopmentMode()) {
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
};

/**
 * Set image format to JPEG for capture
 */
export const setImageFormatToJpeg = async (port?: string): Promise<void> => {
  console.log("Setting image format to JPEG...");
  
  if (isJetsonPlatform() || !isDevelopmentMode()) {
    try {
      const portParam = port ? `--port=${port}` : '';
      await executeCommand(`gphoto2 ${portParam} --set-config imageformat=2`);
      console.log("Image format set to JPEG");
    } catch (error) {
      console.error("Error setting image format:", error);
      // Continue even if this fails
    }
  }
};
