
import { useEffect } from "react";
import { CapturedImage, Session } from "@/types";
import { useCameraDetection } from "./useCameraDetection";
import { useCameraCapture } from "./useCameraCapture";

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
  const {
    cameras,
    setCameras,
    isLoading,
    isRefreshing,
    setIsRefreshing,
    lastUpdateTime,
    refreshCameras
  } = useCameraDetection();

  const {
    isCapturing,
    handleCapture,
    handleCaptureAll
  } = useCameraCapture({
    currentSession,
    onImageCaptured,
    currentAngle,
    cameras,
    setCameras,
    refreshCameras
  });

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
  }, [refreshCameras, isCapturing, isLoading, setIsRefreshing]);

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
