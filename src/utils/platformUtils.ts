
import { DEBUG_SETTINGS } from "@/config/jetson.config";

/**
 * Check if running on Jetson platform
 */
export const isJetsonPlatform = () => {
  const isLinux = navigator.userAgent.includes('Linux');
  const hasJetsonEnv = typeof process !== 'undefined' && 
                      (process.env?.JETSON_PLATFORM === 'true' || 
                       process.env?.TEGRA_PLATFORM === 'true');
  const isTegra = typeof navigator !== 'undefined' && 
                 navigator.userAgent.includes('Tegra');
  
  console.log("Platform detection:", { isLinux, hasJetsonEnv, isTegra });
  
  if (!isDevelopmentMode() && isLinux) {
    console.log("Production mode on Linux, assuming Jetson platform");
    return true;
  }
  
  return isLinux && (hasJetsonEnv || isTegra);
};

/**
 * Check if we're in development or production mode
 */
export const isDevelopmentMode = () => {
  return import.meta.env.DEV;
};
