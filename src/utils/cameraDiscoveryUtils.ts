
import { toast } from "@/components/ui/use-toast";
import { CameraDevice } from "@/types";
import { mapCameraModelToType } from "./cameraModelUtils";
import { checkUSBCameraConnections, isCameraResponding } from "./cameraConnectionUtils";

/**
 * The main function for detecting and initializing connected cameras
 */
export const detectCameras = async (): Promise<CameraDevice[]> => {
  console.log("Detecting cameras...");
  
  try {
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
  } catch (error) {
    console.error("Error detecting cameras:", error);
    
    toast({
      title: "Camera Detection Error",
      description: "An error occurred while trying to detect cameras. Please check your system configuration.",
      variant: "destructive"
    });
    
    return [];
  }
};
