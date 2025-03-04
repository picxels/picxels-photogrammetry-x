
import { DEBUG_SETTINGS } from "@/config/jetson.config";

/**
 * Maps camera model names to their standardized types
 * This is necessary because the same camera can have different names in different regions
 */
export const mapCameraModelToType = (modelName: string): string => {
  if (modelName.includes('550D')) {
    return 'T2i';
  }
  if (modelName.includes('600D')) {
    return 'T3i';
  }
  
  if (modelName.includes('T2i') || modelName.includes('Rebel T2i')) {
    return 'T2i';
  }
  if (modelName.includes('T3i') || modelName.includes('Rebel T3i')) {
    return 'T3i';
  }
  
  return modelName;
};
