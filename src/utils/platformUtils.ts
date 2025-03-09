import { DEBUG_SETTINGS } from "@/config/jetson.config";

/**
 * Detects if we're running on the Jetson platform by checking:
 * 1. If forced via DEBUG_SETTINGS
 * 2. If running on Linux with specific Jetson hardware indicators
 */
export const isJetsonPlatform = () => {
  // Check if we're forcing Jetson detection via DEBUG settings
  if (DEBUG_SETTINGS?.forceJetsonPlatformDetection) {
    console.log("Platform detection: Using real Jetson platform (forced via DEBUG_SETTINGS)");
    return true;
  }
  
  // Check for simulation indicators - any of these overrides will disable Jetson detection
  const bypassApiCheck = typeof window !== 'undefined' && localStorage.getItem('bypassApiCheck') === 'true';
  
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
  
  try {
    // Real hardware detection - check for API availability
    const apiAvailable = typeof window !== 'undefined' && 
      window.localStorage.getItem('apiAvailable') === 'true';
    
    // If API is available, we're likely on real Jetson hardware
    if (apiAvailable) {
      console.log("Platform detection: On Jetson platform (API available)");
      return true;
    }
  } catch (e) {
    console.error("Error in platform detection:", e);
  }
  
  // Default to false for safety if we can't confirm Jetson platform
  console.log("Platform detection: Defaulting to non-Jetson platform");
  return false;
};

/**
 * Check if we're in development or production mode
 */
export const isDevelopmentMode = () => {
  return process.env.NODE_ENV === 'development';
};

/**
 * Check if simulation mode should be used
 * This is a convenient helper that centralizes the logic
 */
export const shouldUseSimulationMode = () => {
  // Return true ONLY if we're explicitly in simulation mode or API is unavailable
  const bypassApiCheck = typeof window !== 'undefined' && localStorage.getItem('bypassApiCheck') === 'true';
  const apiAvailable = typeof window !== 'undefined' && localStorage.getItem('apiAvailable') === 'true';
  
  // If API is available and we're not forcing simulation, don't use simulation
  if (apiAvailable && !bypassApiCheck) {
    return false;
  }
  
  // Otherwise, check for any simulation indicators
  return (
    bypassApiCheck ||
    !apiAvailable ||
    DEBUG_SETTINGS.simulateCameraConnection ||
    DEBUG_SETTINGS.apiServerError ||
    (typeof window !== 'undefined' && window.DEBUG_SETTINGS?.apiServerError) ||
    (typeof window !== 'undefined' && window.DEBUG_SETTINGS?.simulateCameraConnection)
  );
};
