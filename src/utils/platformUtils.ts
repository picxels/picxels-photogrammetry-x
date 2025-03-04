
import { DEBUG_SETTINGS } from "@/config/jetson.config";

/**
 * Check if running on Jetson platform
 */
export const isJetsonPlatform = () => {
  // Check for Linux in user agent
  const isLinux = navigator.userAgent.includes('Linux');
  
  // Check for specific environment variables that would be present on Jetson
  const hasJetsonEnv = typeof window !== 'undefined' && 
                      (window?.process?.env?.JETSON_PLATFORM === 'true' || 
                       window?.process?.env?.TEGRA_PLATFORM === 'true');
  
  // Check for Tegra in user agent (Jetson's SoC)
  const isTegra = typeof navigator !== 'undefined' && 
                 navigator.userAgent.includes('Tegra');
  
  // Force detection on specific environments like the Jetson
  const forceDetection = DEBUG_SETTINGS.forceJetsonPlatformDetection;
  
  console.log("Platform detection:", { isLinux, hasJetsonEnv, isTegra, forceDetection });
  
  // Always return false in development mode unless explicitly forced
  if (isDevelopmentMode() && !forceDetection) {
    console.log("Development mode detected, not treating as Jetson platform");
    return false;
  }
  
  // In production, force Jetson detection based on config
  if (forceDetection) {
    console.log("Force detecting as Jetson platform via config");
    return true;
  }
  
  // In production on Linux, assume it's a Jetson platform
  if (!isDevelopmentMode() && isLinux) {
    console.log("Production mode on Linux, assuming Jetson platform");
    return true;
  }
  
  return (isLinux && (hasJetsonEnv || isTegra));
};

/**
 * Check if we're in development or production mode
 */
export const isDevelopmentMode = () => {
  return import.meta.env.DEV;
};
