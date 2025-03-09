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
  const [initTimeoutId, setInitTimeoutId] = useState<NodeJS.Timeout | null>(null);
  const [apiAvailable, setApiAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    const checkApiAvailability = async () => {
      try {
        const response = await fetch('/api/health', { 
          method: 'HEAD',
          headers: { 'Cache-Control': 'no-cache' }
        });
        setApiAvailable(response.ok);
        
        if (!response.ok) {
          console.warn('API health check failed, falling back to simulation mode');
          
          if (typeof window !== 'undefined') {
            window.DEBUG_SETTINGS = window.DEBUG_SETTINGS || {};
            window.DEBUG_SETTINGS.apiServerError = true;
            window.DEBUG_SETTINGS.simulateCameraConnection = true;
            window.DEBUG_SETTINGS.simulateMotorConnection = true;
          }
        }
      } catch (error) {
        console.error('API health check error:', error);
        setApiAvailable(false);
        
        if (typeof window !== 'undefined') {
          window.DEBUG_SETTINGS = window.DEBUG_SETTINGS || {};
          window.DEBUG_SETTINGS.apiServerError = true;
          window.DEBUG_SETTINGS.simulateCameraConnection = true;
          window.DEBUG_SETTINGS.simulateMotorConnection = true;
        }
      }
    };
    
    checkApiAvailability();
  }, []);

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
      
      const bypassApiCheck = localStorage.getItem('bypassApiCheck') === 'true';
      const simulationMode = DEBUG_SETTINGS?.simulateCameraConnection || apiAvailable === false || bypassApiCheck || DEBUG_SETTINGS?.apiServerError;
      
      let detectedCameras: CameraDevice[] = [];
      try {
        if (simulationMode) {
          console.log("Using simulation mode for camera detection");
          detectedCameras = [
            {
              id: "canon-001",
              name: "Canon EOS 550D",
              type: "DSLR",
              port: "usb:001,004",
              connected: true,
              status: "ready"
            },
            {
              id: "canon-002",
              name: "Canon EOS 600D",
              type: "DSLR",
              port: "usb:001,005",
              connected: true,
              status: "ready"
            }
          ];
        } else {
          detectedCameras = await detectCameras();
        }
      } catch (error) {
        console.error("Error during camera detection:", error);
        
        if (cameras.length > 0) {
          detectedCameras = cameras.map(camera => ({
            ...camera,
            connected: false,
            status: "error"
          }));
        } else if (DEBUG_SETTINGS.simulateCameraConnection || apiAvailable === false) {
          detectedCameras = [
            {
              id: "canon-001",
              name: "Canon EOS 550D",
              type: "DSLR",
              port: "usb:001,004",
              connected: true,
              status: "ready"
            },
            {
              id: "canon-002",
              name: "Canon EOS 600D",
              type: "DSLR",
              port: "usb:001,005",
              connected: true,
              status: "ready"
            }
          ];
          
          console.log("Created mock cameras since API is unavailable or simulation is enabled");
        }
        
        if (error.message && error.message.includes("API returned status")) {
          if (typeof window !== 'undefined') {
            window.DEBUG_SETTINGS = window.DEBUG_SETTINGS || {};
            window.DEBUG_SETTINGS.apiServerError = true;
            window.DEBUG_SETTINGS.simulateCameraConnection = true;
          }
          
          detectedCameras = [
            {
              id: "canon-001",
              name: "Canon EOS 550D",
              type: "DSLR",
              port: "usb:001,004",
              connected: true,
              status: "ready"
            },
            {
              id: "canon-002",
              name: "Canon EOS 600D",
              type: "DSLR",
              port: "usb:001,005",
              connected: true,
              status: "ready"
            }
          ];
          
          console.log("Created mock cameras due to API error");
        }
        
        if (apiAvailable === false) {
          toast({
            title: "API Unavailable",
            description: "Camera control API is unavailable. Running in simulation mode.",
            variant: "default"
          });
        } else {
          toast({
            title: "Camera Detection Error",
            description: "Failed to detect cameras. Check connections and server status.",
            variant: "destructive"
          });
        }
      }
      
      setCameras(detectedCameras);
      setLastUpdateTime(new Date());
      
      setErrorRetryCount(0);
      setHasInitialized(true);
      
      if (initTimeoutId) {
        clearTimeout(initTimeoutId);
        setInitTimeoutId(null);
      }
      
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
    } catch (error) {
      console.error("Failed to detect cameras:", error);
      
      const newRetryCount = errorRetryCount + 1;
      setErrorRetryCount(newRetryCount);
      setHasInitialized(true);
      
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
    refreshCameras,
    apiAvailable
  };
};
