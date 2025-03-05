
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
    usingSimulation: true
  };
  console.log("Command execution debug info:", debugInfo);
  
  toast({
    title: "Simulation Mode Active",
    description: "Running in simulation mode - using mock camera data",
    variant: "default"
  });
  
  // Always use mock data for preview environment
  return getMockCommandResponse(command);
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
