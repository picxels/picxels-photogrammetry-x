
import { EFFICIENTVIT_CONFIG, JETSON_AI_MODELS } from "@/config/jetsonAI.config";
import { executeCommand } from "@/utils/commandUtils";

/**
 * Resize and prepare image for EfficientViT processing
 */
export const prepareImageForSegmentation = async (
  imagePath: string
): Promise<string> => {
  try {
    // Create a resized version of the image for segmentation
    const outputDir = `${EFFICIENTVIT_CONFIG.tempDir}/resized`;
    const resizedFilename = `${Date.now()}_resized.jpg`;
    const resizedPath = `${outputDir}/${resizedFilename}`;
    
    // Ensure output directory exists
    await executeCommand(`mkdir -p ${outputDir}`);
    
    // Resize image to the input size specified in config (1024x1024)
    const inputSize = JETSON_AI_MODELS.efficientViT.inputSize;
    await executeCommand(`convert "${imagePath}" -resize ${inputSize}x${inputSize}\\> "${resizedPath}"`);
    
    console.log(`Image resized to ${inputSize}px for segmentation: ${resizedPath}`);
    return resizedPath;
  } catch (error) {
    console.error("Error preparing image for segmentation:", error);
    throw error;
  }
};
