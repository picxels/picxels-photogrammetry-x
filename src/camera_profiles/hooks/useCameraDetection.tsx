
import { useState, useCallback, useEffect } from "react";
import { CameraDevice } from "@/types";
import { toast } from "@/components/ui/use-toast";
import { detectCameras } from "@/utils/cameraUtils";
import { DEBUG_SETTINGS } from "@/config/jetson.config";

export const useCameraDetection = () => {
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  const [errorRetryCount, setErrorRetryCount] = useState(0);
  const [hasInitialized, setHasInitialized] = useState(false);

  const refreshCameras = useCallback(async () => {
    try {
      // Only set loading true during the initial fetch, not on refreshes
      if (!isRefreshing) {
        setIsLoading(true);
      } else {
        // For refreshes, we use a separate state to avoid flashing the loading spinner
        setIsRefreshing(true);
      }
      
      console.log("Refreshing camera status...");
      
      // Handle potential errors from detectCameras
      let detectedCameras: CameraDevice[] = [];
      try {
        detectedCameras = await detectCameras();
      } catch (error) {
        console.error("Error during camera detection:", error);
        
        // If detection fails completely, mark all existing cameras as disconnected
        // rather than showing an empty list
        if (cameras.length > 0) {
          detectedCameras = cameras.map(camera => ({
            ...camera,
            connected: false,
            status: "error"
          }));
        }
        
        // Show error toast
        toast({
          title: "Camera Detection Error",
          description: "Failed to detect cameras. Check connections and server status.",
          variant: "destructive"
        });
      }
      
      setCameras(detectedCameras);
      setLastUpdateTime(new Date());
      
      // Reset retry count on successful detection
      setErrorRetryCount(0);
      setHasInitialized(true);
      
      // Only show toast notifications after the first initialization
      if (hasInitialized) {
        // Show toast with detection results
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
    } catch (error) {
      console.error("Failed to detect cameras:", error);
      
      // Increment retry count
      const newRetryCount = errorRetryCount + 1;
      setErrorRetryCount(newRetryCount);
      setHasInitialized(true);
      
      // Show error message with retry information
      if (hasInitialized) {
        toast({
          title: "Camera Detection Failed",
          description: `Could not detect connected cameras. ${newRetryCount < 3 ? "Retrying automatically..." : "Please check USB connections."}`,
          variant: "destructive"
        });
      }
      
      // Auto retry up to 3 times
      if (newRetryCount < 3) {
        setTimeout(() => {
          refreshCameras();
        }, 2000);
      } else {
        // Provide suggestions for troubleshooting
        toast({
          title: "Troubleshooting Suggestions",
          description: "1. Ensure cameras are powered on.\n2. Check USB connections.\n3. Restart the application.",
          variant: "default"
        });
      }
    } finally {
      // Always reset both loading states
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [cameras, errorRetryCount, hasInitialized, isRefreshing]);

  // Make sure cameras are properly showing disconnected status even when detection fails
  useEffect(() => {
    // Handle DEBUG_SETTINGS.forceDisableAllCameras
    if (DEBUG_SETTINGS?.forceDisableAllCameras && cameras.length > 0) {
      setCameras(cameras.map(camera => ({
        ...camera,
        connected: false,
        status: "error"
      })));
    }
  }, [cameras]);

  return {
    cameras,
    setCameras,
    isLoading,
    isRefreshing,
    setIsRefreshing,
    lastUpdateTime,
    refreshCameras
  };
};
