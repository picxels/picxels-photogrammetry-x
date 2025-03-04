
import { useState, useCallback, useEffect } from "react";
import { CameraDevice, CapturedImage, Session } from "@/types";
import { toast } from "@/components/ui/use-toast";
import { captureImage, detectCameras } from "@/utils/cameraUtils";
import { saveImageLocally } from "@/utils/fileSystem";

interface UseCameraControlProps {
  currentSession: Session;
  onImageCaptured: (image: CapturedImage) => void;
  currentAngle?: number;
}

export const useCameraControl = ({ 
  currentSession, 
  onImageCaptured, 
  currentAngle 
}: UseCameraControlProps) => {
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCapturing, setIsCapturing] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  const [errorRetryCount, setErrorRetryCount] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

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

  useEffect(() => {
    // Initialize camera detection only once on component mount
    refreshCameras();
    
    // Set up periodic camera status check
    const intervalId = setInterval(() => {
      if (!isCapturing && !isLoading) {
        // For periodic checks, set isRefreshing to true to avoid loading spinner
        setIsRefreshing(true);
        refreshCameras();
      }
    }, 60000); // Check every minute
    
    return () => clearInterval(intervalId);
  }, [refreshCameras, isCapturing, isLoading]);

  const handleCapture = async (camera: CameraDevice) => {
    if (isCapturing || !camera.connected) return;
    
    try {
      setIsCapturing(true);
      
      // Update camera status to capturing
      setCameras(prev => prev.map(c => 
        c.id === camera.id ? { ...c, status: "capturing" } : c
      ));
      
      console.log(`Capturing image from ${camera.name} (${camera.id})...`);
      
      // Trigger the capture
      const image = await captureImage(camera.id, currentSession.id, currentAngle);
      
      if (image) {
        // Save the image locally
        await saveImageLocally(image);
        
        // Update camera status back to idle
        setCameras(prev => prev.map(c => 
          c.id === camera.id ? { ...c, status: "idle" } : c
        ));
        
        // Notify parent component
        onImageCaptured(image);
        
        toast({
          title: "Image Captured",
          description: `${camera.name} captured an image successfully.`
        });
      } else {
        // If image is null, there was a problem
        setCameras(prev => prev.map(c => 
          c.id === camera.id ? { ...c, status: "error" } : c
        ));
        
        toast({
          title: "Capture Failed",
          description: `Failed to capture image from ${camera.name}. Trying to reconnect...`,
          variant: "destructive"
        });
        
        // Try to reconnect to the camera
        await refreshCameras();
      }
    } catch (error) {
      console.error("Capture failed:", error);
      toast({
        title: "Capture Failed",
        description: "Failed to capture or save the image. Refreshing camera connection...",
        variant: "destructive"
      });
      
      // Reset camera status to error
      setCameras(prev => prev.map(c => 
        c.id === camera.id ? { ...c, status: "error" } : c
      ));
      
      // Try to reconnect to the camera
      await refreshCameras();
    } finally {
      setIsCapturing(false);
    }
  };

  const handleCaptureAll = async () => {
    if (isCapturing) return;
    
    try {
      setIsCapturing(true);
      
      // Update all camera statuses to capturing
      setCameras(prev => prev.map(c => 
        c.connected ? { ...c, status: "capturing" } : c
      ));
      
      // Capture from each camera sequentially
      const connectedCameras = cameras.filter(c => c.connected);
      console.log(`Capturing from all ${connectedCameras.length} connected cameras...`);
      
      for (const camera of connectedCameras) {
        const image = await captureImage(camera.id, currentSession.id, currentAngle);
        
        if (image) {
          await saveImageLocally(image);
          onImageCaptured(image);
        }
      }
      
      // Reset camera statuses to idle
      setCameras(prev => prev.map(c => 
        c.connected ? { ...c, status: "idle" } : c
      ));
      
      toast({
        title: "Capture Complete",
        description: `Images captured from all ${connectedCameras.length} connected cameras.`
      });
    } catch (error) {
      console.error("Capture all failed:", error);
      toast({
        title: "Capture Failed",
        description: "Failed to capture from one or more cameras.",
        variant: "destructive"
      });
      
      // Reset camera statuses to error
      setCameras(prev => prev.map(c => ({ ...c, status: "error" })));
    } finally {
      setIsCapturing(false);
      
      // Refresh camera status after capture attempt is complete
      setTimeout(refreshCameras, 1000);
    }
  };

  return {
    cameras,
    isLoading,
    isCapturing,
    lastUpdateTime,
    refreshCameras,
    handleCapture,
    handleCaptureAll
  };
};
