
import { CapturedImage } from "@/types";
import { processImage, generateImageMask, ensureColorProfile } from "@/utils/imageProcessingUtils";

export const useImageProcessing = () => {
  return {
    processImage,
    processImageWithMask: async (image: CapturedImage): Promise<CapturedImage> => {
      // First ensure the image has a color profile
      const profiledImage = await ensureColorProfile(image);
      
      // Then apply background mask if not already masked
      if (!profiledImage.hasMask) {
        return await generateImageMask(profiledImage);
      }
      
      return profiledImage;
    }
  };
};
