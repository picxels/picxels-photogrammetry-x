
import { useEffect, useRef, useState } from "react";
import { CameraDevice, CapturedImage, Session } from "@/types";
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
  // Get camera detection functionality
  const { 
    cameras, 
    isLoading, 
    isRefreshing, 
    lastUpdateTime, 
    refreshCameras, 
    setCameras 
  } = useCameraDetection();
  
  // Camera capture functionality
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
