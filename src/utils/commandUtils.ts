
import { isJetsonPlatform, isDevelopmentMode } from "./platformUtils";
import { DEBUG_SETTINGS } from "@/config/jetson.config";
import { toast } from "@/components/ui/use-toast";

/**
 * Executes a shell command on the Jetson platform
 * This is critical for interacting with gphoto2
 */
export const executeCommand = async (command: string): Promise<string> => {
  console.log(`Executing command: ${command}`);
  
  if (isJetsonPlatform() || !isDevelopmentMode()) {
    try {
      console.log("Executing via API endpoint on Jetson");
      
      // Add direct debugging information
      const debugInfo = {
        isJetson: isJetsonPlatform(),
        isDev: isDevelopmentMode(),
        command: command
      };
      console.log("Command execution debug info:", debugInfo);
      
      const response = await fetch('/api/execute-command', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ command }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Command execution failed (${response.status}): ${errorText}`);
        toast({
          title: "Command Execution Failed",
          description: `Failed to execute: ${command.substring(0, 30)}...`,
          variant: "destructive"
        });
        throw new Error(`Command execution failed: ${command} (${response.status}): ${errorText}`);
      }
      
      const data = await response.json();
      console.log(`Command result:`, data);
      
      // If we get an empty response but the command should return data
      if (command.includes('--auto-detect') && (!data.stdout || data.stdout.trim() === '')) {
        console.warn("Empty response for auto-detect, possible issue with command execution");
      }
      
      return data.stdout || '';
    } catch (error) {
      console.error(`Error executing command '${command}':`, error);
      toast({
        title: "Command Error",
        description: "Error communicating with camera. Check connections.",
        variant: "destructive"
      });
      throw error;
    }
  } else {
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
    
    return 'Command executed successfully';
  }
};
