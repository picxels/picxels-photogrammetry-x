
import { CapturedImage, ImageData, Pass, Session } from "@/types";

export const createSession = (name: string = "New Session"): Session => {
  const timestamp = Date.now();
  const initialPass = createNewPass("Pass 1");
  
  return {
    id: `session-${timestamp}`,
    name,
    createdAt: new Date(),
    updatedAt: new Date(),
    images: [],
    passes: [initialPass]
  };
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

export const addPassToSession = (session: Session, passName: string): Session => {
  const newPass = createNewPass(passName);
  return {
    ...session,
    passes: [...session.passes, newPass],
    updatedAt: new Date()
  };
};

export const addImageToPass = (
  session: Session,
  passId: string,
  image: CapturedImage
): Session => {
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
  
  return {
    ...session,
    passes,
    images: allImages,
    imageQuality: averageSharpness,
    updatedAt: new Date()
  };
};

export const renameSession = (
  session: Session,
  newName: string
): Session => {
  return {
    ...session,
    name: newName,
    updatedAt: new Date()
  };
};

export const renamePass = (
  session: Session,
  passId: string,
  newName: string
): Session => {
  const passes = session.passes.map(pass => 
    pass.id === passId ? { ...pass, name: newName } : pass
  );
  
  return {
    ...session,
    passes,
    updatedAt: new Date()
  };
};

export const completePass = (
  session: Session,
  passId: string
): Session => {
  const passes = session.passes.map(pass => 
    pass.id === passId ? { ...pass, completed: true } : pass
  );
  
  return {
    ...session,
    passes,
    updatedAt: new Date()
  };
};
