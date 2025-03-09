
import { CameraDevice } from "@/types";
import { DEBUG_SETTINGS } from "@/config/jetson.config";
import { toast } from "@/components/ui/use-toast";

/**
 * Helper to get simulated cameras for development
 */
export const getSimulatedCameras = (): CameraDevice[] => {
  // If simulation is forced to disable all cameras
  if (DEBUG_SETTINGS.forceDisableAllCameras) {
    return [
      {
        id: "canon-001",
        name: "Canon EOS 550D",
        type: "DSLR",
        port: "usb:001,004",
        connected: false,
        status: "error"
      },
      {
        id: "canon-002",
        name: "Canon EOS 600D",
        type: "DSLR",
        port: "usb:001,005",
        connected: false,
        status: "error"
      }
    ];
  }
  
  // Regular simulation mode with connected cameras
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
};

/**
 * Determines if simulation mode should be used based on various conditions
 */
export const shouldUseSimulationMode = (apiAvailable?: boolean | null): boolean => {
  // Check localStorage for API availability
  const storedApiAvailable = typeof window !== 'undefined' && 
    window.localStorage.getItem('apiAvailable') === 'true';
  
  // Use stored value if current value is null or undefined
  const isApiAvailable = apiAvailable !== null && apiAvailable !== undefined ? 
    apiAvailable : storedApiAvailable;
  
  const bypassApiCheck = typeof window !== 'undefined' && 
    localStorage.getItem('bypassApiCheck') === 'true';
  
  return (
    bypassApiCheck ||
    isApiAvailable === false ||
    DEBUG_SETTINGS?.simulateCameraConnection ||
    (typeof window !== 'undefined' && window.DEBUG_SETTINGS?.apiServerError) ||
    (typeof window !== 'undefined' && window.DEBUG_SETTINGS?.simulateCameraConnection)
  );
};

/**
 * Shows appropriate toasts for simulation mode or errors
 */
export const showCameraStatusToasts = (
  hasInitialized: boolean, 
  apiAvailable: boolean | null, 
  detectedCameras: CameraDevice[]
) => {
  if (hasInitialized && apiAvailable !== false) {
    if (detectedCameras.length === 0) {
      toast({
        title: "No Cameras Detected",
        description: "No cameras were found. Please check connections and try again.",
        variant: "destructive"
      });
    } else if (!detectedCameras.some(camera => camera.connected)) {
      toast({
        title: "Cameras Disconnected",
        description: "Cameras were detected but are not responding. Check power and connections.",
        variant: "destructive"
      });
    } else {
      const connectedCount = detectedCameras.filter(c => c.connected).length;
      toast({
        title: "Cameras Refreshed",
        description: `Found ${connectedCount} connected ${connectedCount === 1 ? 'camera' : 'cameras'}.`,
        variant: "default"
      });
    }
  }
  
  if (apiAvailable === false) {
    toast({
      title: "API Unavailable",
      description: "Camera control API is unavailable. Running in simulation mode.",
      variant: "default"
    });
  }
};

/**
 * Shows troubleshooting toasts for camera detection errors
 */
export const showTroubleshootingToasts = (hasInitialized: boolean, apiAvailable: boolean | null) => {
  if (hasInitialized && apiAvailable !== false) {
    toast({
      title: "Camera Detection Failed",
      description: `Could not detect connected cameras. Please check USB connections.`,
      variant: "destructive"
    });
  }
  
  toast({
    title: "Troubleshooting Suggestions",
    description: "1. Ensure cameras are powered on.\n2. Check USB connections.\n3. Restart the application.",
    variant: "default"
  });
};
