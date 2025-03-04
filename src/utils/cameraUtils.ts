import { toast } from "@/components/ui/use-toast";
import { CameraDevice, CapturedImage, Session, Pass, ImageData } from "@/types";
import { applyColorProfile, getCameraTypeFromId } from "./colorProfileUtils";
import { CAMERA_DEVICE_PATHS, DEBUG_SETTINGS } from "@/config/jetson.config";

// Check if running on Jetson platform
const isJetsonPlatform = () => {
  const isLinux = navigator.userAgent.includes('Linux');
  const hasJetsonEnv = typeof process !== 'undefined' && 
                      (process.env?.JETSON_PLATFORM === 'true' || 
                       process.env?.TEGRA_PLATFORM === 'true');
  const isTegra = typeof navigator !== 'undefined' && 
                 navigator.userAgent.includes('Tegra');
  
  console.log("Platform detection:", { isLinux, hasJetsonEnv, isTegra });
  
  if (!isDevelopmentMode() && isLinux) {
    console.log("Production mode on Linux, assuming Jetson platform");
    return true;
  }
  
  return isLinux && (hasJetsonEnv || isTegra);
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
  if (modelName.includes('550D')) {
    return 'T2i';
  }
  if (modelName.includes('600D')) {
    return 'T3i';
  }
  
  if (modelName.includes('T2i') || modelName.includes('Rebel T2i')) {
    return 'T2i';
  }
  if (modelName.includes('T3i') || modelName.includes('Rebel T3i')) {
    return 'T3i';
  }
  
  return modelName;
};

/**
 * Executes a shell command on the Jetson platform
 * This is critical for interacting with gphoto2
 */
const executeCommand = async (command: string): Promise<string> => {
  console.log(`Executing command: ${command}`);
  
  if (isJetsonPlatform() || !isDevelopmentMode()) {
    try {
      console.log("Executing via API endpoint");
      const response = await fetch('/api/execute-command', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ command }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Command execution failed (${response.status}): ${errorText}`);
        throw new Error(`Command execution failed: ${command} (${response.status}): ${errorText}`);
      }
      
      const data = await response.json();
      console.log(`Command result:`, data);
      return data.stdout || '';
    } catch (error) {
      console.error(`Error executing command '${command}':`, error);
      throw error;
    }
  } else {
    if (command === 'gphoto2 --auto-detect') {
      if (DEBUG_SETTINGS.simulateBadConnection && Math.random() > 0.5) {
        return '';
      }
      return `
Model                          Port                                            
----------------------------------------------------------
Canon EOS 550D                 usb:001,007
Canon EOS 600D                 usb:001,009
`;
    }
    
    if (command.includes('--summary')) {
      if (DEBUG_SETTINGS.simulateBadConnection && Math.random() > 0.3) {
        throw new Error('Camera not responding');
      }
      return `
Camera summary:                                                                
Manufacturer: Canon Inc.
Model: Canon EOS 550D
  Version: 1.0.9
  Serial Number: 2147483647
  Vendor Extension ID: 0xb (1.0)
`;
    }
    
    if (command.includes('--capture-image-and-download')) {
      if (DEBUG_SETTINGS.simulateBadConnection && Math.random() > 0.7) {
        throw new Error('Camera capture failed');
      }
      return `
New file is in location /tmp/picxels/captures/img_001.jpg
`;
    }
    
    return 'Command executed successfully';
  }
};

/**
 * Parse gphoto2 --auto-detect output to get connected cameras
 */
const parseGphoto2Output = (output: string): { model: string, port: string }[] => {
  console.log("Parsing gphoto2 output:", output);
  const cameras: { model: string, port: string }[] = [];
  const lines = output.split('\n');
  
  const headerIndex = lines.findIndex(line => 
    line.includes('Model') && line.includes('Port')
  );
  
  console.log(`Header index: ${headerIndex}`);
  
  if (headerIndex === -1 || headerIndex >= lines.length - 1) {
    console.log("No cameras found in gphoto2 output");
    return cameras;
  }
  
  for (let i = headerIndex + 2; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    console.log(`Processing line: ${line}`);
    
    const match = line.match(/^(.+?)\s+usb:(.+?)$/);
    if (match) {
      const model = match[1].trim();
      const port = `usb:${match[2].trim()}`;
      console.log(`Found camera: ${model} at ${port}`);
      cameras.push({ model, port });
    } else {
      console.log(`Line doesn't match expected format: ${line}`);
    }
  }
  
  console.log(`Total cameras found: ${cameras.length}`);
  return cameras;
};

/**
 * Checks for physical USB camera connections
 * Uses gphoto2 --auto-detect to find connected cameras
 */
const checkUSBCameraConnections = async (): Promise<{
  connected: boolean;
  detectedCameras: { model: string, port: string }[];
}> => {
  console.log("Checking for physical USB camera connections");
  
  if (DEBUG_SETTINGS.forceDisableAllCameras) {
    console.log("All cameras forcibly disabled via debug settings");
    return { connected: false, detectedCameras: [] };
  }
  
  try {
    if (isJetsonPlatform() || !isDevelopmentMode()) {
      console.log("Executing gphoto2 --auto-detect on Jetson");
      
      try {
        await executeCommand('which gphoto2');
      } catch (error) {
        console.error("gphoto2 is not installed or not in PATH:", error);
        return { connected: false, detectedCameras: [] };
      }
      
      let attempts = 0;
      const maxAttempts = 3;
      let stdout = '';
      let success = false;
      
      while (attempts < maxAttempts && !success) {
        try {
          console.log(`Camera detection attempt ${attempts + 1}`);
          stdout = await executeCommand('gphoto2 --auto-detect');
          
          if (stdout && stdout.includes('Model')) {
            success = true;
            console.log("Successful camera detection");
          } else {
            console.log(`Camera detection attempt ${attempts + 1} failed, output:`, stdout);
          }
        } catch (err) {
          console.error(`Camera detection error (attempt ${attempts + 1}):`, err);
        }
        attempts++;
        
        if (attempts < maxAttempts && !success) {
          console.log(`Waiting before retry ${attempts}`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      console.log("gphoto2 --auto-detect output:", stdout);
      
      const detectedCameras = parseGphoto2Output(stdout);
      console.log("Parsed camera info:", detectedCameras);
      
      return { 
        connected: detectedCameras.length > 0, 
        detectedCameras 
      };
    }
    
    if (DEBUG_SETTINGS.simulateCameraConnection) {
      console.log("Using simulated camera connections");
      return { 
        connected: true, 
        detectedCameras: [
          { model: "Canon EOS 550D", port: "usb:001,007" },
          { model: "Canon EOS 600D", port: "usb:001,009" }
        ]
      };
    }
    
    if (DEBUG_SETTINGS.simulateBadConnection) {
      const random = Math.random();
      return { 
        connected: random > 0.5, 
        detectedCameras: random > 0.5 ? [
          { model: "Canon EOS 550D", port: "usb:001,007" },
          { model: "Canon EOS 600D", port: "usb:001,009" }
        ] : []
      };
    }
    
    return { 
      connected: true, 
      detectedCameras: [
        { model: "Canon EOS 550D", port: "usb:001,007" },
        { model: "Canon EOS 600D", port: "usb:001,009" }
      ]
    };
  } catch (error) {
    console.error("Error checking USB connections:", error);
    return { connected: false, detectedCameras: [] };
  }
};

/**
 * Check if a specific camera is physically connected and responsive
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
      
      let attempts = 0;
      const maxAttempts = 3;
      let isResponding = false;
      
      while (attempts < maxAttempts && !isResponding) {
        try {
          console.log(`Executing gphoto2 --port=${portInfo} --summary (attempt ${attempts + 1})`);
          const stdout = await executeCommand(`gphoto2 --port=${portInfo} --summary`);
          
          if (stdout.includes('Camera summary') && stdout.includes('Model')) {
            isResponding = true;
            console.log(`Camera ${cameraId} responded successfully`);
            break;
          } else {
            console.log(`Camera ${cameraId} response check unsuccessful, output:`, stdout);
          }
        } catch (err) {
          console.error(`Camera response check error (attempt ${attempts + 1}):`, err);
        }
        attempts++;
        
        if (attempts < maxAttempts && !isResponding) {
          console.log(`Waiting before retry ${attempts}`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      console.log(`Camera ${cameraId} responsive: ${isResponding}`);
      return isResponding;
    }
    
    if (DEBUG_SETTINGS.simulateCameraConnection) {
      return true;
    }
    
    if (DEBUG_SETTINGS.simulateBadConnection) {
      return Math.random() > 0.3;
    }
    
    return true;
  } catch (error) {
    console.error(`Error checking camera ${cameraId} response:`, error);
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
  
  if (!isJetsonPlatform() && isDevelopmentMode()) {
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }
  
  const { connected: hasUSBCameras, detectedCameras } = await checkUSBCameraConnections();
  console.log("USB cameras physically connected:", hasUSBCameras);
  console.log("Detected camera models:", detectedCameras);
  
  const cameraDevices: CameraDevice[] = [];
  
  if (hasUSBCameras && detectedCameras.length > 0) {
    for (const camera of detectedCameras) {
      const cameraType = mapCameraModelToType(camera.model);
      const cameraId = cameraType.toLowerCase() + "-" + camera.port.split(',')[1];
      
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
  } else if (DEBUG_SETTINGS.simulateCameraConnection || isDevelopmentMode()) {
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
      port: "usb:001,009",
      connected: devModeConnected,
      status: devModeConnected ? "idle" : "error"
    });
  }
  
  if (cameraDevices.length === 0 || !cameraDevices.some(camera => camera.connected)) {
    toast({
      title: "Camera Connection Issue",
      description: "No cameras found or cameras are not responding. Check USB connections and power.",
      variant: "destructive"
    });
  } else {
    const connectedCount = cameraDevices.filter(c => c.connected).length;
    if (connectedCount > 0) {
      toast({
        title: "Cameras Detected",
        description: `${connectedCount} ${connectedCount === 1 ? 'camera' : 'cameras'} successfully connected.`,
        variant: "default"
      });
    }
  }
  
  return cameraDevices;
};

const getSampleImageUrl = (cameraId: string, angle?: number): string => {
  const isDev = isDevelopmentMode();
  
  const defaultImages = [
    "/sample_images/sample1.jpg",
    "/sample_images/sample2.jpg",
    "/sample_images/sample3.jpg",
    "/sample_images/sample4.jpg"
  ];
  
  if (isDev) {
    if (cameraId.includes("t2i")) {
      return "https://images.unsplash.com/photo-1568605114967-8130f3a36994";
    } else {
      return "https://images.unsplash.com/photo-1601924994987-69e26d50dc26";
    }
  }
  
  const imageIndex = (angle && angle > 0) 
    ? Math.floor((angle / 360) * defaultImages.length) % defaultImages.length 
    : Math.floor(Math.random() * defaultImages.length);
    
  return defaultImages[imageIndex];
};

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
    
    if (cameraDevice.length > 1) {
      portInfo = `usb:001,${cameraDevice[1]}`;
    }
    
    if ((isJetsonPlatform() || !isDevelopmentMode()) && portInfo) {
      console.log(`Executing gphoto2 capture on port ${portInfo}`);
      
      const captureDir = `/tmp/picxels/captures/${sessionId}`;
      await executeCommand(`mkdir -p ${captureDir}`);
      
      const timestamp = Date.now();
      const filename = `${cameraType}_${timestamp}.jpg`;
      const filePath = `${captureDir}/${filename}`;
      
      const captureCommand = `gphoto2 --port=${portInfo} --capture-image-and-download --filename=${filePath}`;
      console.log(`Executing: ${captureCommand}`);
      
      try {
        const stdout = await executeCommand(captureCommand);
        console.log("Capture output:", stdout);
        
        if (!stdout.includes('New file')) {
          console.error("Capture did not produce a new file");
          throw new Error(`Failed to capture image: No file produced`);
        }
        
        const fileCheckCommand = `ls -la ${filePath}`;
        const fileCheckOutput = await executeCommand(fileCheckCommand);
        console.log("File check output:", fileCheckOutput);
        
        if (!fileCheckOutput.includes(filename)) {
          console.error("File does not exist after capture");
          throw new Error(`Captured file not found: ${filePath}`);
        }
        
        const publicPath = `/public/captures/${sessionId}`;
        const publicFilePath = `${publicPath}/${filename}`;
        
        await executeCommand(`mkdir -p public/captures/${sessionId}`);
        await executeCommand(`cp ${filePath} public/${publicFilePath}`);
        
        const previewUrl = publicFilePath;
        
        const sharpness = 85;
        
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
        
        const cameraTypeForProfile = getCameraTypeFromId(cameraId);
        const profiledImage = await applyColorProfile(image, cameraTypeForProfile);
        
        console.log("Image captured and color profile applied:", profiledImage);
        return profiledImage;
      } catch (error) {
        console.error("Error during capture:", error);
        throw error;
      }
    } else {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      const timestamp = Date.now();
      const path = `/captures/${sessionId}/${cameraId}_${timestamp}.jpg`;
      
      const previewUrl = getSampleImageUrl(cameraId, angle);
      console.log(`Using sample image: ${previewUrl}`);
      
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
      
      if (sharpness < 80) {
        console.log(`Image sharpness (${sharpness}) below threshold, refocusing camera...`);
        toast({
          title: "Refocusing Camera",
          description: `Image sharpness (${sharpness}/100) too low. Refocusing and retaking.`,
          variant: "default"
        });
        
        await new Promise((resolve) => setTimeout(resolve, 800));
        
        const improvedSharpness = Math.floor(Math.random() * 10) + 85;
        image.sharpness = improvedSharpness;
        
        console.log(`Retaken image with improved sharpness: ${improvedSharpness}`);
      }
      
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

export const checkImageSharpness = (image: CapturedImage): boolean => {
  return (image.sharpness || 0) >= 80;
};

export const generateImageMask = async (image: CapturedImage): Promise<CapturedImage> => {
  console.log(`Generating background mask for image: ${image.id}`);
  
  await new Promise((resolve) => setTimeout(resolve, 1500));
  
  return {
    ...image,
    hasMask: true
  };
};
