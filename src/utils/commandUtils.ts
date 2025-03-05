
import { isJetsonPlatform, isDevelopmentMode } from "./platformUtils";
import { executeJetsonCommand } from "./platformCommandUtils";
import { validateCommand, sanitizeCommand } from "./commandValidationUtils";
import { toast } from "@/components/ui/use-toast";
import { cameraService } from "@/services/cameraService";

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
  
  try {
    return await executeJetsonCommand(sanitizedCommand);
  } catch (error) {
    console.error(`Error executing command '${sanitizedCommand}':`, error);
    
    toast({
      title: "Command Failed",
      description: "Failed to execute camera command. Check connections and try again.",
      variant: "destructive"
    });
    
    throw error;
  }
};

/**
 * Release camera resources - based on Python script's release_camera()
 * This is important to avoid conflict with other processes
 */
export const releaseCamera = async (): Promise<void> => {
  return cameraService.releaseCamera();
};

/**
 * Trigger camera autofocus - based on Python script's autofocus()
 */
export const triggerAutofocus = async (port?: string): Promise<void> => {
  return cameraService.triggerAutofocus(port);
};

/**
 * Set image format to JPEG for capture
 */
export const setImageFormatToJpeg = async (port?: string): Promise<void> => {
  return cameraService.setImageFormatToJpeg(port);
};

