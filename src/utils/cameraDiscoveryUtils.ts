
import { toast } from "@/components/ui/use-toast";
import { CameraDevice } from "@/types";
import { mapCameraModelToType } from "./cameraModelUtils";
import { checkUSBCameraConnections, isCameraResponding } from "./cameraConnectionUtils";
import { isJetsonPlatform, shouldUseSimulationMode } from "./platformUtils";

/**
 * The main function for detecting and initializing connected cameras
 */
export const detectCameras = async (): Promise<CameraDevice[]> => {
  console.log("Detecting cameras...");
  
  try {
    // Check if we should use real camera detection
    if (isJetsonPlatform() && !shouldUseSimulationMode()) {
      // Use the real camera detection
      const { connected: hasUSBCameras, detectedCameras } = await checkUSBCameraConnections();
      console.log("USB cameras physically connected:", hasUSBCameras);
      console.log("Detected camera models:", detectedCameras);
      
      const cameraDevices: CameraDevice[] = [];
      
      if (hasUSBCameras && detectedCameras.length > 0) {
        for (const camera of detectedCameras) {
          const cameraType = mapCameraModelToType(camera.model);
          const cameraId = cameraType.toLowerCase() + "-" + camera.port.split(',')[1];
          
          // Use the refactored camera responding check
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
    } else {
      // Use simulation mode
      console.log("Using simulation for camera detection");
      return [
        {
          id: "canon-001",
          name: "Canon EOS 550D (Simulated)",
          type: "DSLR",
          port: "usb:001,004",
          connected: true,
          status: "ready"
        },
        {
          id: "canon-002",
          name: "Canon EOS 600D (Simulated)",
          type: "DSLR",
          port: "usb:001,005",
          connected: true,
          status: "ready"
        }
      ];
    }
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
