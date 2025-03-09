
import { toast } from "@/components/ui/use-toast";
import { isJetsonPlatform, shouldUseSimulationMode } from "../platformUtils";
import { DEBUG_SETTINGS } from "@/config/jetson.config";

/**
 * Checks if we should use fallback data instead of real AI models
 * This happens when:
 * 1. We're not on a Jetson platform
 * 2. We're in development mode and Jetson detection is not forced
 * 3. API is unavailable or returns errors and we're in simulation mode
 */
export const shouldUseFallbackData = (): boolean => {
  // Use the centralized simulation mode check
  if (shouldUseSimulationMode()) {
    console.log("Fallback check: Using fallbacks (Simulation mode active)");
    return true;
  }
  
  // If we're forcing Jetson platform detection and not in simulation mode, don't use fallbacks
  if (DEBUG_SETTINGS?.forceJetsonPlatformDetection && !shouldUseSimulationMode()) {
    console.log("Fallback check: Not using fallbacks (Jetson detection forced)");
    return false;
  }
  
  // Check if there's a global API error flag set
  if (typeof window !== 'undefined' && window.DEBUG_SETTINGS?.apiServerError) {
    console.log("Fallback check: Using fallbacks (API server error detected)");
    return true;
  }
  
  // Check if we're on a Jetson platform
  const onJetson = isJetsonPlatform();
  if (!onJetson) {
    console.log("Fallback check: Using fallbacks (Not on Jetson platform)");
    return true;
  }
  
  // Default to not using fallbacks
  console.log("Fallback check: Not using fallbacks (On Jetson platform)");
  return false;
};

/**
 * Generates a random number between min and max
 */
export const getRandomNumber = (min: number, max: number): number => {
  return Math.random() * (max - min) + min;
};

/**
 * Generates a random integer between min and max (inclusive)
 */
export const getRandomInt = (min: number, max: number): number => {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

/**
 * Shows a toast notification about using fallback data
 */
export const notifyFallbackMode = (reason?: string) => {
  const description = reason || "API server is unavailable. Using simulation mode for development.";
  
  toast({
    title: "Using Simulation Mode",
    description,
    variant: "default"
  });
};

/**
 * Returns a simple fallback mock for a command response
 */
export const getFallbackCommandResponse = (command: string): string => {
  console.log(`Providing fallback response for command: ${command}`);
  
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
  } else if (command.includes('mkdir -p')) {
    return '';
  } else if (command.includes('echo') && command.includes('sessions.db')) {
    return '';
  }
  
  // Default response for unmatched commands
  return 'Command executed successfully (simulation mode)';
};
