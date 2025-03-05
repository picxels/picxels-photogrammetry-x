
/**
 * Utility to execute shell commands
 * Note: This is a client-side wrapper around the server API
 */
export const executeCommand = async (command: string): Promise<string> => {
  console.log("Executing command via API:", command);
  
  try {
    const response = await fetch('/api/execute-command', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ command }),
    });
    
    if (!response.ok) {
      throw new Error(`API returned status: ${response.status}`);
    }
    
    const data = await response.json();
    return data.output || '';
  } catch (error) {
    console.error("Error executing command:", error);
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
