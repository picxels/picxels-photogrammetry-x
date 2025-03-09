
import { CapturedImage, ImageData, Pass, Session, SessionStatus } from "@/types";
import { addSession, updateSession, addImageToSession, updateSessionStatus } from "@/services/sessionDatabaseService";
import { IMAGE_PROCESSING } from "@/config/jetsonAI.config";

export const createSession = async (name: string = "New Session"): Promise<Session> => {
  const timestamp = Date.now();
  const initialPass = createNewPass("Pass 1");
  
  const session: Session = {
    id: `session-${timestamp}`,
    name,
    createdAt: new Date(),
    updatedAt: new Date(),
    images: [],
    passes: [initialPass],
    status: SessionStatus.INITIALIZING,
    processed: false
  };
  
  // Add to database
  return await addSession(session);
};

export const createNewPass = (name: string = "New Pass"): Pass => {
  const timestamp = Date.now();
  return {
    id: `pass-${timestamp}`,
    name,
    timestamp,
    images: [],
    completed: false
  };
};

export const addPassToSession = async (session: Session, passName: string): Promise<Session> => {
  const newPass = createNewPass(passName);
  const updatedSession = {
    ...session,
    passes: [...session.passes, newPass],
    updatedAt: new Date()
  };
  
  return await updateSession(updatedSession);
};

export const addImageToPass = async (
  session: Session,
  passId: string,
  image: CapturedImage
): Promise<Session> => {
  // First add the image to the pass within the session object
  const passes = session.passes.map(pass => {
    if (pass.id === passId) {
      const images = [...pass.images, image];
      const totalSharpness = images.reduce((sum, img) => sum + (img.sharpness || 0), 0);
      const averageSharpness = images.length > 0 ? Math.round(totalSharpness / images.length) : 0;
      
      return {
        ...pass,
        images,
        imageQuality: averageSharpness
      };
    }
    return pass;
  });
  
  const newImageData: ImageData = {
    id: image.id,
    url: image.previewUrl,
    camera: image.camera,
    angle: image.angle || 0,
    timestamp: new Date(image.timestamp),
    hasMask: image.hasMask
  };
  
  const allImages = [...session.images, newImageData];
  
  const allPassImages = passes.flatMap(pass => pass.images);
  const totalSharpness = allPassImages.reduce((sum, img) => sum + (img.sharpness || 0), 0);
  const averageSharpness = allPassImages.length > 0 ? Math.round(totalSharpness / allPassImages.length) : 0;
  
  const updatedSession = {
    ...session,
    passes,
    images: allImages,
    imageQuality: averageSharpness,
    updatedAt: new Date()
  };
  
  // If this is the first image captured and session is still initializing,
  // update the status to initialized
  if (session.status === SessionStatus.INITIALIZING && session.images.length === 0) {
    updatedSession.status = SessionStatus.INITIALIZED;
  } else if (session.status === SessionStatus.INITIALIZED) {
    updatedSession.status = SessionStatus.IN_PROGRESS;
  }
  
  // Update the session in the database
  return await updateSession(updatedSession);
};

export const renameSession = async (
  session: Session,
  newName: string
): Promise<Session> => {
  const updatedSession = {
    ...session,
    name: newName,
    updatedAt: new Date()
  };
  
  return await updateSession(updatedSession);
};

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
    updatedAt: new Date()
  };
  
  return await updateSession(updatedSession);
};

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
    updatedAt: new Date()
  };
  
  // If all passes are completed, mark session as completed
  const allPassesCompleted = updatedSession.passes.every(pass => pass.completed);
  if (allPassesCompleted) {
    updatedSession.status = SessionStatus.COMPLETED;
  }
  
  return await updateSession(updatedSession);
};

export const processSessionImages = async (
  session: Session
): Promise<Session> => {
  // This function would handle batch processing of all session images
  // For now, we just update the status
  const updatedSession = {
    ...session,
    status: SessionStatus.PROCESSING,
    updatedAt: new Date()
  };
  
  return await updateSession(updatedSession);
};

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
