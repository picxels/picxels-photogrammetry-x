
import { DEBUG_SETTINGS } from "@/config/jetson.config";

/**
 * Always return true since we're now running directly on the Jetson platform
 */
export const isJetsonPlatform = () => {
  console.log("Platform detection: Using real Jetson platform");
  return true;
};

/**
 * Check if we're in development or production mode
 * Now returns false so we always use real hardware
 */
export const isDevelopmentMode = () => {
  return false;
};
