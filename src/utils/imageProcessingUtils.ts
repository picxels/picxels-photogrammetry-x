
import { CapturedImage } from "@/types";
import { DEBUG_SETTINGS } from "@/config/jetson.config";
import { checkImageSharpness as checkImageSharpnessAI } from "./ai/imageSharpness";
import { generateImageMask as generateImageMaskAI } from "./ai/imageMask";

/**
 * Apply color profile to the image
 */
export const ensureColorProfile = async (image: CapturedImage | string): Promise<CapturedImage | string> => {
  try {
    // Handle different input types
    const imagePath = typeof image === 'string' ? image : image.filePath;
    
    // In real implementation, this would use a color profile tool
    console.log(`Applying color profile to image: ${imagePath}`);
    
    // Placeholder implementation (would be replaced by actual color profile tool)
    // This simulates a processing delay and returns the original path
    await new Promise(resolve => setTimeout(resolve, 200));
    
    if (typeof image === 'string') {
      return image; // Return original path for string inputs
    } else {
      // Return updated CapturedImage with color profile flag set
      return {
        ...image, 
        hasColorProfile: true
      };
    }
  } catch (error) {
    console.error("Error applying color profile:", error);
    return image; // Return original on error
  }
};

/**
 * Generate a mask for the image to remove background
 * Re-exports from AI module but with unified interface
 */
export const generateImageMask = async (image: CapturedImage | string): Promise<string> => {
  try {
    const imagePath = typeof image === 'string' ? image : image.filePath;
    return await generateImageMaskAI(imagePath);
  } catch (error) {
    console.error("Error generating mask:", error);
    const imagePath = typeof image === 'string' ? image : image.filePath;
    return imagePath; // Return original path on error
  }
};

/**
 * Apply mask to the image to remove background
 */
export const applyMaskToImage = async (image: CapturedImage | string): Promise<CapturedImage | string> => {
  try {
    const imagePath = typeof image === 'string' ? image : image.filePath;
    
    // In real implementation, this would use a CV algorithm to apply a mask
    console.log(`Applying mask to image: ${imagePath}`);
    
    // Generate mask using AI module
    const maskPath = await generateImageMask(image);
    
    // For string inputs, just return the mask path
    if (typeof image === 'string') {
      return imagePath;
    }
    
    // For CapturedImage inputs, return updated object
    return {
      ...image,
      maskPath: maskPath,
      hasMask: true
    };
  } catch (error) {
    console.error("Error applying mask:", error);
    return image; // Return original on error
  }
};

/**
 * Process the image (apply color profile and mask if available)
 */
export const processImage = async (image: CapturedImage): Promise<CapturedImage> => {
  try {
    console.log(`Processing image: ${image.filePath}`);
    
    // Apply color profile
    const withColorProfile = await ensureColorProfile(image) as CapturedImage;
    
    // Apply mask
    const withMask = await applyMaskToImage(withColorProfile) as CapturedImage;
    
    // Check image sharpness
    const sharpness = await checkImageSharpnessAI(withMask.filePath);
    
    return {
      ...withMask,
      sharpness: sharpness
    };
  } catch (error) {
    console.error("Error processing image:", error);
    return image; // Return original image on error
  }
};

/**
 * Check image sharpness using computer vision techniques
 * Returns a sharpness score from 0-100
 */
export const checkImageSharpness = async (imagePath: string): Promise<number> => {
  try {
    // In real implementation, this would use OpenCV or similar to analyze the image
    console.log(`Checking sharpness for image: ${imagePath}`);
    
    // For testing/development without real hardware
    if (DEBUG_SETTINGS.simulateCameraConnection) {
      // Return a random sharpness value between 50-95
      return Math.floor(Math.random() * 45) + 50;
    }
    
    // Placeholder implementation (would be replaced by actual CV algorithm)
    // This simulates a processing delay and returns a fixed value
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Return a value between 0-100 where higher is better
    return 75; 
  } catch (error) {
    console.error("Error checking image sharpness:", error);
    return 50; // Default mid-range value
  }
};
