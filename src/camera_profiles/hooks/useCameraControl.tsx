
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
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    // Initialize camera detection only once on component mount
    // Only if not initialized yet
    if (!initializedRef.current) {
      initializedRef.current = true;
      refreshCameras();
    }
    
    // Set up periodic camera status check
    if (!intervalRef.current) {
      intervalRef.current = window.setInterval(() => {
        if (!isCapturing && !isLoading && !isRefreshing) {
          console.log("Running periodic camera status check...");
          // For periodic checks, set isRefreshing to true to avoid loading spinner
          setIsRefreshing(true);
          refreshCameras();
        } else {
          console.log("Skipping periodic camera check because another operation is in progress");
        }
      }, 60000); // Check every minute
    }
    
    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [refreshCameras, isCapturing, isLoading, isRefreshing, setIsRefreshing]);

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
