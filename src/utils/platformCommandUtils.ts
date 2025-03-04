
import { isJetsonPlatform, isDevelopmentMode } from "./platformUtils";
import { DEBUG_SETTINGS } from "@/config/jetson.config";
import { toast } from "@/components/ui/use-toast";

/**
 * Execute a shell command on the Jetson platform
 */
export const executeJetsonCommand = async (command: string): Promise<string> => {
  console.log("Executing via API endpoint on Jetson");
  
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
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        const response = await fetch('/api/execute-command', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ command }),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          if (response.status === 404) {
            console.error("API endpoint not found. Make sure the server is running and the endpoint exists.");
            throw new Error(`API endpoint not found (404). Server might not be running.`);
          } else {
            const errorText = await response.text();
            throw new Error(`Command execution failed (${response.status}): ${errorText}`);
          }
        }
        
        const data = await response.json();
        console.log(`Command result:`, data);
        
        // Check for empty response in detection commands
        if (command.includes('--auto-detect') && (!data.stdout || data.stdout.trim() === '')) {
          console.warn("Empty response for auto-detect, retrying...");
          attempts++;
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        }
        
        return data.stdout || '';
      } catch (error) {
        lastError = error as Error;
        console.warn(`Attempt ${attempts + 1}/${maxAttempts} failed:`, error);
        attempts++;
        
        if (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
    
    // In development mode, fall back to simulated responses if the API endpoint is not available
    if (isDevelopmentMode() && lastError?.message?.includes("404")) {
      console.warn("API endpoint not available in development mode, using simulated responses");
      return executeDevCommand(command);
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
    if ((error as Error).message.includes("404")) {
      toast({
        title: "API Endpoint Not Found",
        description: "Camera communication API not available. Using simulated data.",
        variant: "destructive"
      });
      
      // Fall back to dev command in case of API unavailability
      if (isDevelopmentMode()) {
        return executeDevCommand(command);
      }
    } else {
      toast({
        title: "Command Error",
        description: "Error communicating with camera. Check connections.",
        variant: "destructive"
      });
    }
    
    throw error;
  }
};

/**
 * Simulate command execution in development mode
 */
export const executeDevCommand = async (command: string): Promise<string> => {
  console.log(`Simulating command execution in dev mode: ${command}`);
  
  if (command.includes('pkill') || command.includes('--set-config')) {
    return 'Command executed successfully';
  }
  
  if (command === 'gphoto2 --auto-detect') {
    if (DEBUG_SETTINGS.simulateBadConnection && Math.random() > 0.5) {
      return '';
    }
    return `
Model                          Port                                            
----------------------------------------------------------
Canon EOS 550D                 usb:001,007
Canon EOS 600D                 usb:001,009
`;
  }
  
  if (command.includes('--summary')) {
    if (DEBUG_SETTINGS.simulateBadConnection && Math.random() > 0.3) {
      throw new Error('Camera not responding');
    }
    return `
Camera summary:                                                                
Manufacturer: Canon Inc.
Model: Canon EOS 550D
  Version: 1.0.9
  Serial Number: 2147483647
  Vendor Extension ID: 0xb (1.0)
`;
  }
  
  if (command.includes('--capture-image-and-download')) {
    if (DEBUG_SETTINGS.simulateBadConnection && Math.random() > 0.7) {
      throw new Error('Camera capture failed');
    }
    return `
New file is in location /tmp/picxels/captures/img_001.jpg
`;
  }
  
  if (command === 'which gphoto2') {
    return '/usr/bin/gphoto2';
  }
  
  return 'Command executed successfully';
};
