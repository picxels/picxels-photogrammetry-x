
import { CapturedImage } from "@/types";
import { toast } from "@/components/ui/use-toast";

/**
 * Checks if an image is sharp enough based on its sharpness score
 */
export const checkImageSharpness = (image: CapturedImage): boolean => {
  return (image.sharpness || 0) >= 80;
};

/**
 * Generates a background mask for an image
 * In a real implementation, this would use a segmentation model
 */
export const generateImageMask = async (image: CapturedImage): Promise<CapturedImage> => {
  console.log(`Generating background mask for image: ${image.id}`);
  
  try {
    // Simulate mask generation with a delay
    // In a real implementation, this would call a segmentation model
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    toast({
      title: "Mask Generated",
      description: `Background mask created for image ${image.id.split('-')[1]}`
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
