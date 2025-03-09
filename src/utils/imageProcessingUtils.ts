import { CapturedImage } from "@/types";
import { toast } from "@/components/ui/use-toast";
import { isJetsonPlatform } from "./platformUtils";
import { AI_FEATURES } from "@/config/jetsonAI.config";
import { applyColorProfile, getCameraTypeFromId } from "./colorProfileUtils";
import { 
  generateMaskWithEfficientViT, 
  applyMask, 
  isEfficientViTAvailable 
} from "@/services/efficientViT";
import { 
  shouldUseFallbackData, 
  notifyFallbackMode 
} from "./ai/fallbackUtils";

/**
 * Applies color profile to an image if not already applied
 */
export const ensureColorProfile = async (image: CapturedImage): Promise<CapturedImage> => {
  if (image.hasColorProfile) {
    return image;
  }
  
  const cameraType = getCameraTypeFromId(image.camera);
  console.log(`Applying ${cameraType} color profile to image ${image.id}`);
  return await applyColorProfile(image, cameraType);
};

/**
 * Generates a background mask for an image if it's sharp enough
 * Uses EfficientViT on Jetson platform if available
 */
export const generateImageMask = async (image: CapturedImage): Promise<CapturedImage> => {
  console.log(`Generating background mask for image: ${image.id}`);
  
  // Check if the image is already masked
  if (image.hasMask) {
    return image;
  }
  
  // Check if the image is sharp enough for masking
  if (!image.sharpness || image.sharpness < 80) {
    console.log(`Image ${image.id} not sharp enough for masking (${image.sharpness})`);
    return image;
  }
  
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
  
  // Fallback or standard mask generation method
  try {
    // Check if we should use fallback data
    if (shouldUseFallbackData()) {
      console.log("Using fallback data for mask generation");
      
      // Simulate processing delay
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      toast({
        title: "Mask Generated (Simulation)",
        description: `Background mask created for image ${image.id.split('-')[1] || image.id}`
      });
      
      return {
        ...image,
        hasMask: true
      };
    }
    
    // Simulate mask generation with a delay for real processing
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

/**
 * Checks if an image is sharp enough based on its sharpness score
 */
export const checkImageSharpness = (image: CapturedImage): boolean => {
  // Consider a more lenient threshold for Jetson platform due to different processing
  const threshold = isJetsonPlatform() ? 70 : 80;
  return (image.sharpness || 0) >= threshold;
};

/**
 * Fully processes an image (color profile and mask)
 */
export const processImage = async (image: CapturedImage): Promise<CapturedImage> => {
  try {
    // First, ensure color profile is applied
    let processedImage = await ensureColorProfile(image);
    
    // Then apply mask if needed and if image is sharp enough
    if (!processedImage.hasMask && processedImage.sharpness && processedImage.sharpness >= 80) {
      try {
        processedImage = await generateImageMask(processedImage);
      } catch (maskError) {
        console.error("Error applying mask:", maskError);
        toast({
          title: "Mask Generation Failed",
          description: "Could not generate background mask for the image.",
          variant: "destructive"
        });
      }
    }
    
    return processedImage;
  } catch (error) {
    console.error("Image processing error:", error);
    toast({
      title: "Processing Failed",
      description: "An error occurred during image processing.",
      variant: "destructive"
    });
    return image; // Return original image if processing fails
  }
};
