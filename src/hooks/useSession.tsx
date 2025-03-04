
import { useState } from "react";
import { Session, CapturedImage, AnalysisResult } from "@/types";
import { 
  createSession, 
  addImageToPass, 
  renameSession, 
  createNewPass, 
  generateImageMask 
} from "@/utils/cameraUtils";
import { toast } from "@/components/ui/use-toast";

export const useSession = () => {
  const [session, setSession] = useState<Session>(createSession());
  const [currentPassId, setCurrentPassId] = useState<string>("");
  const [analyzedImage, setAnalyzedImage] = useState<CapturedImage | null>(null);
  const [processingImages, setProcessingImages] = useState<string[]>([]);

  // Initialize the currentPassId when we have passes but no current one selected
  if (session.passes && session.passes.length > 0 && !currentPassId) {
    setCurrentPassId(session.passes[0].id);
  }

  const handleImageCaptured = async (image: CapturedImage) => {
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
    
    const updatedSession = addImageToPass(session, passId, image);
    setSession(updatedSession);
    
    if (session.images.length === 0 && !analyzedImage) {
      setAnalyzedImage(image);
    }
    
    // If image doesn't already have a mask and is sharp enough, generate one
    if (!image.hasMask && image.sharpness && image.sharpness >= 80) {
      setProcessingImages((prev) => [...prev, image.id]);
      
      try {
        const maskedImage = await generateImageMask(image);
        
        if (maskedImage.hasMask) {
          setSession((prevSession) => {
            const updatedImages = prevSession.images.map((img) => {
              if (img.id === maskedImage.id) {
                return {
                  ...img,
                  hasMask: true
                };
              }
              return img;
            });
            
            const updatedPasses = prevSession.passes.map(pass => {
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
            
            return {
              ...prevSession,
              images: updatedImages,
              passes: updatedPasses
            };
          });
          
          console.log(`Background mask generated for image: ${image.id}`);
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
  };

  const handleNewPass = () => {
    const passName = `Pass ${session.passes.length + 1}`;
    const newPass = createNewPass(passName);
    
    setSession(prev => ({
      ...prev,
      passes: [...prev.passes, newPass],
      updatedAt: new Date()
    }));
    
    setCurrentPassId(newPass.id);
    
    toast({
      title: "New Pass Added",
      description: `${passName} has been added to the session.`
    });
  };
  
  const handleSwitchPass = (passId: string) => {
    setCurrentPassId(passId);
    
    const passName = session.passes.find(p => p.id === passId)?.name || "Unknown";
    
    toast({
      title: "Pass Switched",
      description: `Now working with ${passName}.`
    });
  };

  const handleSessionNameChange = (name: string) => {
    setSession(renameSession(session, name));
  };

  const handleNewSession = () => {
    const newSession = createSession();
    setSession(newSession);
    setAnalyzedImage(null);
    setCurrentPassId(newSession.passes[0].id);
    
    toast({
      title: "New Session Started",
      description: "All previous session data has been cleared."
    });
  };

  const handleDeleteImage = (imageId: string) => {
    setSession(prev => {
      const updatedImages = prev.images.filter(img => img.id !== imageId);
      
      const updatedPasses = prev.passes.map(pass => ({
        ...pass,
        images: pass.images.filter(img => img.id !== imageId)
      }));
      
      return {
        ...prev,
        images: updatedImages,
        passes: updatedPasses,
        updatedAt: new Date()
      };
    });
    
    if (analyzedImage && analyzedImage.id === imageId) {
      setAnalyzedImage(null);
    }
    
    toast({
      title: "Image Deleted",
      description: "Image has been removed from the session."
    });
  };

  const handleAnalysisComplete = (result: AnalysisResult, suggestedName: string) => {
    setSession({
      ...session,
      name: suggestedName,
      subjectMatter: result.subject
    });
    
    toast({
      title: "Analysis Complete",
      description: `Subject identified: ${result.subject}`
    });
  };

  const currentPass = session.passes.find(p => p.id === currentPassId) || null;

  return {
    session,
    currentPassId,
    currentPass,
    analyzedImage,
    processingImages,
    handleImageCaptured,
    handleNewPass,
    handleSwitchPass,
    handleSessionNameChange,
    handleNewSession,
    handleDeleteImage,
    handleAnalysisComplete,
    setAnalyzedImage
  };
};
