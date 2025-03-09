
import { Session, CapturedImage } from "@/types";
import { generateImageMask } from "@/utils/imageQualityUtils";
import { applyColorProfile, getCameraTypeFromId } from "@/utils/colorProfileUtils";
import { toast } from "@/components/ui/use-toast";
import { getSessionById } from "@/services/sessionDatabaseService";
import { renameSession } from "@/utils/sessionUtils";
import { Dispatch, SetStateAction } from "react";

export const useSessionImage = (
  setProcessingImages: Dispatch<SetStateAction<string[]>>
) => {
  const handleImageProcessing = async (image: CapturedImage, session: Session, passId: string): Promise<Session | null> => {
    setProcessingImages((prev) => [...prev, image.id]);
      
    try {
      // First apply color profile based on camera type
      const cameraType = getCameraTypeFromId(image.camera);
      let processedImage = image;
      
      if (!image.hasColorProfile) {
        processedImage = await applyColorProfile(image, cameraType);
        console.log(`Color profile applied for image: ${image.id}, camera type: ${cameraType}`);
      }
      
      // Then generate mask if the image is sharp enough and doesn't have a mask yet
      if (!processedImage.hasMask && processedImage.sharpness && processedImage.sharpness >= 80) {
        try {
          const maskedImage = await generateImageMask(processedImage);
          
          if (maskedImage.hasMask) {
            processedImage = maskedImage;
          }
        } catch (maskError) {
          console.error("Error generating mask:", maskError);
          toast({
            title: "Mask Generation Failed",
            description: "Failed to generate background mask.",
            variant: "destructive"
          });
        }
      }
      
      // Only update if we actually modified the image
      if (processedImage !== image) {
        // Get updated session from database to avoid race conditions
        const refreshedSession = getSessionById(session.id);
        
        if (refreshedSession) {
          // Update the image in the session
          const updatedPasses = refreshedSession.passes.map(pass => {
            if (pass.id === passId) {
              return {
                ...pass,
                images: pass.images.map(img => 
                  img.id === processedImage.id ? processedImage : img
                )
              };
            }
            return pass;
          });
          
          const updatedImages = refreshedSession.images.map((img) => {
            if (img.id === processedImage.id) {
              return processedImage;
            }
            return img;
          });
          
          const updatedSession = {
            ...refreshedSession,
            images: updatedImages,
            passes: updatedPasses
          };
          
          // Update session
          await renameSession(updatedSession, updatedSession.name);
          
          console.log(`Image processing completed for image: ${image.id}`);
          return updatedSession;
        }
      }
    } catch (error) {
      console.error("Error processing image:", error);
      toast({
        title: "Image Processing Failed",
        description: "Failed to process image.",
        variant: "destructive"
      });
    } finally {
      setProcessingImages((prev) => prev.filter((id) => id !== image.id));
    }
    
    return null;
  };
  
  return {
    handleImageProcessing
  };
};
