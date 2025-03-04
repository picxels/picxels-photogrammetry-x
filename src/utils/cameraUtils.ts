import { toast } from "@/components/ui/use-toast";
import { CameraDevice, CapturedImage, Session, Pass, ImageData } from "@/types";
import { applyColorProfile, getCameraTypeFromId } from "./colorProfileUtils";
import { CAMERA_DEVICE_PATHS, DEBUG_SETTINGS } from "@/config/jetson.config";
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

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
 * Parse gphoto2 --auto-detect output to get connected cameras
 * @param output The command output string from gphoto2 --auto-detect
 * @returns Array of detected cameras with their port information
 */
const parseGphoto2Output = (output: string): { model: string, port: string }[] => {
  const cameras: { model: string, port: string }[] = [];
  const lines = output.split('\n');
  
  // Find the line that has the header
  const headerIndex = lines.findIndex(line => 
    line.includes('Model') && line.includes('Port')
  );
  
  if (headerIndex === -1 || headerIndex >= lines.length - 1) {
    return cameras;
  }
  
  // Skip the header and the dashed line
  for (let i = headerIndex + 2; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Parse the model and port - gphoto2 output has a specific format
    // Example: Canon EOS 550D                 usb:001,007
    const match = line.match(/^(.+?)\s+usb:(.+?)$/);
    if (match) {
      const model = match[1].trim();
      const port = `usb:${match[2].trim()}`;
      cameras.push({ model, port });
    }
  }
  
  return cameras;
};

/**
 * Checks for physical USB camera connections on Jetson platform
 * Uses gphoto2 --auto-detect to find connected cameras
 */
const checkUSBCameraConnections = async (): Promise<{
  connected: boolean;
  detectedCameras: { model: string, port: string }[];
}> => {
  if (DEBUG_SETTINGS.forceDisableAllCameras) {
    console.log("All cameras forcibly disabled via debug settings");
    return { connected: false, detectedCameras: [] };
  }
  
  try {
    console.log("Checking for physical USB camera connections");
    
    if (isJetsonPlatform() || !isDevelopmentMode()) {
      // Execute gphoto2 --auto-detect command to find connected cameras
      console.log("Executing gphoto2 --auto-detect");
      const { stdout } = await execAsync('gphoto2 --auto-detect');
      console.log("gphoto2 --auto-detect output:", stdout);
      
      // Parse the output to get camera models and ports
      const detectedCameras = parseGphoto2Output(stdout);
      console.log("Parsed camera info:", detectedCameras);
      
      return { 
        connected: detectedCameras.length > 0, 
        detectedCameras 
      };
    }
    
    // For development mode on non-Jetson platforms, return simulated data
    if (DEBUG_SETTINGS.simulateBadConnection) {
      // Simulate intermittent connections for testing
      const random = Math.random();
      return { 
        connected: random > 0.5, 
        detectedCameras: random > 0.5 ? [
          { model: "Canon EOS 550D", port: "usb:001,007" },
          { model: "Canon EOS 600D", port: "usb:002,005" }
        ] : []
      };
    }
    
    // Default simulated data for development
    return { 
      connected: true, 
      detectedCameras: [
        { model: "Canon EOS 550D", port: "usb:001,007" },
        { model: "Canon EOS 600D", port: "usb:002,005" }
      ]
    };
  } catch (error) {
    console.error("Error checking USB connections:", error);
    return { connected: false, detectedCameras: [] };
  }
};

/**
 * Check if a specific camera is physically connected and responsive
 * Makes a specific call to the camera to check its status
 */
const isCameraResponding = async (cameraId: string, portInfo?: string): Promise<boolean> => {
  if (DEBUG_SETTINGS.forceDisableAllCameras) {
    return false;
  }
  
  try {
    console.log(`Checking if camera ${cameraId} is responding on port ${portInfo || 'unknown'}`);
    
    if (isJetsonPlatform() || !isDevelopmentMode()) {
      if (!portInfo) {
        console.error(`No port information for camera ${cameraId}`);
        return false;
      }
      
      // Try to get camera summary which will fail if camera is not responsive
      console.log(`Executing gphoto2 --port=${portInfo} --summary`);
      const { stdout, stderr } = await execAsync(`gphoto2 --port=${portInfo} --summary`, { timeout: 5000 });
      
      // If we get a successful response with camera info, it's responding
      const isResponding = !stderr.includes('Error') && stdout.includes('Camera');
      console.log(`Camera ${cameraId} responsive: ${isResponding}`);
      return isResponding;
    }
    
    // Simulation for development mode
    if (DEBUG_SETTINGS.simulateBadConnection) {
      return Math.random() > 0.3;
    }
    
    // Default in development: return true
    return true;
    
  } catch (error) {
    console.error(`Error checking camera ${cameraId} response:`, error);
    // If we get a timeout or error, the camera is likely not responding
    return false;
  }
};

/**
 * The main function for detecting and initializing connected cameras
 */
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
  
  const cameraDevices: CameraDevice[] = [];
  
  if (hasUSBCameras && detectedCameras.length > 0) {
    // Process each detected camera
    for (const camera of detectedCameras) {
      const cameraType = mapCameraModelToType(camera.model);
      const cameraId = cameraType.toLowerCase() + "-" + camera.port.split(',')[1]; // Use port number in ID
      
      // Check if camera is responding
      const isConnected = await isCameraResponding(cameraId, camera.port);
      
      cameraDevices.push({
        id: cameraId,
        name: camera.model,
        type: cameraType,
        port: camera.port,
        connected: isConnected,
        status: isConnected ? "idle" : "error"
      });
    }
  } else if (isDevelopmentMode()) {
    // In development mode with no physical cameras, add simulated cameras
    const devModeConnected = !DEBUG_SETTINGS.forceDisableAllCameras;
    
    cameraDevices.push({
      id: "t2i-1",
      name: "Canon EOS 550D",
      type: "T2i",
      port: "usb:001,007",
      connected: devModeConnected,
      status: devModeConnected ? "idle" : "error"
    });
    
    cameraDevices.push({
      id: "t3i-1",
      name: "Canon EOS 600D",
      type: "T3i",
      port: "usb:002,005",
      connected: devModeConnected,
      status: devModeConnected ? "idle" : "error"
    });
  }
  
  if (cameraDevices.length === 0 || !cameraDevices.some(camera => camera.connected)) {
    // No cameras were found or none are connected, show warning
    toast({
      title: "Camera Connection Issue",
      description: "No cameras found or cameras are not responding. Check USB connections and power.",
      variant: "destructive"
    });
  }
  
  return cameraDevices;
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

// Function to capture an image from the camera
export const captureImage = async (
  cameraId: string,
  sessionId: string,
  angle?: number
): Promise<CapturedImage | null> => {
  console.log(`Capturing image from camera ${cameraId} at angle ${angle}°`);
  
  try {
    const cameraDevice = cameraId.split('-');
    const cameraType = cameraDevice[0].toLowerCase();
    let portInfo = "";
    
    // Extract port info from camera ID if available
    if (cameraDevice.length > 1) {
      portInfo = `usb:001,${cameraDevice[1]}`;
    }
    
    if ((isJetsonPlatform() || !isDevelopmentMode()) && portInfo) {
      // In production on Jetson, actually capture using gphoto2
      console.log(`Executing gphoto2 capture on port ${portInfo}`);
      
      // Create the capture directory if it doesn't exist
      const captureDir = `/tmp/picxels/captures/${sessionId}`;
      await execAsync(`mkdir -p ${captureDir}`);
      
      // Generate a filename based on timestamp and camera
      const timestamp = Date.now();
      const filename = `${cameraType}_${timestamp}.jpg`;
      const filePath = `${captureDir}/${filename}`;
      
      // Use gphoto2 to capture directly to the file
      const captureCommand = `gphoto2 --port=${portInfo} --capture-image-and-download --filename=${filePath}`;
      console.log(`Executing: ${captureCommand}`);
      
      const { stdout, stderr } = await execAsync(captureCommand, { timeout: 15000 });
      console.log("Capture output:", stdout);
      
      if (stderr && stderr.includes('Error')) {
        console.error("Capture error:", stderr);
        throw new Error(`Failed to capture image: ${stderr}`);
      }
      
      // If we got this far, capture was successful
      // In a real implementation, we would now process the file and analyze sharpness
      
      // For now, simulate the rest of the processing with the sample image logic
      const previewUrl = getSampleImageUrl(cameraId, angle);
      
      // Simulate sharpness detection (0-100)
      const sharpness = Math.floor(Math.random() * 30) + 70;
      
      const image: CapturedImage = {
        id: `img-${timestamp}`,
        sessionId,
        path: filePath,
        timestamp,
        camera: cameraId,
        angle,
        previewUrl,
        sharpness
      };
      
      // Apply color profile to the image
      const cameraTypeForProfile = getCameraTypeFromId(cameraId);
      const profiledImage = await applyColorProfile(image, cameraTypeForProfile);
      
      console.log("Image captured and color profile applied:", profiledImage);
      return profiledImage;
    } else {
      // In development, use the simulation code
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
    }
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
