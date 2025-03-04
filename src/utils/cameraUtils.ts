
import { toast } from "@/components/ui/use-toast";
import { CameraDevice, CapturedImage, Session, Pass, ImageData } from "@/types";
import { applyColorProfile, getCameraTypeFromId } from "./colorProfileUtils";
import { CAMERA_DEVICE_PATHS } from "@/config/jetson.config";

// Check if running on Jetson platform
const isJetsonPlatform = () => {
  return navigator.userAgent.includes('Linux') && 
         (typeof process !== 'undefined' && process.env?.JETSON_PLATFORM === 'true');
};

// Check if we're in development or production mode
const isDevelopmentMode = () => {
  return import.meta.env.DEV;
};

// Function to check USB camera availability on Jetson
const checkUSBCameraConnections = async (): Promise<boolean> => {
  if (isJetsonPlatform()) {
    try {
      // In a real implementation, this would use a system call or API
      // to check if cameras are connected to the USB ports
      // For now, we'll just simulate it
      return true;
    } catch (error) {
      console.error("Error checking USB connections:", error);
      return false;
    }
  }
  return false;
};

export const detectCameras = async (): Promise<CameraDevice[]> => {
  console.log("Detecting cameras...");
  console.log("Is Jetson platform:", isJetsonPlatform());
  console.log("Is development mode:", isDevelopmentMode());
  
  // Simulate detection delay
  await new Promise((resolve) => setTimeout(resolve, 1500));
  
  // In production or on Jetson, try to detect real cameras
  const hasUSBCameras = await checkUSBCameraConnections();
  console.log("USB cameras detected:", hasUSBCameras);
  
  if (isJetsonPlatform() && !isDevelopmentMode()) {
    if (hasUSBCameras) {
      // Return detected cameras based on Jetson config
      return [
        {
          id: "t2i-1",
          name: "Canon T2i",
          type: "T2i",
          connected: true,
          status: "idle"
        },
        {
          id: "t3i-1",
          name: "Canon T3i",
          type: "T3i",
          connected: true,
          status: "idle"
        }
      ];
    } else {
      // No real cameras detected, show warning
      toast({
        title: "No Cameras Detected",
        description: "No physical cameras found. Check USB connections and drivers.",
        variant: "destructive"
      });
      
      // Return mock cameras but mark them as disconnected
      return [
        {
          id: "t2i-1",
          name: "Canon T2i",
          type: "T2i",
          connected: false,
          status: "error"
        },
        {
          id: "t3i-1",
          name: "Canon T3i",
          type: "T3i",
          connected: false,
          status: "error"
        }
      ];
    }
  }
  
  // In development mode or non-Jetson environment, return mock cameras
  return [
    {
      id: "t2i-1",
      name: "Canon T2i (Sample)",
      type: "T2i",
      connected: true,
      status: "idle"
    },
    {
      id: "t3i-1",
      name: "Canon T3i (Sample)",
      type: "T3i",
      connected: true,
      status: "idle"
    }
  ];
};

// Function to get sample images based on the environment
const getSampleImageUrl = (cameraId: string, angle?: number): string => {
  // Use different sample images in production vs development
  const isDev = isDevelopmentMode();
  
  // Default images that are bundled with the application
  const defaultImages = [
    "/sample_images/sample1.jpg",
    "/sample_images/sample2.jpg",
    "/sample_images/sample3.jpg",
    "/sample_images/sample4.jpg"
  ];
  
  // In development, use placeholder images from Unsplash
  if (isDev) {
    if (cameraId.includes("t2i")) {
      return "https://images.unsplash.com/photo-1568605114967-8130f3a36994";
    } else {
      return "https://images.unsplash.com/photo-1601924994987-69e26d50dc26";
    }
  }
  
  // In production, use our bundled sample images
  const imageIndex = (angle && angle > 0) 
    ? Math.floor((angle / 360) * defaultImages.length) % defaultImages.length 
    : Math.floor(Math.random() * defaultImages.length);
    
  return defaultImages[imageIndex];
};

// Mock function to simulate taking a photo
export const captureImage = async (
  cameraId: string,
  sessionId: string,
  angle?: number
): Promise<CapturedImage | null> => {
  console.log(`Capturing image from camera ${cameraId} at angle ${angle}°`);
  
  try {
    // Simulate capture delay
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    // Generate a mock image path
    const timestamp = Date.now();
    const path = `/captures/${sessionId}/${cameraId}_${timestamp}.jpg`;
    
    // Get appropriate sample image URL based on environment
    const previewUrl = getSampleImageUrl(cameraId, angle);
    console.log(`Using sample image: ${previewUrl}`);
    
    // Simulate sharpness detection (0-100)
    const sharpness = Math.floor(Math.random() * 30) + 70;
    
    const image: CapturedImage = {
      id: `img-${timestamp}`,
      sessionId,
      path,
      timestamp,
      camera: cameraId,
      angle,
      previewUrl,
      sharpness
    };
    
    // Simulate checking image sharpness and retaking if necessary
    if (sharpness < 80) {
      console.log(`Image sharpness (${sharpness}) below threshold, refocusing camera...`);
      toast({
        title: "Refocusing Camera",
        description: `Image sharpness (${sharpness}/100) too low. Refocusing and retaking.`,
        variant: "default"
      });
      
      // Simulate refocusing delay
      await new Promise((resolve) => setTimeout(resolve, 800));
      
      // Take another image with better sharpness
      const improvedSharpness = Math.floor(Math.random() * 10) + 85;
      image.sharpness = improvedSharpness;
      
      console.log(`Retaken image with improved sharpness: ${improvedSharpness}`);
    }
    
    // Apply color profile to the image
    const cameraType = getCameraTypeFromId(cameraId);
    const profiledImage = await applyColorProfile(image, cameraType);
    
    console.log("Image captured and color profile applied:", profiledImage);
    return profiledImage;
  } catch (error) {
    console.error("Error capturing image:", error);
    toast({
      title: "Capture Failed",
      description: "Failed to capture image. Please check camera connection.",
      variant: "destructive"
    });
    return null;
  }
};

// Function to create a new photo session
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

// Function to create a new pass within a session
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

// Function to add a pass to a session
export const addPassToSession = (session: Session, passName: string): Session => {
  const newPass = createNewPass(passName);
  return {
    ...session,
    passes: [...session.passes, newPass],
    updatedAt: new Date()
  };
};

// Function to add an image to a specific pass in a session
export const addImageToPass = (
  session: Session,
  passId: string,
  image: CapturedImage
): Session => {
  const passes = session.passes.map(pass => {
    if (pass.id === passId) {
      // Add image to this pass
      const images = [...pass.images, image];
      // Calculate overall image quality for the pass
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
  
  // Also add to the flat images array for backward compatibility
  // Convert CapturedImage to ImageData
  const newImageData: ImageData = {
    id: image.id,
    url: image.previewUrl,
    camera: image.camera,
    angle: image.angle || 0,
    timestamp: new Date(image.timestamp),
    hasMask: image.hasMask
  };
  
  const allImages = [...session.images, newImageData];
  
  // Calculate overall session quality based on all passes
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

// Function to rename a session
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

// Function to rename a pass
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

// Function to mark a pass as complete
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

// Function to simulate checking if an image is sharp enough
export const checkImageSharpness = (image: CapturedImage): boolean => {
  return (image.sharpness || 0) >= 80;
};

// Function to simulate generating a mask for background removal
export const generateImageMask = async (image: CapturedImage): Promise<CapturedImage> => {
  console.log(`Generating background mask for image: ${image.id}`);
  
  // Simulate processing time
  await new Promise((resolve) => setTimeout(resolve, 1500));
  
  // Return updated image with mask flag
  return {
    ...image,
    hasMask: true
  };
};
