
import { toast } from "@/components/ui/use-toast";
import { CameraDevice } from "@/types";
import { mapCameraModelToType } from "./cameraModelUtils";
import { checkUSBCameraConnections, isCameraResponding } from "./cameraConnectionUtils";
import { isJetsonPlatform, isDevelopmentMode } from "./platformUtils";
import { DEBUG_SETTINGS } from "@/config/jetson.config";

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
