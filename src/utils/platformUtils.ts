
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
  
  // We'll consider we're not on Jetson if any of these conditions are true:
  // - API is unavailable (window.DEBUG_SETTINGS.apiServerError is true)
  // - Simulation mode is enabled (window.DEBUG_SETTINGS.simulateCameraConnection is true)
  // - localStorage has bypassApiCheck set to 'true'
  try {
    const bypassApiCheck = typeof window !== 'undefined' && localStorage.getItem('bypassApiCheck') === 'true';
    if (
      (typeof window !== 'undefined' && window.DEBUG_SETTINGS?.apiServerError) ||
      (typeof window !== 'undefined' && window.DEBUG_SETTINGS?.simulateCameraConnection) ||
      bypassApiCheck
    ) {
      console.log("Platform detection: Not on Jetson platform (simulation mode active)");
      return false;
    }
  } catch (e) {
    console.error("Error in platform detection:", e);
  }
  
  // Default to true for compatibility with existing code if no simulation indicators are found
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
