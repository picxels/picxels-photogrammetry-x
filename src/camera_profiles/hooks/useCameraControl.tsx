
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
    // Only if not initialized yet, and add a timeout to prevent infinite loading
    if (!initializedRef.current) {
      initializedRef.current = true;
      refreshCameras();
      
      // Force exit loading state after 10 seconds if still loading
      const timeout = setTimeout(() => {
        if (isLoading) {
          console.log("Forcing exit from loading state after timeout");
          setCameras([]);
        }
      }, 10000);
      
      return () => clearTimeout(timeout);
    }
  }, [refreshCameras, isLoading, setCameras]);

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
