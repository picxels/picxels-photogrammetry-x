
import { Session, CapturedImage, SessionImage } from "@/types";
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
                images: pass.images.map(imgId => 
                  imgId === processedImage.id ? processedImage.id : imgId
                )
              };
            }
            return pass;
          });
          
          // Create a SessionImage from the processed CapturedImage
          const updatedImages = refreshedSession.images.map((img) => {
            if (img.id === processedImage.id) {
              // Create a SessionImage from the processed CapturedImage
              return {
                id: processedImage.id,
                filename: processedImage.path?.split('/').pop() || `img_${Date.now()}.jpg`,
                filePath: processedImage.filePath || processedImage.path || '',
                camera: processedImage.camera,
                angle: processedImage.angle?.toString() || "0",
                dateCaptured: processedImage.timestamp,
                maskPath: processedImage.maskedPath,
                analyzed: true,
                qualityScore: processedImage.sharpness
              } as SessionImage;
            }
            return img;
          });
          
          // Create the updated session with the correct types
          const updatedSession: Session = {
            ...refreshedSession,
            images: updatedImages,
            passes: updatedPasses,
            updatedAt: Date.now(),
            dateModified: Date.now()
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
