
import { toast } from "@/components/ui/use-toast";
import { CameraDevice, CapturedImage, Session, Pass, ImageData } from "@/types";
import { applyColorProfile, getCameraTypeFromId } from "./colorProfileUtils";
import { CAMERA_DEVICE_PATHS, DEBUG_SETTINGS } from "@/config/jetson.config";

// Check if running on Jetson platform
const isJetsonPlatform = () => {
  return navigator.userAgent.includes('Linux') && 
         (typeof process !== 'undefined' && process.env?.JETSON_PLATFORM === 'true');
};

// Check if we're in development or production mode
const isDevelopmentMode = () => {
  return import.meta.env.DEV;
};

/**
 * Maps camera model names to their standardized types
 * This is necessary because the same camera can have different names in different regions
 */
const mapCameraModelToType = (modelName: string): string => {
  // Map Canon EOS 550D (European/Japanese name) to T2i (North American name)
  if (modelName.includes('550D')) {
    return 'T2i';
  }
  // Map Canon EOS 600D (European/Japanese name) to T3i (North American name)
  if (modelName.includes('600D')) {
    return 'T3i';
  }
  
  // Handle standard North American names
  if (modelName.includes('T2i') || modelName.includes('Rebel T2i')) {
    return 'T2i';
  }
  if (modelName.includes('T3i') || modelName.includes('Rebel T3i')) {
    return 'T3i';
  }
  
  // If no match, return the original name
  return modelName;
};

/**
 * Checks for physical USB camera connections on Jetson platform
 * This function would actually check the USB ports on the Jetson device
 */
const checkUSBCameraConnections = async (): Promise<{
  connected: boolean;
  detectedCameras: string[];
}> => {
  if (DEBUG_SETTINGS.forceDisableAllCameras) {
    console.log("All cameras forcibly disabled via debug settings");
    return { connected: false, detectedCameras: [] };
  }
  
  if (isJetsonPlatform()) {
    try {
      console.log("Checking for physical USB camera connections on Jetson platform");
      
      // In a real implementation, this would use a system call to check:
      // 1. If USB devices are physically connected
      // 2. If the connected devices are cameras
      // 3. If the cameras are powered on and responding
      
      // This would be implemented with commands like:
      // - `lsusb` to check for USB devices
      // - `gphoto2 --auto-detect` to check for supported cameras
      // - Testing if the camera responds to basic commands
      
      // For now, we're simulating the check
      if (DEBUG_SETTINGS.simulateBadConnection) {
        // Simulate intermittent connections for testing
        const random = Math.random();
        return { 
          connected: random > 0.5, 
          detectedCameras: random > 0.5 ? ["Canon EOS 550D", "Canon EOS 600D"] : []
        };
      }
      
      // This is a placeholder for the actual implementation
      // In a real implementation, we would parse the output of lsusb and gphoto2
      return { connected: true, detectedCameras: ["Canon EOS 550D"] };
    } catch (error) {
      console.error("Error checking USB connections:", error);
      return { connected: false, detectedCameras: [] };
    }
  }
  
  // When not on Jetson platform and in development mode, 
  // connection status depends on debug settings
  return {
    connected: !DEBUG_SETTINGS.forceDisableAllCameras,
    detectedCameras: ["Canon EOS 550D", "Canon EOS 600D"] // Always return cameras in dev mode
  };
};

/**
 * Check if a specific camera is physically connected and responsive
 */
const isCameraResponding = async (cameraId: string): Promise<boolean> => {
  if (DEBUG_SETTINGS.forceDisableAllCameras) {
    return false;
  }
  
  if (isJetsonPlatform()) {
    // In a real implementation, this would send a command to the specific camera
    // and check if it responds within a timeout period
    
    // For example, with gphoto2:
    // `gphoto2 --port=usb:001,006 --summary`
    
    // For now, we're simulating the check
    if (DEBUG_SETTINGS.simulateBadConnection) {
      // Simulate some cameras not responding
      return Math.random() > 0.3;
    }
    
    // This is a placeholder for the actual implementation
    // In a real Jetson environment, we would actually check if the camera responds
    return cameraId.includes('t2i') || cameraId.includes('t3i'); // Assume cameras are responding in Jetson
  }
  
  // When not on Jetson platform, camera status depends on debug settings in dev mode
  // In development mode, we'll now assume cameras are always connected unless explicitly disabled
  return isDevelopmentMode() && !DEBUG_SETTINGS.forceDisableAllCameras;
};

export const detectCameras = async (): Promise<CameraDevice[]> => {
  console.log("Detecting cameras...");
  console.log("Is Jetson platform:", isJetsonPlatform());
  console.log("Is development mode:", isDevelopmentMode());
  
  // Simulate detection delay
  await new Promise((resolve) => setTimeout(resolve, 1500));
  
  // Check for physical camera connections
  const { connected: hasUSBCameras, detectedCameras } = await checkUSBCameraConnections();
  console.log("USB cameras physically connected:", hasUSBCameras);
  console.log("Detected camera models:", detectedCameras);
  
  // In production on Jetson, check for real cameras
  if (isJetsonPlatform()) {
    const cameraDevices: CameraDevice[] = [];
    
    // Process each detected camera
    for (const cameraModel of detectedCameras) {
      const cameraType = mapCameraModelToType(cameraModel);
      const cameraId = cameraType.toLowerCase() + "-1";
      const isConnected = await isCameraResponding(cameraId);
      
      cameraDevices.push({
        id: cameraId,
        name: cameraModel,
        type: cameraType,
        connected: isConnected,
        status: isConnected ? "idle" : "error"
      });
    }
    
    if (!cameraDevices.some(camera => camera.connected)) {
      // No cameras are connected, show warning
      toast({
        title: "No Cameras Connected",
        description: "No physical cameras found or cameras are not responding. Check USB connections, power, and drivers.",
        variant: "destructive"
      });
    }
    
    return cameraDevices;
  }
  
  // In development mode, return mock cameras with connection status
  // based on debug settings, but ensure they're actually connected
  const devModeConnected = isDevelopmentMode() && !DEBUG_SETTINGS.forceDisableAllCameras;
  
  return [
    {
      id: "t2i-1",
      name: "Canon EOS 550D",
      type: "T2i",
      connected: devModeConnected,
      status: devModeConnected ? "idle" : "error"
    },
    {
      id: "t3i-1",
      name: "Canon EOS 600D",
      type: "T3i",
      connected: devModeConnected,
      status: devModeConnected ? "idle" : "error"
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
