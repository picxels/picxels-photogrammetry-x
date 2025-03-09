
import { Session, CapturedImage } from "@/types";
import { generateImageMask } from "@/utils/imageQualityUtils";
import { toast } from "@/components/ui/use-toast";
import { getSessionById } from "@/services/sessionDatabaseService";
import { renameSession } from "@/utils/sessionUtils";
import { Dispatch, SetStateAction } from "react";

export const useSessionImage = (
  setProcessingImages: Dispatch<SetStateAction<string[]>>
) => {
  const handleImageProcessing = async (image: CapturedImage, session: Session, passId: string) => {
    if (!image.hasMask && image.sharpness && image.sharpness >= 80) {
      setProcessingImages((prev) => [...prev, image.id]);
      
      try {
        const maskedImage = await generateImageMask(image);
        
        if (maskedImage.hasMask) {
          // Get updated session from database to avoid race conditions
          const refreshedSession = getSessionById(session.id);
          
          if (refreshedSession) {
            // Update the image in the session
            const updatedPasses = refreshedSession.passes.map(pass => {
              if (pass.id === passId) {
                return {
                  ...pass,
                  images: pass.images.map(img => 
                    img.id === maskedImage.id ? maskedImage : img
                  )
                };
              }
              return pass;
            });
            
            const updatedImages = refreshedSession.images.map((img) => {
              if (img.id === maskedImage.id) {
                return {
                  ...img,
                  hasMask: true
                };
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
            
            console.log(`Background mask generated for image: ${image.id}`);
            return updatedSession;
          }
        }
      } catch (error) {
        console.error("Error generating mask:", error);
        toast({
          title: "Mask Generation Failed",
          description: "Failed to generate background mask.",
          variant: "destructive"
        });
      } finally {
        setProcessingImages((prev) => prev.filter((id) => id !== image.id));
      }
    }
    
    return null;
  };
  
  return {
    handleImageProcessing
  };
};
