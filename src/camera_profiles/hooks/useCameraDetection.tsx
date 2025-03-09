
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
  const [initTimeoutId, setInitTimeoutId] = useState<NodeJS.Timeout | null>(null);
  
  // Use the API health check hook
  const { apiAvailable } = useApiHealthCheck();

  const refreshCameras = useCallback(async () => {
    try {
      if (!isRefreshing) {
        setIsLoading(true);
        
        const timeoutId = setTimeout(() => {
          console.log("Force exiting loading state after timeout");
          setIsLoading(false);
          setHasInitialized(true);
        }, 10000);
        
        setInitTimeoutId(timeoutId);
      } else {
        setIsRefreshing(true);
      }
      
      console.log("Refreshing camera status...");
      console.log("API available:", apiAvailable);
      console.log("IsJetsonPlatform:", isJetsonPlatform());
      
      let detectedCameras: CameraDevice[] = [];
      
      // Check if we should use simulation mode
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
        }
      } catch (error) {
        console.error("Error during camera detection:", error);
        
        if (cameras.length > 0) {
          // If we had cameras before but failed to detect now, mark them as disconnected
          detectedCameras = cameras.map(camera => ({
            ...camera,
            connected: false,
            status: "error"
          }));
        } else if (DEBUG_SETTINGS.simulateCameraConnection || apiAvailable === false) {
          // Fallback to simulated cameras
          detectedCameras = getSimulatedCameras();
          console.log("Created mock cameras since API is unavailable or simulation is enabled");
        }
        
        if (error.message && error.message.includes("API returned status")) {
          if (typeof window !== 'undefined') {
            // Initialize with default values if window.DEBUG_SETTINGS is undefined
            window.DEBUG_SETTINGS = window.DEBUG_SETTINGS || {
              enableVerboseLogging: true,
              logNetworkRequests: true,
              simulateCameraConnection: true,
              simulateMotorConnection: true,
              apiServerError: true,
              forceUseLocalSamples: false,
              forceJetsonPlatformDetection: false
            };
            
            // Then ensure the required properties are set
            window.DEBUG_SETTINGS.apiServerError = true;
            window.DEBUG_SETTINGS.simulateCameraConnection = true;
          }
          
          detectedCameras = getSimulatedCameras();
          console.log("Created mock cameras due to API error");
        }
      }
      
      // Log the detected cameras
      console.log("Final detected cameras:", detectedCameras);
      
      setCameras(detectedCameras);
      setLastUpdateTime(new Date());
      
      setErrorRetryCount(0);
      setHasInitialized(true);
      
      if (initTimeoutId) {
        clearTimeout(initTimeoutId);
        setInitTimeoutId(null);
      }
      
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
      
      if (initTimeoutId) {
        clearTimeout(initTimeoutId);
        setInitTimeoutId(null);
      }
    }
  }, [cameras, errorRetryCount, hasInitialized, isRefreshing, initTimeoutId, apiAvailable]);

  useEffect(() => {
    return () => {
      if (initTimeoutId) {
        clearTimeout(initTimeoutId);
      }
    };
  }, [initTimeoutId]);

  useEffect(() => {
    if (window.DEBUG_SETTINGS?.forceDisableAllCameras && cameras.length > 0) {
      setCameras(cameras.map(camera => ({
        ...camera,
        connected: false,
        status: "error"
      })));
    }
  }, [cameras]);

  // Set up camera polling
  useEffect(() => {
    // Call refresh cameras on initial load
    refreshCameras();
    
    // Set up a polling interval to refresh camera status
    const intervalId = setInterval(() => {
      if (!isLoading && !isRefreshing) {
        refreshCameras();
      }
    }, 30000); // Check every 30 seconds
    
    return () => clearInterval(intervalId);
  }, [refreshCameras, isLoading, isRefreshing]);

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
