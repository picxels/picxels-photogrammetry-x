
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
    isLoading,
    isCapturing,
    isRefreshing,
    lastUpdateTime,
    refreshCameras,
    handleCapture,
    handleCaptureAll
  } = useCameraCapture({
    currentSession,
    onImageCaptured,
    currentAngle,
  });

  // Use a ref to track if we've initialized
  const initializedRef = useRef(false);
  
  // Run camera detection once on component mount
  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      refreshCameras();
    }
  }, [refreshCameras]);

  return {
    cameras,
    isLoading,
    isCapturing,
    isRefreshing,
    lastUpdateTime,
    refreshCameras,
    handleCapture,
    handleCaptureAll
  };
};
