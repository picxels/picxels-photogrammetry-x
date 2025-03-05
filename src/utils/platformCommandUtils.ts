
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
    command: command,
    usingSimulation: false
  };
  console.log("Command execution debug info:", debugInfo);
  
  try {
    // Attempt to execute the command through the API
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
    console.error("Error executing command via API:", error);
    
    // If we're in a development environment, show toast and use mock data
    if (window.DEBUG_SETTINGS?.simulateCameraConnection || !isJetsonPlatform()) {
      console.warn("Falling back to simulation for command:", command);
      
      toast({
        title: "API Connection Error",
        description: "Using simulation mode as fallback. API server on port 3001 is not responding.",
        variant: "destructive"
      });
      
      // Return mock data as fallback
      return getMockCommandResponse(command);
    }
    
    // In production, we want to fail if the API is unreachable
    throw new Error(`Failed to execute command: ${error.message}`);
  }
};

/**
 * Get mock responses for various commands
 */
const getMockCommandResponse = (command: string): string => {
  console.log(`Providing mock data for command: ${command}`);
  
  if (command.includes('--auto-detect')) {
    return 'Model                          Port\n' +
           '------------------------------------------------------\n' +
           'Canon EOS 550D                 usb:001,004\n' +
           'Canon EOS 600D                 usb:001,005\n';
  } else if (command.includes('which gphoto2')) {
    return '/usr/bin/gphoto2';
  } else if (command.includes('--summary') || command.includes('lsusb')) {
    return 'Camera detected';
  } else if (command.includes('--capture-image-and-download')) {
    return 'New file is in location /tmp/capt0001.jpg';
  } else if (command.includes('pkill')) {
    return '';
  } else if (command.includes('--set-config')) {
    return 'Property set.';
  }
  
  // Default response for unmatched commands
  return '';
};

/**
 * This function is kept for API compatibility, but now throws an error 
 * since we no longer want to simulate commands
 */
export const executeDevCommand = async (command: string): Promise<string> => {
  console.log(`Development mode simulation is disabled. Command was: ${command}`);
  throw new Error("Development mode simulation is disabled. Use real camera connections.");
};
