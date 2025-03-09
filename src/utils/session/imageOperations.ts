
import { CapturedImage, Pass, Session, SessionImage, SessionStatus } from "@/types";
import { updateSession } from "@/services/database";

/**
 * Add a captured image to a session pass
 */
export const addImageToPass = async (
  session: Session,
  passId: string,
  image: CapturedImage
): Promise<Session> => {
  // First add the image to the pass within the session object
  const passes = session.passes.map(pass => {
    if (pass.id === passId) {
      // Ensure we're working with string IDs
      const currentImages = Array.isArray(pass.images) ? pass.images : [];
      const imageIds = [...currentImages, image.id];
      
      // Calculate image quality (sharpness) for the pass
      let totalSharpness = 0;
      let imageCount = 0;
      
      // Loop through imageIds and find corresponding images
      for (const imgId of imageIds) {
        const sessionImg = session.images.find(si => si.id === imgId);
        if (sessionImg && typeof sessionImg.qualityScore === 'number') {
          totalSharpness += sessionImg.qualityScore;
          imageCount++;
        }
      }
      
      const averageSharpness = imageCount > 0 ? Math.round(totalSharpness / imageCount) : 0;
      
      return {
        ...pass,
        images: imageIds,
        imageQuality: averageSharpness
      };
    }
    return pass;
  });
  
  // Create a SessionImage from the CapturedImage
  const newImageData: SessionImage = {
    id: image.id,
    filename: image.path?.split('/').pop() || `img_${Date.now()}.jpg`,
    filePath: image.filePath || image.path || '',
    camera: image.camera,
    angle: image.angle?.toString() || "0",
    dateCaptured: image.timestamp,
    qualityScore: image.sharpness,
    hasMask: image.hasMask
  };
  
  const allImages = [...session.images, newImageData];
  
  // Calculate average sharpness for all session images
  const totalSessionSharpness = allImages.reduce((sum, img) => sum + (img.qualityScore || 0), 0);
  const averageSessionSharpness = allImages.length > 0 ? Math.round(totalSessionSharpness / allImages.length) : 0;
  
  const updatedSession = {
    ...session,
    passes,
    images: allImages,
    imageQuality: averageSessionSharpness,
    updatedAt: Date.now(),
    dateModified: Date.now()
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
