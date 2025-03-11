
import { toast } from "@/components/ui/use-toast";
import { CapturedImage } from "@/types";
import { executeCommand } from "./commandUtils";
import { processImageForPhotogrammetry, isEfficientViTAvailable } from "@/services/efficientViT";
import { DEBUG_SETTINGS } from "@/config/jetson.config";
import { checkImageSharpness, generateImageMask, analyzeSubjectWithLLM } from "./jetsonAI";

/**
 * Process a captured image for use in photogrammetry
 */
export const processImage = async (image: CapturedImage): Promise<CapturedImage> => {
  try {
    console.log(`Processing image: ${image.filePath}`);
    
    // Check if we need to apply a mask with EfficientViT
    const useEfficientViT = await isEfficientViTAvailable();
    
    if (useEfficientViT) {
      console.log("EfficientViT is available, applying segmentation mask");
      
      try {
        // Process the image with EfficientViT
        const processedData = await processImageForPhotogrammetry(image.filePath);
        
        // Update the image with processed paths
        return {
          ...image,
          processedPath: processedData.maskedPath,
          maskPath: processedData.maskPath,
          isProcessed: true
        };
      } catch (error) {
        console.error("EfficientViT processing failed, continuing without mask:", error);
        // Continue with basic processing if EfficientViT fails
      }
    }
    
    // Apply basic processing (no segmentation mask)
    const processedPath = image.filePath; // In a real implementation, we might apply other processing
    console.log(`Basic processing complete for image: ${processedPath}`);
    
    return {
      ...image,
      processedPath,
      isProcessed: true
    };
  } catch (error) {
    console.error("Error during image processing:", error);
    toast({
      title: "Processing Failed",
      description: "Failed to process image.",
      variant: "destructive"
    });
    
    // Return the original image if processing fails
    return {
      ...image,
      isProcessed: false
    };
  }
};

/**
 * Check the sharpness of an image
 */
export const checkImageSharpness = async (imagePath: string): Promise<number> => {
  try {
    // If in simulation mode, return a random sharpness
    if (DEBUG_SETTINGS.simulateCameraConnection) {
      return Math.floor(Math.random() * 40) + 60; // Random value between 60-100
    }
    
    // Use the sharpness detection from jetsonAI utilities
    return await checkImageSharpness(imagePath);
  } catch (error) {
    console.error("Error checking image sharpness:", error);
    return 50; // Default mid-range value if checking fails
  }
};

/**
 * Generate a mask for an image
 */
export const generateImageMask = async (imagePath: string): Promise<string | null> => {
  try {
    // Check if EfficientViT is available first
    const useEfficientViT = await isEfficientViTAvailable();
    
    if (useEfficientViT) {
      console.log("Using EfficientViT for mask generation");
      const processedData = await processImageForPhotogrammetry(imagePath);
      return processedData.maskPath;
    }
    
    // Fall back to other mask generation if EfficientViT isn't available
    return await generateImageMask(imagePath);
  } catch (error) {
    console.error("Error generating image mask:", error);
    return null;
  }
};
