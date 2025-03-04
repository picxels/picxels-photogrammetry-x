
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

