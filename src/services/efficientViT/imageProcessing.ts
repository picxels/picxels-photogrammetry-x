
import { EFFICIENTVIT_CONFIG } from "@/config/jetsonAI.config";
import { executeCommand } from "@/utils/commandUtils";
import { toast } from "@/components/ui/use-toast";
import { generateMaskWithEfficientViT } from "./maskGeneration";

/**
 * Apply the segmentation mask to an image
 */
export const applyMask = async (
  imagePath: string,
  maskPath: string
): Promise<string> => {
  try {
    // Create output directory for processed images
    const outputDir = `${EFFICIENTVIT_CONFIG.tempDir}/processed`;
    const processedFilename = `${Date.now()}_masked.png`;
    const processedPath = `${outputDir}/${processedFilename}`;
    
    // Ensure output directory exists
    await executeCommand(`mkdir -p ${outputDir}`);
    
    console.log(`Applying mask ${maskPath} to image ${imagePath}`);
    
    // Use ImageMagick to apply mask:
    // - Convert the mask to alpha channel
    // - Composite the original image with the alpha mask
    const compositeCommand = `convert ${imagePath} \\( ${maskPath} -alpha on \\) -compose DstIn -composite ${processedPath}`;
    
    await executeCommand(compositeCommand);
    
    // Verify processed file exists
    const checkCommand = `ls -la ${processedPath}`;
    const checkOutput = await executeCommand(checkCommand);
    
    if (!checkOutput.includes(processedFilename)) {
      console.error("Processed file not generated:", checkOutput);
      throw new Error("Failed to apply mask to image");
    }
    
    // Create a public copy for web access
    const publicProcessedPath = `/public/temp/processed/${processedFilename}`;
    await executeCommand(`mkdir -p public/temp/processed`);
    await executeCommand(`cp ${processedPath} public/${publicProcessedPath}`);
    
    console.log("Mask applied successfully:", processedPath);
    return processedPath;
  } catch (error) {
    console.error("Error applying mask to image:", error);
    toast({
      title: "Image Processing Failed",
      description: "Failed to apply mask to image",
      variant: "destructive"
    });
    throw error;
  }
};

/**
 * Process an image for photogrammetry by generating and applying a mask
 */
export const processImageForPhotogrammetry = async (
  imagePath: string
): Promise<{
  originalPath: string;
  maskedPath: string;
  maskPath: string;
}> => {
  try {
    console.log(`Processing image for photogrammetry: ${imagePath}`);
    
    // Generate mask for the image
    const maskPath = await generateMaskWithEfficientViT(imagePath);
    
    // Apply the mask to the image
    const maskedPath = await applyMask(imagePath, maskPath);
    
    return {
      originalPath: imagePath,
      maskedPath,
      maskPath
    };
  } catch (error) {
    console.error("Error processing image for photogrammetry:", error);
    toast({
      title: "Image Processing Failed",
      description: "Failed to process image for photogrammetry",
      variant: "destructive"
    });
    throw error;
  }
};
