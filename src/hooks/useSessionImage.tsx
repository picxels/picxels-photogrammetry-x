
import { Session, CapturedImage } from "@/types";
import { processImage } from "@/utils/imageProcessingUtils";
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
      // Process the image (apply color profile and possibly mask)
      const processedImage = await processImage(image);
      
      // Only update if we actually modified the image
      if (processedImage !== image) {
        // Get updated session from database to avoid race conditions
        const refreshedSession = getSessionById(session.id);
        
        if (refreshedSession) {
          // Update the image in the session's passes
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
          
          // Convert CapturedImage to ImageData for the session.images array
          const updatedImages = refreshedSession.images.map((img) => {
            if (img.id === processedImage.id) {
              // Create a new ImageData from the processed CapturedImage
              return {
                id: processedImage.id,
                url: processedImage.previewUrl,
                camera: processedImage.camera,
                angle: processedImage.angle || 0,
                timestamp: new Date(processedImage.timestamp),
                hasMask: processedImage.hasMask
              };
            }
            return img;
          });
          
          // Create the updated session with the correct types
          const updatedSession: Session = {
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
