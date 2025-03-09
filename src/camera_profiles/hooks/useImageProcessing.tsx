
import { CapturedImage } from "@/types";
import { generateImageMask } from "@/utils/cameraUtils";

export const useImageProcessing = () => {
  const processImageWithMask = async (profiledImage: CapturedImage): Promise<CapturedImage> => {
    // Apply background mask if the image is sharp enough
    if (profiledImage.sharpness && profiledImage.sharpness >= 80) {
      try {
        const maskedImage = await generateImageMask(profiledImage);
        
        // If mask was successfully generated, use the masked image
        if (maskedImage.hasMask) {
          return maskedImage;
        }
      } catch (maskError) {
        console.error("Error applying mask:", maskError);
      }
    }
    
    // Return the original profiled image if masking fails or isn't needed
    return profiledImage;
  };

  return {
    processImageWithMask
  };
};
