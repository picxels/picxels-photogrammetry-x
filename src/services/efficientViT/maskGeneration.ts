
import { EFFICIENTVIT_CONFIG, JETSON_AI_MODELS } from "@/config/jetsonAI.config";
import { executeCommand } from "@/utils/commandUtils";
import { toast } from "@/components/ui/use-toast";
import { prepareImageForSegmentation } from "./imagePreparation";

/**
 * Generate a foreground mask using EfficientViT
 */
export const generateMaskWithEfficientViT = async (
  imagePath: string
): Promise<string> => {
  try {
    // Prepare the image by resizing it
    const resizedImagePath = await prepareImageForSegmentation(imagePath);
    
    // Create output directory for masks
    const outputDir = `${EFFICIENTVIT_CONFIG.tempDir}/masks`;
    const maskFilename = `${Date.now()}_mask.png`;
    const maskPath = `${outputDir}/${maskFilename}`;
    
    // Ensure output directory exists
    await executeCommand(`mkdir -p ${outputDir}`);
    
    // Run EfficientViT model for segmentation
    const pythonScript = EFFICIENTVIT_CONFIG.pythonScriptPath;
    const modelPath = JETSON_AI_MODELS.efficientViT.modelPath;
    
    console.log(`Running EfficientViT segmentation on image: ${resizedImagePath}`);
    console.log(`Using model: ${modelPath}`);
    console.log(`Output mask will be saved to: ${maskPath}`);
    
    // Execute the segmentation command
    const segmentationCommand = `python3 ${pythonScript} --model ${modelPath} --input ${resizedImagePath} --output ${maskPath} --threshold ${EFFICIENTVIT_CONFIG.confidenceThreshold}`;
    
    const output = await executeCommand(segmentationCommand);
    console.log("Segmentation output:", output);
    
    // Verify mask file exists
    const checkCommand = `ls -la ${maskPath}`;
    const checkOutput = await executeCommand(checkCommand);
    
    if (!checkOutput.includes(maskFilename)) {
      console.error("Mask file not generated:", checkOutput);
      throw new Error("Failed to generate mask with EfficientViT");
    }
    
    // Create a public copy of the mask for web access
    const publicMaskPath = `/public/temp/masks/${maskFilename}`;
    await executeCommand(`mkdir -p public/temp/masks`);
    await executeCommand(`cp ${maskPath} public/${publicMaskPath}`);
    
    console.log("Mask generated successfully:", maskPath);
    return maskPath;
  } catch (error) {
    console.error("Error generating mask with EfficientViT:", error);
    toast({
      title: "Mask Generation Failed",
      description: "Failed to generate object mask with EfficientViT",
      variant: "destructive"
    });
    throw error;
  }
};
