
import { CapturedImage } from "@/types";

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
  
  await new Promise((resolve) => setTimeout(resolve, 1500));
  
  return {
    ...image,
    hasMask: true
  };
};
