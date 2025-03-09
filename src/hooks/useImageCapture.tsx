
import { Session, CapturedImage, SessionStatus } from "@/types";
import { addImageToPass, renameSession } from "@/utils/sessionUtils";
import { toast } from "@/components/ui/use-toast";
import { Dispatch, SetStateAction } from "react";

export const useImageCapture = (
  session: Session | null,
  currentPassId: string,
  setSession: Dispatch<SetStateAction<Session | null>>,
  setCurrentPassId: Dispatch<SetStateAction<string>>,
  analyzedImage: CapturedImage | null,
  setAnalyzedImage: Dispatch<SetStateAction<CapturedImage | null>>,
  handleImageProcessing: (image: CapturedImage, session: Session, passId: string) => Promise<Session | null>
) => {
  const handleImageCaptured = async (image: CapturedImage) => {
    if (!session) return;
    
    if (!currentPassId && session.passes.length > 0) {
      setCurrentPassId(session.passes[0].id);
    }
    
    const passId = currentPassId || (session.passes.length > 0 ? session.passes[0].id : "");
    
    if (!passId) {
      console.error("No pass available to add the image to");
      toast({
        title: "Capture Error",
        description: "No active pass available. Please create a new session.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const updatedSession = await addImageToPass(session, passId, image);
      setSession(updatedSession);
      
      // If this is the first image in the session and we haven't analyzed one yet, 
      // set it as the analyzedImage
      if (
        (session.status === SessionStatus.INITIALIZING || 
         session.status === SessionStatus.INITIALIZED) && 
        !analyzedImage
      ) {
        setAnalyzedImage(image);
      }
      
      // Handle image processing (mask generation, etc.)
      const processedSession = await handleImageProcessing(image, updatedSession, passId);
      if (processedSession) {
        setSession(processedSession);
      }
    } catch (error) {
      console.error("Error adding image to pass:", error);
      toast({
        title: "Error",
        description: "Failed to add image to pass.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    if (!session) return;
    
    try {
      const updatedImages = session.images.filter(img => img.id !== imageId);
      
      const updatedPasses = session.passes.map(pass => ({
        ...pass,
        images: pass.images.filter(img => img.id !== imageId)
      }));
      
      const updatedSession = {
        ...session,
        images: updatedImages,
        passes: updatedPasses,
        updatedAt: new Date()
      };
      
      // Update session in database
      const savedSession = await renameSession(updatedSession, updatedSession.name);
      setSession(savedSession);
      
      if (analyzedImage && analyzedImage.id === imageId) {
        setAnalyzedImage(null);
      }
      
      toast({
        title: "Image Deleted",
        description: "Image has been removed from the session."
      });
    } catch (error) {
      console.error("Error deleting image:", error);
      toast({
        title: "Delete Error",
        description: "Failed to delete image.",
        variant: "destructive"
      });
    }
  };

  return {
    handleImageCaptured,
    handleDeleteImage
  };
};
