
import { useState, useCallback, useEffect } from "react";
import { CameraDevice } from "@/types";
import { detectCameras } from "@/utils/cameraDiscoveryUtils";
import { DEBUG_SETTINGS } from "@/config/jetson.config";
import { useApiHealthCheck } from "./useApiHealthCheck";
import { 
  getSimulatedCameras, 
  shouldUseSimulationMode, 
  showCameraStatusToasts, 
  showTroubleshootingToasts 
} from "./useCameraSimulation";
import { isJetsonPlatform } from "@/utils/platformUtils";

export const useCameraDetection = () => {
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  const [errorRetryCount, setErrorRetryCount] = useState(0);
  const [hasInitialized, setHasInitialized] = useState(false);
  
  // Use the API health check hook
  const { apiAvailable } = useApiHealthCheck();

  const refreshCameras = useCallback(async () => {
    try {
      // Set proper loading/refreshing state
      if (!isRefreshing) {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }
      
      console.log("Refreshing camera status (manual refresh)...");
      console.log("API available:", apiAvailable);
      console.log("IsJetsonPlatform:", isJetsonPlatform());
      
      let detectedCameras: CameraDevice[] = [];
      
      // Check if we should use simulation mode - respects the shouldUseSimulationMode logic
      const simulationMode = shouldUseSimulationMode();
      console.log("Using simulation mode:", simulationMode);
      
      try {
        if (simulationMode) {
          console.log("Using simulation mode for camera detection");
          detectedCameras = getSimulatedCameras();
        } else {
          // Use real camera detection if we're on Jetson and API is available
          console.log("Using real camera detection");
          detectedCameras = await detectCameras();
          
          // Important: If no cameras were detected in real mode, return empty array
          // Do not fall back to simulated cameras in real mode
          console.log("Real camera detection found:", detectedCameras.length, "cameras");
        }
      } catch (error) {
        console.error("Error during camera detection:", error);
        
        if (simulationMode) {
          // Only use simulated cameras in simulation mode
          detectedCameras = getSimulatedCameras();
          console.log("Created mock cameras since we're in simulation mode");
        } else {
          // In real mode, return empty array or disconnected state
          if (cameras.length > 0) {
            // If we had cameras before but failed to detect now, mark them as disconnected
            detectedCameras = cameras.map(camera => ({
              ...camera,
              connected: false,
              status: "error"
            }));
          } else {
            // Return empty array in real mode if detection failed
            detectedCameras = [];
          }
        }
      }
      
      // Log the detected cameras
      console.log("Final detected cameras:", detectedCameras);
      
      setCameras(detectedCameras);
      setLastUpdateTime(new Date());
      
      setErrorRetryCount(0);
      setHasInitialized(true);
      
      // Show appropriate toasts based on results
      showCameraStatusToasts(hasInitialized, apiAvailable, detectedCameras);
      
    } catch (error) {
      console.error("Failed to detect cameras:", error);
      
      const newRetryCount = errorRetryCount + 1;
      setErrorRetryCount(newRetryCount);
      setHasInitialized(true);
      
      // Show troubleshooting toasts
      showTroubleshootingToasts(hasInitialized, apiAvailable);
      
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [cameras, errorRetryCount, hasInitialized, isRefreshing, apiAvailable]);

  // Force disable cameras if debug setting is enabled
  useEffect(() => {
    if (window.DEBUG_SETTINGS?.forceDisableAllCameras && cameras.length > 0) {
      setCameras(cameras.map(camera => ({
        ...camera,
        connected: false,
        status: "error"
      })));
    }
  }, [cameras]);

  // Initial camera detection - run only once on component mount
  useEffect(() => {
    // Call refresh cameras on initial load only
    if (!hasInitialized) {
      refreshCameras();
    }
    
    // Important: No polling interval here, only run on initial load
    // and manual refresh button clicks
    
    // Cleanup function
    return () => {
      // No cleanup needed since we removed the polling
    };
  }, [refreshCameras, hasInitialized]);

  return {
    cameras,
    setCameras,
    isLoading,
    isRefreshing,
    setIsRefreshing, 
    lastUpdateTime,
    refreshCameras,
    apiAvailable
  };
};
