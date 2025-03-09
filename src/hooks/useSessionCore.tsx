
import { useState, useEffect } from "react";
import { Session, CapturedImage, SessionStatus } from "@/types";
import { createSession, renameSession } from "@/utils/session";
import { getAllSessions, getSessionById } from "@/services/database";
import { toast } from "@/components/ui/use-toast";
import { useSessionImage } from "./useSessionImage";

export const useSessionCore = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [allSessions, setAllSessions] = useState<Session[]>([]);
  const [currentPassId, setCurrentPassId] = useState<string>("");
  const [analyzedImage, setAnalyzedImage] = useState<CapturedImage | null>(null);
  const [processingImages, setProcessingImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<Error | null>(null);
  
  const { handleImageProcessing } = useSessionImage(setProcessingImages);

  // Load sessions on mount
  useEffect(() => {
    const loadSessions = async () => {
      try {
        setIsLoading(true);
        setLoadError(null);
        const sessions = getAllSessions();
        
        // Set sessions even if empty
        setAllSessions(sessions || []);
        
        // If no session exists or sessions array is invalid, create one
        if (!sessions || sessions.length === 0) {
          console.log("No sessions found, creating a new session");
          const newSession = await createSession();
          setSession(newSession);
          setCurrentPassId(newSession.passes[0].id);
          
          // Add the new session to allSessions
          setAllSessions([newSession]);
        } else {
          // Use the most recent session
          console.log(`Found ${sessions.length} sessions, using most recent`);
          setSession(sessions[0]);
          
          // Set current pass to the first incomplete pass or the last pass
          const currentSession = sessions[0];
          
          if (currentSession && currentSession.passes && currentSession.passes.length > 0) {
            const incompletePass = currentSession.passes.find(p => !p.completed);
            
            if (incompletePass) {
              setCurrentPassId(incompletePass.id);
            } else {
              setCurrentPassId(currentSession.passes[currentSession.passes.length - 1].id);
            }
          } else {
            // Handle case where session might exist but has no passes
            console.warn("Session exists but has no passes, creating a new session");
            const newSession = await createSession();
            setSession(newSession);
            setCurrentPassId(newSession.passes[0].id);
            
            // Update allSessions
            setAllSessions([newSession]);
          }
        }
      } catch (error) {
        console.error("Error loading sessions:", error);
        setLoadError(error instanceof Error ? error : new Error("Unknown error loading sessions"));
        
        toast({
          title: "Error Loading Sessions",
          description: "Failed to load existing sessions. Creating a new session.",
          variant: "destructive"
        });
        
        // Create new session as fallback
        try {
          const newSession = await createSession();
          setSession(newSession);
          setCurrentPassId(newSession.passes[0].id);
          setAllSessions([newSession]);
        } catch (createError) {
          console.error("Error creating fallback session:", createError);
          toast({
            title: "Critical Error",
            description: "Could not create a new session. Please refresh the page.",
            variant: "destructive"
          });
        }
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
    loadError,
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
