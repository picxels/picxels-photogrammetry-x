
import { Pass, Session, SessionStatus } from "@/types";
import { addSession, updateSession } from "@/services/database";
import { IMAGE_PROCESSING } from "@/config/jetsonAI.config";

/**
 * Create a new session
 */
export const createSession = async (name: string = "New Session"): Promise<Session> => {
  const timestamp = Date.now();
  const initialPass = createNewPass("Pass 1");
  
  const session: Session = {
    id: `session-${timestamp}`,
    name,
    dateCreated: timestamp,
    dateModified: timestamp,
    createdAt: timestamp,
    updatedAt: timestamp,
    images: [],
    passes: [initialPass],
    status: SessionStatus.INITIALIZING,
    processed: false
  };
  
  // Add to database
  return await addSession(session);
};

/**
 * Create a new pass for a session
 */
export const createNewPass = (name: string = "New Pass"): Pass => {
  const timestamp = Date.now();
  return {
    id: `pass-${timestamp}`,
    name,
    dateCreated: timestamp,
    dateModified: timestamp,
    images: [],
    completed: false,
    timestamp // Adding timestamp for compatibility
  };
};

/**
 * Create session directory structure
 */
export const createSessionDirectoryStructure = async (
  sessionId: string
): Promise<string> => {
  // This would create the proper directory structure for a session
  // For now, we just return a path
  const baseDir = IMAGE_PROCESSING.outputDir;
  const sessionDir = `${baseDir}/${sessionId}`;
  
  // In a real implementation, this would create all necessary subdirectories
  
  return sessionDir;
};
