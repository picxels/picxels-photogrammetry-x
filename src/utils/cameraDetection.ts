
import { toast } from "@/components/ui/use-toast";
import { CameraDevice } from "@/types";
import { isJetsonPlatform, isDevelopmentMode } from "./platformUtils";
import { executeCommand } from "./commandUtils";
import { DEBUG_SETTINGS } from "@/config/jetson.config";

/**
 * Maps camera model names to their standardized types
 * This is necessary because the same camera can have different names in different regions
 */
export const mapCameraModelToType = (modelName: string): string => {
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
 * Parse gphoto2 --auto-detect output to get connected cameras
 */
export const parseGphoto2Output = (output: string): { model: string, port: string }[] => {
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
export const checkUSBCameraConnections = async (): Promise<{
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
export const isCameraResponding = async (cameraId: string, portInfo?: string): Promise<boolean> => {
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
