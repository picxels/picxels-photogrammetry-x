
import { toast } from "@/components/ui/use-toast";
import { executeCommand } from "./commandUtils";
import { parseGphoto2Output } from "./cameraParsingUtils";
import { DEBUG_SETTINGS } from "@/config/jetson.config";
import { isJetsonPlatform, isDevelopmentMode } from "./platformUtils";

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
        // First check if gphoto2 is installed
        const whichResult = await executeCommand('which gphoto2');
        console.log("gphoto2 location:", whichResult);
      } catch (error) {
        console.error("gphoto2 is not installed or not in PATH:", error);
        toast({
          title: "gphoto2 Not Found",
          description: "gphoto2 is not installed or not in PATH. Install with: sudo apt-get install gphoto2",
          variant: "destructive"
        });
        return { connected: false, detectedCameras: [] };
      }
      
      let attempts = 0;
      const maxAttempts = 3;
      let stdout = '';
      let success = false;
      
      // Try to execute the auto-detect command multiple times
      while (attempts < maxAttempts && !success) {
        try {
          console.log(`Camera detection attempt ${attempts + 1}`);
          stdout = await executeCommand('gphoto2 --auto-detect');
          
          if (stdout && (stdout.includes('Model') || stdout.includes('Canon'))) {
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
      
      // If we didn't get a valid response, check manually if we can see the camera in USB
      if (!success) {
        try {
          console.log("Checking USB devices manually with lsusb");
          const lsusbOutput = await executeCommand('lsusb');
          console.log("lsusb output:", lsusbOutput);
          
          // Look for Canon cameras in lsusb output
          if (lsusbOutput && lsusbOutput.toLowerCase().includes('canon')) {
            console.log("Canon camera detected in lsusb output but not by gphoto2");
            toast({
              title: "Camera Connection Issue",
              description: "Camera detected in USB but not by gphoto2. Try restarting the service.",
              variant: "destructive"
            });
          }
        } catch (err) {
          console.error("lsusb check failed:", err);
        }
      }
      
      // Parse the output to get detected cameras
      const detectedCameras = parseGphoto2Output(stdout);
      console.log("Parsed camera info:", detectedCameras);
      
      return { 
        connected: detectedCameras.length > 0, 
        detectedCameras 
      };
    }
    
    // Development mode simulation
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
    toast({
      title: "Camera Connection Error",
      description: "Failed to check for USB camera connections",
      variant: "destructive"
    });
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
          
          if (stdout.includes('Camera summary') || stdout.includes('Model')) {
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
