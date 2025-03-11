
import { CapturedImage } from "@/types";
import { toast } from "@/components/ui/use-toast";
import { DEBUG_SETTINGS } from "@/config/jetson.config";
import { 
  checkImageSharpness, 
  generateImageMask,
  ensureColorProfile,
  processImage
} from "./imageProcessingUtils";

/**
 * Analyze the quality of an image
 */
export const analyzeImageQuality = async (
  image: CapturedImage
): Promise<{ 
  sharpness: number, 
  hasMask: boolean, 
  hasColorProfile: boolean 
}> => {
  try {
    // Check the sharpness of the image
    const sharpness = await checkImageSharpness(image.filePath);
    
    // Generate a mask for the image if it doesn't already have one
    const maskPath = image.maskPath || await generateImageMask(image);
    
    // Ensure the image has a color profile
    const withColorProfile = await ensureColorProfile(image) as CapturedImage;
    
    return {
      sharpness,
      hasMask: !!maskPath,
      hasColorProfile: withColorProfile.hasColorProfile || false
    };
  } catch (error) {
    console.error("Error analyzing image quality:", error);
    
    // Return default values if analysis fails
    return {
      sharpness: 50,
      hasMask: false,
      hasColorProfile: false
    };
  }
};

export { 
  checkImageSharpness, 
  generateImageMask,
  processImage,
  ensureColorProfile 
} from './imageProcessingUtils';
