
import { CapturedImage } from "@/types";
import { toast } from "@/components/ui/use-toast";
import { isJetsonPlatform } from "./platformUtils";
import { AI_FEATURES } from "@/config/jetsonAI.config";
import { 
  generateMaskWithEfficientViT, 
  applyMask, 
  isEfficientViTAvailable 
} from "@/services/efficientViTService";

/**
 * Checks if an image is sharp enough based on its sharpness score
 */
export const checkImageSharpness = (image: CapturedImage): boolean => {
  // Consider a more lenient threshold for Jetson platform due to different processing
  const threshold = isJetsonPlatform() ? 70 : 80;
  return (image.sharpness || 0) >= threshold;
};

/**
 * Generates a background mask for an image
 * Uses EfficientViT on Jetson platform if available
 */
export const generateImageMask = async (image: CapturedImage): Promise<CapturedImage> => {
  console.log(`Generating background mask for image: ${image.id}`);
  
  // Check if we should use EfficientViT for enhanced segmentation
  if (isJetsonPlatform() && AI_FEATURES.enhancedSegmentation) {
    try {
      // Check if EfficientViT is available
      const efficientViTAvailable = await isEfficientViTAvailable();
      
      if (efficientViTAvailable) {
        console.log("Using EfficientViT for enhanced segmentation");
        
        // Generate mask using EfficientViT
        const segmentationResult = await generateMaskWithEfficientViT(image);
        
        if (segmentationResult.success) {
          // Apply the mask to the image
          return await applyMask(image, segmentationResult.maskPath);
        } else {
          console.log("EfficientViT segmentation failed, falling back to standard method");
        }
      } else {
        console.log("EfficientViT not available, falling back to standard segmentation");
      }
    } catch (error) {
      console.error("Error with EfficientViT segmentation, falling back:", error);
    }
  }
  
  // Fallback to original mask generation method
  try {
    // Simulate mask generation with a delay
    const delay = isJetsonPlatform() ? 2000 : 1500; // Longer delay on Jetson to simulate heavier processing
    await new Promise((resolve) => setTimeout(resolve, delay));
    
    toast({
      title: "Mask Generated",
      description: `Background mask created for image ${image.id.split('-')[1] || image.id}`
    });
    
    return {
      ...image,
      hasMask: true
    };
  } catch (error) {
    console.error("Error generating mask:", error);
    toast({
      title: "Mask Generation Failed",
      description: "Could not generate background mask for the image.",
      variant: "destructive"
    });
    
    // Return the original image if mask generation fails
    return image;
  }
};
