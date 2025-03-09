
import { CapturedImage, Session, SessionImage, SessionStatus } from "@/types";
import { getSessionById } from "./sessionOperations";
import { updateSession } from "./sessionOperations";

/**
 * Add an image to a session
 */
export const addImageToSession = async (
  sessionId: string, 
  image: CapturedImage
): Promise<Session> => {
  const session = getSessionById(sessionId);
  
  if (!session) {
    throw new Error(`Session with ID ${sessionId} not found`);
  }
  
  // Find the active pass (most recent incomplete pass, or first pass)
  const activePassIndex = session.passes.findIndex(pass => !pass.completed);
  
  if (activePassIndex === -1) {
    throw new Error(`No active pass found for session ${sessionId}`);
  }
  
  // Add image ID to the pass
  const updatedPasses = [...session.passes];
  updatedPasses[activePassIndex] = {
    ...updatedPasses[activePassIndex],
    images: [...updatedPasses[activePassIndex].images, image.id]
  };
  
  // Also add to session images array for quick access
  const newSessionImage: SessionImage = {
    id: image.id,
    filename: image.path?.split('/').pop() || `img_${Date.now()}.jpg`,
    filePath: image.filePath || image.path || '',
    camera: image.camera,
    angle: image.angle?.toString() || "0",
    dateCaptured: image.timestamp
  };
  
  const updatedSession = {
    ...session,
    passes: updatedPasses,
    images: [...session.images, newSessionImage],
    updatedAt: Date.now(),
    dateModified: Date.now()
  };
  
  // If this is the first image and session is still initializing, 
  // update status to initialized
  if (session.status === SessionStatus.INITIALIZING && session.images.length === 0) {
    updatedSession.status = SessionStatus.INITIALIZED;
  } else if (session.status === SessionStatus.INITIALIZED && session.images.length > 0) {
    updatedSession.status = SessionStatus.IN_PROGRESS;
  }
  
  // Save changes
  return await updateSession(updatedSession);
};

/**
 * Update session status
 */
export const updateSessionStatus = async (
  sessionId: string,
  status: SessionStatus
): Promise<Session> => {
  const session = getSessionById(sessionId);
  
  if (!session) {
    throw new Error(`Session with ID ${sessionId} not found`);
  }
  
  const timestamp = Date.now();
  const updatedSession = {
    ...session,
    status,
    updatedAt: timestamp,
    dateModified: timestamp
  };
  
  // If status is PROCESSED, update processed flag
  if (status === SessionStatus.PROCESSED) {
    updatedSession.processed = true;
    updatedSession.processingDate = timestamp;
  }
  
  // Save changes
  return await updateSession(updatedSession);
};

/**
 * Update session metadata
 */
export const updateSessionMetadata = async (
  sessionId: string,
  metadata: {
    name?: string;
    subjectMatter?: string;
    description?: string;
    tags?: string[];
  }
): Promise<Session> => {
  const session = getSessionById(sessionId);
  
  if (!session) {
    throw new Error(`Session with ID ${sessionId} not found`);
  }
  
  // Update metadata fields
  const updatedSession = { ...session };
  if (metadata.name) updatedSession.name = metadata.name;
  if (metadata.subjectMatter) updatedSession.subjectMatter = metadata.subjectMatter;
  if (metadata.description) updatedSession.description = metadata.description;
  if (metadata.tags) updatedSession.tags = metadata.tags;
  
  updatedSession.updatedAt = Date.now();
  updatedSession.dateModified = Date.now();
  
  // Save changes
  return await updateSession(updatedSession);
};
