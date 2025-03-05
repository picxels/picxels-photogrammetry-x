
import { isJetsonPlatform, isDevelopmentMode } from "./platformUtils";
import { DEBUG_SETTINGS } from "@/config/jetson.config";
import { toast } from "@/components/ui/use-toast";

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
    // In a browser context, we need to send the command to a backend API
    // Instead of directly executing it with Node.js child_process
    const response = await fetch('/api/execute-command', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ command }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error (${response.status}): ${errorText}`);
    }
    
    const result = await response.json();
    console.log(`Command result:`, result);
    
    return result.output || '';
  } catch (error) {
    console.error(`Error executing command '${command}':`, error);
    
    // Show more informative toast error
    toast({
      title: "Command Execution Failed",
      description: "Failed to execute camera command. Check the API endpoint and connections.",
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
