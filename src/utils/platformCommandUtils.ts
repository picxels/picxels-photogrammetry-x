
import { isJetsonPlatform, isDevelopmentMode } from "./platformUtils";
import { DEBUG_SETTINGS } from "@/config/jetson.config";
import { toast } from "@/components/ui/use-toast";
import { executeCommand as executeShellCommand } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(executeShellCommand);

/**
 * Execute a shell command on the Jetson platform
 */
export const executeJetsonCommand = async (command: string): Promise<string> => {
  console.log("Executing command:", command);
  
  // Add direct debugging information
  const debugInfo = {
    isJetson: isJetsonPlatform(),
    isDev: isDevelopmentMode(),
    command: command
  };
  console.log("Command execution debug info:", debugInfo);
  
  try {
    // Try multiple times with increasing timeouts
    let attempts = 0;
    const maxAttempts = 3;
    let lastError: Error | null = null;
    
    while (attempts < maxAttempts) {
      try {
        const timeout = 5000 + (attempts * 3000); // Increase timeout with each attempt
        
        // Call the Python script directly
        console.log("Executing Python command handler");
        const result = await execPromise(`python3 /path/to/your/script.py "${command.replace(/"/g, '\\"')}"`);
        console.log(`Command result:`, result);
        
        return result.stdout || '';
      } catch (error) {
        lastError = error as Error;
        console.warn(`Attempt ${attempts + 1}/${maxAttempts} failed:`, error);
        attempts++;
        
        if (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
    
    // If we reach here, all attempts failed
    if (lastError) {
      throw lastError;
    } else {
      throw new Error(`Command execution failed after ${maxAttempts} attempts`);
    }
  } catch (error) {
    console.error(`Error executing command '${command}':`, error);
    
    // Show more informative toast error
    toast({
      title: "Command Execution Failed",
      description: "Failed to execute camera command. Check the Python script and connections.",
      variant: "destructive"
    });
    
    throw error;
  }
};

/**
 * This function is kept for API compatibility, but now throws an error 
 * since we no longer want to simulate commands
 */
export const executeDevCommand = async (command: string): Promise<string> => {
  console.log(`Development mode simulation is disabled. Command was: ${command}`);
  throw new Error("Development mode simulation is disabled. Use real camera connections.");
};
