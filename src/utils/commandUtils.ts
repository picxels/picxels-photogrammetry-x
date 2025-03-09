
import { executeJetsonCommand } from './platformCommandUtils';

/**
 * Safely execute a command and return its output
 */
export const executeCommand = async (command: string): Promise<string> => {
  // Perform basic validation/sanitization
  if (!command || typeof command !== 'string') {
    throw new Error('Invalid command provided');
  }

  // Execute the command and return the output
  try {
    console.log(`Executing command: ${command}`);
    const stdout = await executeJetsonCommand(command);
    
    if (stdout.includes('stderr:')) {
      const stderrContent = stdout.split('stderr:')[1]?.trim();
      if (stderrContent) {
        console.warn(`Command produced stderr: ${stderrContent}`);
      }
    }
    
    return stdout;
  } catch (error) {
    console.error(`Command execution error:`, error);
    throw error;
  }
};

/**
 * Release camera from any blocking processes
 */
export const releaseCamera = async (): Promise<void> => {
  console.log("Releasing camera from blocking processes");
  
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
};

/**
 * Trigger camera autofocus
 */
export const triggerAutofocus = async (port?: string): Promise<void> => {
  console.log("Triggering camera autofocus");
  
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
};

/**
 * Set image format to JPEG for capture
 */
export const setImageFormatToJpeg = async (port?: string): Promise<void> => {
  console.log("Setting image format to JPEG");
  
  try {
    const portParam = port ? `--port=${port}` : '';
    await executeCommand(`gphoto2 ${portParam} --set-config imageformat=2`);
    console.log("Image format set to JPEG");
  } catch (error) {
    console.error("Error setting image format:", error);
    // Continue even if this fails
  }
};
