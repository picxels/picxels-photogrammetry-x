
import { toast } from "@/components/ui/use-toast";
import { isJetsonPlatform } from "../platformUtils";
import { DEBUG_SETTINGS } from "@/config/jetson.config";

/**
 * Checks if we should use fallback data instead of real AI models
 * This happens when:
 * 1. We're not on a Jetson platform
 * 2. We're in development mode and Jetson detection is not forced
 * 3. API is unavailable and we're in simulation mode
 */
export const shouldUseFallbackData = (): boolean => {
  // If we're forcing Jetson platform detection, don't use fallbacks
  if (DEBUG_SETTINGS?.forceJetsonPlatformDetection) {
    console.log("Fallback check: Not using fallbacks (Jetson detection forced)");
    return false;
  }
  
  // If we're simulating camera connection, we're likely not on Jetson
  if (DEBUG_SETTINGS?.simulateCameraConnection) {
    console.log("Fallback check: Using fallbacks (Camera simulation enabled)");
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
export const notifyFallbackMode = () => {
  toast({
    title: "Using Development Fallbacks",
    description: "Jetson platform not detected. Using sample data for development.",
    variant: "default"
  });
};
