
import { DEBUG_SETTINGS } from "@/config/jetson.config";

/**
 * Detects if we're running on the Jetson platform by checking:
 * 1. If forced via DEBUG_SETTINGS
 * 2. If API server is available 
 */
export const isJetsonPlatform = () => {
  // Check if we're forcing Jetson detection via DEBUG settings
  if (DEBUG_SETTINGS?.forceJetsonPlatformDetection) {
    console.log("Platform detection: Using real Jetson platform (forced via DEBUG_SETTINGS)");
    return true;
  }
  
  // Check for simulation indicators
  try {
    const bypassApiCheck = typeof window !== 'undefined' && localStorage.getItem('bypassApiCheck') === 'true';
    
    // Consider ANY of these conditions as indicating we're not on Jetson
    if (
      bypassApiCheck ||
      DEBUG_SETTINGS.simulateCameraConnection ||
      DEBUG_SETTINGS.apiServerError ||
      (typeof window !== 'undefined' && window.DEBUG_SETTINGS?.apiServerError) ||
      (typeof window !== 'undefined' && window.DEBUG_SETTINGS?.simulateCameraConnection)
    ) {
      console.log("Platform detection: Not on Jetson platform (simulation mode active)");
      return false;
    }
  } catch (e) {
    console.error("Error in platform detection:", e);
    // If error occurs during check, assume we're not on Jetson for safety
    return false;
  }
  
  // Default to true only if no simulation indicators are found
  console.log("Platform detection: Assuming Jetson platform");
  return true;
};

/**
 * Check if we're in development or production mode
 */
export const isDevelopmentMode = () => {
  // In a real environment, we should detect this properly
  return process.env.NODE_ENV === 'development';
};

/**
 * Check if simulation mode should be used
 * This is a convenient helper that centralizes the logic
 */
export const shouldUseSimulationMode = () => {
  // Check localStorage directly for bypassApiCheck flag
  const bypassApiCheck = typeof window !== 'undefined' && localStorage.getItem('bypassApiCheck') === 'true';
  
  // If any of these are true, we should use simulation mode
  return (
    bypassApiCheck ||
    DEBUG_SETTINGS.simulateCameraConnection ||
    DEBUG_SETTINGS.apiServerError ||
    (typeof window !== 'undefined' && window.DEBUG_SETTINGS?.apiServerError) ||
    (typeof window !== 'undefined' && window.DEBUG_SETTINGS?.simulateCameraConnection)
  );
};
