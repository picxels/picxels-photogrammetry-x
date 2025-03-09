
import { useState, useEffect } from "react";
import { Session, CapturedImage, AnalysisResult, SessionStatus } from "@/types";
import { 
  createSession, 
  addImageToPass, 
  renameSession,
  completePass,
  createNewPass,
  addPassToSession
} from "@/utils/sessionUtils";
import { generateImageMask } from "@/utils/imageQualityUtils";
import { toast } from "@/components/ui/use-toast";
import { getAllSessions, getSessionById, deleteSession } from "@/services/sessionDatabaseService";

export const useSession = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [allSessions, setAllSessions] = useState<Session[]>([]);
  const [currentPassId, setCurrentPassId] = useState<string>("");
  const [analyzedImage, setAnalyzedImage] = useState<CapturedImage | null>(null);
  const [processingImages, setProcessingImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load sessions on mount
  useEffect(() => {
    const loadSessions = async () => {
      try {
        setIsLoading(true);
        const sessions = getAllSessions();
        setAllSessions(sessions);
        
        // If no session exists, create one
        if (sessions.length === 0) {
          const newSession = await createSession();
          setSession(newSession);
          setCurrentPassId(newSession.passes[0].id);
        } else {
          // Use the most recent session
          setSession(sessions[0]);
          
          // Set current pass to the first incomplete pass or the last pass
          const currentSession = sessions[0];
          const incompletePass = currentSession.passes.find(p => !p.completed);
          
          if (incompletePass) {
            setCurrentPassId(incompletePass.id);
          } else if (currentSession.passes.length > 0) {
            setCurrentPassId(currentSession.passes[currentSession.passes.length - 1].id);
          }
        }
      } catch (error) {
        console.error("Error loading sessions:", error);
        toast({
          title: "Error Loading Sessions",
          description: "Failed to load existing sessions. Creating a new session.",
          variant: "destructive"
        });
        
        // Create new session as fallback
        const newSession = await createSession();
        setSession(newSession);
        setCurrentPassId(newSession.passes[0].id);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadSessions();
  }, []);

  // Initialize the currentPassId when we have passes but no current one selected
  useEffect(() => {
    if (session && session.passes && session.passes.length > 0 && !currentPassId) {
      setCurrentPassId(session.passes[0].id);
    }
  }, [session, currentPassId]);

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
      
      // If image doesn't already have a mask and is sharp enough, generate one
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
              const savedSession = await renameSession(updatedSession, updatedSession.name);
              setSession(savedSession);
              
              console.log(`Background mask generated for image: ${image.id}`);
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
    } catch (error) {
      console.error("Error adding image to pass:", error);
      toast({
        title: "Error",
        description: "Failed to add image to pass.",
        variant: "destructive"
      });
    }
  };

  const handleNewPass = async () => {
    if (!session) return;
    
    try {
      const passName = `Pass ${session.passes.length + 1}`;
      const updatedSession = await addPassToSession(session, passName);
      
      setSession(updatedSession);
      setCurrentPassId(updatedSession.passes[updatedSession.passes.length - 1].id);
      
      toast({
        title: "New Pass Added",
        description: `${passName} has been added to the session.`
      });
    } catch (error) {
      console.error("Error creating new pass:", error);
      toast({
        title: "Error",
        description: "Failed to create new pass.",
        variant: "destructive"
      });
    }
  };
  
  const handleSwitchPass = (passId: string) => {
    setCurrentPassId(passId);
    
    const passName = session?.passes.find(p => p.id === passId)?.name || "Unknown";
    
    toast({
      title: "Pass Switched",
      description: `Now working with ${passName}.`
    });
  };

  const handleSessionNameChange = async (name: string) => {
    if (!session) return;
    
    try {
      const updatedSession = await renameSession(session, name);
      setSession(updatedSession);
    } catch (error) {
      console.error("Error renaming session:", error);
      toast({
        title: "Rename Error",
        description: "Failed to rename session.",
        variant: "destructive"
      });
    }
  };

  const handleNewSession = async () => {
    try {
      const newSession = await createSession();
      setSession(newSession);
      setAnalyzedImage(null);
      setCurrentPassId(newSession.passes[0].id);
      
      // Refresh all sessions
      const sessions = getAllSessions();
      setAllSessions(sessions);
      
      toast({
        title: "New Session Started",
        description: "All previous session data has been cleared."
      });
    } catch (error) {
      console.error("Error creating new session:", error);
      toast({
        title: "Error",
        description: "Failed to create new session.",
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

  const handleSessionUpdated = (updatedSession: Session) => {
    setSession(updatedSession);
    
    // Update in the all sessions list
    setAllSessions(prev => 
      prev.map(s => s.id === updatedSession.id ? updatedSession : s)
    );
  };

  const handleCompletePass = async (passId: string) => {
    if (!session) return;
    
    try {
      const updatedSession = await completePass(session, passId);
      setSession(updatedSession);
      
      const passName = updatedSession.passes.find(p => p.id === passId)?.name || "Unknown";
      
      toast({
        title: "Pass Completed",
        description: `${passName} has been marked as complete.`
      });
    } catch (error) {
      console.error("Error completing pass:", error);
      toast({
        title: "Error",
        description: "Failed to complete pass.",
        variant: "destructive"
      });
    }
  };

  const currentPass = session?.passes.find(p => p.id === currentPassId) || null;

  return {
    session,
    currentPassId,
    currentPass,
    analyzedImage,
    processingImages,
    allSessions,
    isLoading,
    handleImageCaptured,
    handleNewPass,
    handleSwitchPass,
    handleSessionNameChange,
    handleNewSession,
    handleDeleteImage,
    handleSessionUpdated,
    handleCompletePass,
    setAnalyzedImage
  };
};
