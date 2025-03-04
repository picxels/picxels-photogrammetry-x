
import { useState, useCallback } from "react";
import { CameraDevice } from "@/types";
import { toast } from "@/components/ui/use-toast";
import { detectCameras } from "@/utils/cameraUtils";

export const useCameraDetection = () => {
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  const [errorRetryCount, setErrorRetryCount] = useState(0);

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
      const detectedCameras = await detectCameras();
      setCameras(detectedCameras);
      setLastUpdateTime(new Date());
      
      // Reset retry count on successful detection
      setErrorRetryCount(0);
      
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
    } catch (error) {
      console.error("Failed to detect cameras:", error);
      
      // Increment retry count
      const newRetryCount = errorRetryCount + 1;
      setErrorRetryCount(newRetryCount);
      
      // Show error message with retry information
      toast({
        title: "Camera Detection Failed",
        description: `Could not detect connected cameras. ${newRetryCount < 3 ? "Retrying automatically..." : "Please check USB connections."}`,
        variant: "destructive"
      });
      
      // Auto retry up to 3 times
      if (newRetryCount < 3) {
        setTimeout(() => {
          refreshCameras();
        }, 2000);
      }
    } finally {
      // Always reset both loading states
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [errorRetryCount, isRefreshing]);

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
