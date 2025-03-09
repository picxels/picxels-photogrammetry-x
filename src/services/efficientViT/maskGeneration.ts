
import { CapturedImage } from "@/types";
import { toast } from "@/components/ui/use-toast";
import { JETSON_AI_MODELS, AI_HARDWARE_CONFIG, AI_DEBUG_OPTIONS, EFFICIENTVIT_CONFIG } from "@/config/jetsonAI.config";
import { executeCommand } from "@/utils/commandUtils";
import { isEfficientViTAvailable } from "./modelAvailability";
import { installEfficientViT } from "./modelInstallation";
import { prepareImageForSegmentation } from "./imagePreparation";

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
 * Generate background mask using EfficientViT
 */
export const generateMaskWithEfficientViT = async (
  image: CapturedImage
): Promise<SegmentationResult> => {
  console.log(`Generating mask with EfficientViT for image: ${image.path}`);
  
  if (!(await isEfficientViTAvailable())) {
    // Try to install if not available
    const installed = await installEfficientViT();
    if (!installed) {
      throw new Error("EfficientViT model is not available and installation failed");
    }
  }
  
  try {
    const startTime = performance.now();
    
    // Prepare image for segmentation (resize to input size)
    const resizedImagePath = await prepareImageForSegmentation(image.path);
    
    // Set up paths
    const outputDir = `${EFFICIENTVIT_CONFIG.tempDir}/masks`;
    const maskFilename = `${image.id}_mask.png`;
    const maskPath = `${outputDir}/${maskFilename}`;
    
    // Ensure output directory exists
    await executeCommand(`mkdir -p ${outputDir}`);
    
    // Debug mode can return mock results for testing
    if (AI_DEBUG_OPTIONS.mockAIResponses) {
      await new Promise(resolve => setTimeout(resolve, AI_DEBUG_OPTIONS.mockResponseDelay));
      
      // Generate a simple white circle on black background as mock mask
      await executeCommand(
        `convert -size 1024x1024 xc:black -fill white -draw "circle 512,512 300,300" "${maskPath}"`
      );
      
      // Calculate processing time
      const endTime = performance.now();
      const processingTime = endTime - startTime;
      
      console.log("Generated mock mask for testing");
      
      return {
        maskPath,
        confidence: 0.95,
        processingTime,
        success: true
      };
    }
    
    // Build the command to run EfficientViT using the MIT-HAN-LAB implementation
    const command = `python3 ${EFFICIENTVIT_CONFIG.scriptPath} \
      --model ${JETSON_AI_MODELS.efficientViT.modelPath} \
      --variant ${EFFICIENTVIT_CONFIG.modelVariant} \
      --input "${resizedImagePath}" \
      --output "${maskPath}" \
      --threshold ${JETSON_AI_MODELS.efficientViT.confidenceThreshold} \
      --size ${JETSON_AI_MODELS.efficientViT.inputSize} \
      --mode ${EFFICIENTVIT_CONFIG.inferenceMode} \
      ${AI_DEBUG_OPTIONS.visualizeSegmentation ? '--visualize' : ''} \
      ${JETSON_AI_MODELS.efficientViT.useJetsonOptimization ? '--jetson_optimize' : ''}`;
    
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
    const checkResult = await executeCommand(`ls ${maskPath} 2>/dev/null || echo "not_found"`);
    const success = !checkResult.includes("not_found");
    
    if (success) {
      // Resize mask back to original size if needed
      if (JETSON_AI_MODELS.efficientViT.outputSize !== JETSON_AI_MODELS.efficientViT.inputSize) {
        const finalMaskPath = `${outputDir}/${image.id}_final_mask.png`;
        await executeCommand(
          `convert "${maskPath}" -resize ${JETSON_AI_MODELS.efficientViT.outputSize}x${JETSON_AI_MODELS.efficientViT.outputSize} "${finalMaskPath}"`
        );
        
        // Replace the original mask path with the resized one
        await executeCommand(`mv "${finalMaskPath}" "${maskPath}"`);
      }
      
      toast({
        title: "Enhanced Segmentation Complete",
        description: `Background removed with MIT-HAN-LAB EfficientViT (${processingTime.toFixed(0)}ms)`
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
      description: "Could not generate mask with EfficientViT. " + (error as Error).message,
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
