
import { useEffect, useRef } from "react";
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

  // Use a ref to track if we've initialized
  const initializedRef = useRef(false);
  
  useEffect(() => {
    // Initialize camera detection only once on component mount
    // Only if not initialized yet
    if (!initializedRef.current) {
      initializedRef.current = true;
      refreshCameras();
    }
    
    // No auto-refresh interval to prevent flickering
    
    return () => {
      // Cleanup function is empty since we no longer create an interval
    };
  }, [refreshCameras]);

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
