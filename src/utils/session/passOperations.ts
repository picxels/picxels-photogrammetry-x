
import { Pass, Session, SessionStatus } from "@/types";
import { updateSession } from "@/services/database";
import { createNewPass } from "./sessionCreation";

/**
 * Add a new pass to an existing session
 */
export const addPassToSession = async (session: Session, passName: string): Promise<Session> => {
  const newPass = createNewPass(passName);
  const updatedSession = {
    ...session,
    passes: [...session.passes, newPass],
    updatedAt: Date.now(),
    dateModified: Date.now()
  };
  
  return await updateSession(updatedSession);
};

/**
 * Rename a pass within a session
 */
export const renamePass = async (
  session: Session,
  passId: string,
  newName: string
): Promise<Session> => {
  const passes = session.passes.map(pass => 
    pass.id === passId ? { ...pass, name: newName } : pass
  );
  
  const updatedSession = {
    ...session,
    passes,
    updatedAt: Date.now(),
    dateModified: Date.now()
  };
  
  return await updateSession(updatedSession);
};

/**
 * Mark a pass as complete
 */
export const completePass = async (
  session: Session,
  passId: string
): Promise<Session> => {
  const passes = session.passes.map(pass => 
    pass.id === passId ? { ...pass, completed: true } : pass
  );
  
  const updatedSession = {
    ...session,
    passes,
    updatedAt: Date.now(),
    dateModified: Date.now()
  };
  
  // If all passes are completed, mark session as completed
  const allPassesCompleted = updatedSession.passes.every(pass => pass.completed);
  if (allPassesCompleted) {
    updatedSession.status = SessionStatus.COMPLETED;
  }
  
  return await updateSession(updatedSession);
};
