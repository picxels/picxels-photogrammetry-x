
import { Session, SessionStatus } from "@/types";
import { updateSession } from "@/services/database";

/**
 * Update session name
 */
export const renameSession = async (
  session: Session,
  newName: string
): Promise<Session> => {
  const updatedSession = {
    ...session,
    name: newName,
    updatedAt: Date.now(),
    dateModified: Date.now()
  };
  
  return await updateSession(updatedSession);
};

/**
 * Process session images
 */
export const processSessionImages = async (
  session: Session
): Promise<Session> => {
  // This function would handle batch processing of all session images
  // For now, we just update the status
  const updatedSession = {
    ...session,
    status: SessionStatus.PROCESSING,
    updatedAt: Date.now(),
    dateModified: Date.now()
  };
  
  return await updateSession(updatedSession);
};
