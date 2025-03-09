
import { Session, Pass, SessionStatus } from "@/types";
import { addPassToSession, createNewPass, completePass } from "@/utils/session";
import { toast } from "@/components/ui/use-toast";
import { Dispatch, SetStateAction } from "react";

export const usePassManagement = (
  session: Session | null,
  setSession: Dispatch<SetStateAction<Session | null>>,
  setCurrentPassId: Dispatch<SetStateAction<string>>
) => {
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

  return {
    handleNewPass,
    handleSwitchPass,
    handleCompletePass
  };
};
