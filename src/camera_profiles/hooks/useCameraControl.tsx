
import { CameraDevice, CapturedImage, Session } from "@/types";
import { useCameraDetection } from "./useCameraDetection";
import { useCameraCapture } from "./useCameraCapture";
import { useCameraInitialization } from "./useCameraInitialization";

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

  // Initialize cameras on mount
  useCameraInitialization({ refreshCameras });

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
