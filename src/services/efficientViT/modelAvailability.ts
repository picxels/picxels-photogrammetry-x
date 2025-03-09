
import { JETSON_AI_MODELS, EFFICIENTVIT_CONFIG } from "@/config/jetsonAI.config";
import { executeCommand } from "@/utils/commandUtils";
import { isJetsonPlatform } from "@/utils/platformUtils";

/**
 * Check if EfficientViT model is available and enabled
 */
export const isEfficientViTAvailable = async (): Promise<boolean> => {
  if (!JETSON_AI_MODELS.efficientViT.enabled) {
    return false;
  }
  
  if (!isJetsonPlatform()) {
    console.log("EfficientViT is only available on Jetson platforms");
    return false;
  }
  
  try {
    // Check if model file exists
    const modelPath = JETSON_AI_MODELS.efficientViT.modelPath;
    const checkCommand = `ls ${modelPath}`;
    
    const result = await executeCommand(checkCommand);
    return result.includes(modelPath.split('/').pop() || '');
  } catch (error) {
    console.error("Error checking EfficientViT availability:", error);
    return false;
  }
};
