
import { CapturedImage, CameraDevice } from "@/types";
import { toast } from "@/components/ui/use-toast";
import { checkImageSharpness, generateImageMask } from "./imageProcessingUtils";

/**
 * Process a captured image for analysis and preview
 */
export const processCapturedImage = async (image: CapturedImage): Promise<CapturedImage> => {
  try {
    // Check sharpness
    const sharpness = await checkImageSharpness(image.filePath);
    
    // Generate mask if needed
    let maskPath = undefined;
    if (sharpness > 60) { // Only generate mask for reasonably sharp images
      maskPath = await generateImageMask(image);
    }
    
    // Return the updated image with analysis data
    return {
      ...image,
      sharpness,
      hasMask: !!maskPath,
      maskPath
    };
  } catch (error) {
    console.error("Error processing captured image:", error);
    toast({
      title: "Processing Warning",
      description: "Image captured but processing failed",
      variant: "warning"
    });
    
    // Return the original image if processing fails
    return image;
  }
};
