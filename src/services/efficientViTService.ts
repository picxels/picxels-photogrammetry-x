
import { CapturedImage } from "@/types";
import { toast } from "@/components/ui/use-toast";
import { JETSON_AI_MODELS, AI_HARDWARE_CONFIG, AI_DEBUG_OPTIONS } from "@/config/jetsonAI.config";
import { executeCommand } from "@/utils/commandUtils";
import { isJetsonPlatform } from "@/utils/platformUtils";

/**
 * Interface for segmentation results
 */
export interface SegmentationResult {
  maskPath: string;
  confidence: number;
  processingTime: number;
  success: boolean;
}

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

/**
 * Generate background mask using EfficientViT
 */
export const generateMaskWithEfficientViT = async (
  image: CapturedImage
): Promise<SegmentationResult> => {
  console.log(`Generating mask with EfficientViT for image: ${image.path}`);
  
  if (!(await isEfficientViTAvailable())) {
    throw new Error("EfficientViT model is not available");
  }
  
  try {
    const startTime = performance.now();
    
    // Set up paths
    const outputDir = `/tmp/picxels/masks`;
    const maskFilename = `${image.id}_mask.png`;
    const maskPath = `${outputDir}/${maskFilename}`;
    
    // Ensure output directory exists
    await executeCommand(`mkdir -p ${outputDir}`);
    
    // Build the command to run EfficientViT
    // In production, this would use TensorRT to run the model locally
    // For this implementation, we're using a script that would be installed on the Jetson
    const command = `python3 /opt/picxels/scripts/run_efficientvit.py \
      --model ${JETSON_AI_MODELS.efficientViT.modelPath} \
      --input "${image.path}" \
      --output "${maskPath}" \
      --threshold ${JETSON_AI_MODELS.efficientViT.confidenceThreshold} \
      --input_size ${JETSON_AI_MODELS.efficientViT.inputSize} \
      --batch_size ${AI_HARDWARE_CONFIG.maxBatchSize} \
      --precision ${AI_HARDWARE_CONFIG.precisionMode} \
      ${AI_HARDWARE_CONFIG.useDLA ? '--use_dla' : ''} \
      ${AI_DEBUG_OPTIONS.visualizeSegmentation ? '--visualize' : ''}`;
    
    // Execute the command
    await executeCommand(command);
    
    // Calculate processing time
    const endTime = performance.now();
    const processingTime = endTime - startTime;
    
    // Log inference time if enabled
    if (AI_DEBUG_OPTIONS.logInferenceTime) {
      console.log(`EfficientViT inference time: ${processingTime.toFixed(2)}ms`);
    }
    
    // Check if mask file was created
    const checkResult = await executeCommand(`ls ${maskPath}`);
    const success = checkResult.includes(maskFilename);
    
    if (success) {
      toast({
        title: "Enhanced Segmentation Complete",
        description: `Background removed with EfficientViT (${processingTime.toFixed(0)}ms)`
      });
      
      return {
        maskPath,
        confidence: 0.95, // Placeholder, actual confidence would come from the model
        processingTime,
        success: true
      };
    } else {
      throw new Error("Mask file was not created");
    }
  } catch (error) {
    console.error("Error generating mask with EfficientViT:", error);
    
    toast({
      title: "Segmentation Failed",
      description: "Could not generate mask with EfficientViT",
      variant: "destructive"
    });
    
    return {
      maskPath: "",
      confidence: 0,
      processingTime: 0,
      success: false
    };
  }
};

/**
 * Apply the generated mask to an image
 */
export const applyMask = async (
  image: CapturedImage,
  maskPath: string
): Promise<CapturedImage> => {
  try {
    // Create output path for masked image
    const outputDir = `/tmp/picxels/masked`;
    const maskedFilename = `${image.id}_masked.jpg`;
    const maskedPath = `${outputDir}/${maskedFilename}`;
    
    // Ensure output directory exists
    await executeCommand(`mkdir -p ${outputDir}`);
    
    // Apply mask to image using ImageMagick
    const command = `convert "${image.path}" "${maskPath}" -alpha off -compose CopyOpacity -composite "${maskedPath}"`;
    await executeCommand(command);
    
    // Return updated image information
    return {
      ...image,
      hasMask: true,
      maskedPath: maskedPath
    };
  } catch (error) {
    console.error("Error applying mask:", error);
    return image;
  }
};
