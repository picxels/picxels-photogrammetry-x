
import { CapturedImage } from "@/types";
import { generateImageMask } from "@/utils/imageQualityUtils";
import { applyColorProfile, getCameraTypeFromId } from "@/utils/colorProfileUtils";
import { toast } from "@/components/ui/use-toast";

export const useImageProcessing = () => {
  const processImage = async (image: CapturedImage): Promise<CapturedImage> => {
    try {
      // First, ensure color profile is applied
      let processedImage = image;
      
      if (!processedImage.hasColorProfile) {
        const cameraType = getCameraTypeFromId(processedImage.camera);
        processedImage = await applyColorProfile(processedImage, cameraType);
        console.log(`Color profile ${cameraType} applied to image ${processedImage.id}`);
      }
      
      // Then apply mask if needed
      if (!processedImage.hasMask && processedImage.sharpness && processedImage.sharpness >= 80) {
        try {
          const maskedImage = await generateImageMask(processedImage);
          
          if (maskedImage.hasMask) {
            processedImage = maskedImage;
            console.log(`Mask successfully applied to image ${processedImage.id}`);
          }
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

  return {
    processImage,
    processImageWithMask: async (profiledImage: CapturedImage): Promise<CapturedImage> => {
      // First ensure the image has a color profile
      if (!profiledImage.hasColorProfile) {
        const cameraType = getCameraTypeFromId(profiledImage.camera);
        profiledImage = await applyColorProfile(profiledImage, cameraType);
      }
      
      // Then apply background mask if the image is sharp enough
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
      
      // Return the profiled image if masking fails or isn't needed
      return profiledImage;
    }
  };
};
