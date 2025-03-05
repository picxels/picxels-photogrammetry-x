
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
    // Check if the API endpoint is actually available first with a HEAD request
    try {
      const headCheck = await fetch('/api/health', { method: 'HEAD' });
      if (!headCheck.ok) {
        console.warn('API health check failed, endpoints may not be available');
      }
    } catch (error) {
      console.warn('API health check failed:', error);
    }
    
    // In a demo/development environment, we can return mock data instead of failing
    if (DEBUG_SETTINGS.simulateCameraConnection) {
      console.log('Simulating command execution in development mode');
      if (command.includes('--auto-detect')) {
        return 'Model                          Port\n' +
               '------------------------------------------------------\n' +
               'Canon EOS 550D                 usb:001,004\n';
      } else if (command.includes('which gphoto2')) {
        return '/usr/bin/gphoto2';
      } else if (command.includes('--summary') || command.includes('lsusb')) {
        return 'Camera detected';
      }
      return ''; // Empty string for other commands
    }
      
    // In a browser context, we need to send the command to a backend API
    try {
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
      
      // If API is not available but we have simulation enabled, return mock data
      if (DEBUG_SETTINGS.simulateCameraConnection) {
        console.log("API failed but simulation enabled, returning mock data");
        if (command.includes('--auto-detect')) {
          return 'Model                          Port\n' +
                 '------------------------------------------------------\n' +
                 'Canon EOS 550D                 usb:001,004\n';
        } else if (command.includes('which gphoto2')) {
          return '/usr/bin/gphoto2';
        } else if (command.includes('--summary') || command.includes('lsusb')) {
          return 'Camera detected';
        }
        return ''; // Empty string for other commands
      }
      
      // Show toast error
      toast({
        title: "Command Execution Failed",
        description: "Failed to execute camera command. Check the API endpoint and connections.",
        variant: "destructive"
      });
      
      // We're throwing a controlled error string that other parts of the code can handle
      throw new Error(`Command execution failed: ${error.message}`);
    }
  } catch (error) {
    console.error(`Error executing command '${command}':`, error);
    
    // Show more informative toast error
    toast({
      title: "Command Execution Failed",
      description: "Failed to execute camera command. Check the API endpoint and connections.",
      variant: "destructive"
    });
    
    // We're throwing a controlled error string that other parts of the code can handle
    throw new Error(`Command execution failed: ${error.message}`);
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
