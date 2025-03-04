
import { CapturedImage } from "@/types";
import { toast } from "@/components/ui/use-toast";
import { isJetsonPlatform } from "./platformUtils";

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
 * In a real implementation, this would use a segmentation model
 */
export const generateImageMask = async (image: CapturedImage): Promise<CapturedImage> => {
  console.log(`Generating background mask for image: ${image.id}`);
  
  try {
    // For Jetson platform, we'd use the TensorRT model
    // For now, simulate mask generation with a delay
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
