
import { useState, useEffect } from "react";
import { Session, CapturedImage, SessionStatus } from "@/types";
import { createSession, renameSession } from "@/utils/sessionUtils";
import { getAllSessions, getSessionById } from "@/services/sessionDatabaseService";
import { toast } from "@/components/ui/use-toast";
import { useSessionImage } from "./useSessionImage";

export const useSessionCore = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [allSessions, setAllSessions] = useState<Session[]>([]);
  const [currentPassId, setCurrentPassId] = useState<string>("");
  const [analyzedImage, setAnalyzedImage] = useState<CapturedImage | null>(null);
  const [processingImages, setProcessingImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const { handleImageProcessing } = useSessionImage(setProcessingImages);

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

  const handleSessionUpdated = (updatedSession: Session) => {
    setSession(updatedSession);
    
    // Update in the all sessions list
    setAllSessions(prev => 
      prev.map(s => s.id === updatedSession.id ? updatedSession : s)
    );
  };

  return {
    session,
    currentPassId,
    allSessions,
    analyzedImage,
    processingImages,
    isLoading,
    setSession,
    setCurrentPassId,
    setAnalyzedImage,
    setProcessingImages,
    handleSessionNameChange,
    handleNewSession,
    handleSessionUpdated,
    handleImageProcessing
  };
};
