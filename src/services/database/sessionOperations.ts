
import { Session, SessionStatus } from "@/types";
import { getSessionDatabase, setSessionDatabase, saveSessionDatabase } from "./sessionDatabaseCore";

/**
 * Get all sessions from the database
 */
export const getAllSessions = (): Session[] => {
  return [...getSessionDatabase().sessions];
};

/**
 * Get a session by ID
 */
export const getSessionById = (sessionId: string): Session | undefined => {
  return getSessionDatabase().sessions.find(session => session.id === sessionId);
};

/**
 * Add a new session to the database
 */
export const addSession = async (session: Session): Promise<Session> => {
  // Ensure session has required fields
  const timestamp = Date.now();
  const sessionToAdd = {
    ...session,
    createdAt: session.createdAt || timestamp,
    updatedAt: session.updatedAt || timestamp,
    dateCreated: session.dateCreated || timestamp,
    dateModified: session.dateModified || timestamp,
    status: session.status || SessionStatus.INITIALIZING,
    images: session.images || [],
    passes: session.passes || [],
    processed: session.processed || false
  };
  
  // Get current database
  const currentDb = getSessionDatabase();
  
  // Add to database
  const updatedSessions = [
    ...currentDb.sessions.filter(s => s.id !== session.id),
    sessionToAdd
  ];
  
  // Sort by updated date (newest first)
  updatedSessions.sort((a, b) => 
    (b.updatedAt || 0) - (a.updatedAt || 0)
  );
  
  // Update database
  setSessionDatabase({
    ...currentDb,
    sessions: updatedSessions,
    lastUpdated: Date.now()
  });
  
  // Save changes
  await saveSessionDatabase();
  
  return sessionToAdd;
};

/**
 * Update an existing session
 */
export const updateSession = async (session: Session): Promise<Session> => {
  const currentDb = getSessionDatabase();
  
  // Check if session exists
  const existingSessionIndex = currentDb.sessions.findIndex(
    s => s.id === session.id
  );
  
  if (existingSessionIndex === -1) {
    throw new Error(`Session with ID ${session.id} not found`);
  }
  
  const timestamp = Date.now();
  
  // Update session
  const updatedSessions = [...currentDb.sessions];
  updatedSessions[existingSessionIndex] = {
    ...session,
    updatedAt: timestamp,
    dateModified: timestamp
  };
  
  // Update database
  setSessionDatabase({
    ...currentDb,
    sessions: updatedSessions,
    lastUpdated: Date.now()
  });
  
  // Save changes
  await saveSessionDatabase();
  
  return updatedSessions[existingSessionIndex];
};

/**
 * Delete a session by ID
 */
export const deleteSession = async (sessionId: string): Promise<void> => {
  const currentDb = getSessionDatabase();
  
  const updatedSessions = currentDb.sessions.filter(
    session => session.id !== sessionId
  );
  
  // Update database
  setSessionDatabase({
    ...currentDb,
    sessions: updatedSessions,
    lastUpdated: Date.now()
  });
  
  // Save changes
  await saveSessionDatabase();
};
