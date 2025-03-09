
import { useState } from "react";
import { CameraDevice, CapturedImage, Session } from "@/types";
import { useImageCaptureSingle } from "./useImageCaptureSingle";
import { useImageCaptureAll } from "./useImageCaptureAll";

interface UseCameraCaptureProps {
  currentSession: Session;
  onImageCaptured: (image: CapturedImage) => void;
  currentAngle?: number;
  cameras: CameraDevice[];
  setCameras: React.Dispatch<React.SetStateAction<CameraDevice[]>>;
  refreshCameras: () => Promise<void>;
}

export const useCameraCapture = ({
  currentSession,
  onImageCaptured,
  currentAngle,
  cameras,
  setCameras,
  refreshCameras
}: UseCameraCaptureProps) => {
  const [isCapturing, setIsCapturing] = useState(false);

  const { handleCapture: singleCapture } = useImageCaptureSingle({
    currentSession,
    onImageCaptured,
    currentAngle,
    setCameras,
    refreshCameras
  });

  const { handleCaptureAll: captureAll } = useImageCaptureAll({
    currentSession,
    onImageCaptured,
    currentAngle,
    cameras,
    setCameras,
    refreshCameras
  });

  const handleCapture = async (camera: CameraDevice) => {
    if (isCapturing || !camera.connected) return;
    
    try {
      setIsCapturing(true);
      await singleCapture(camera);
    } finally {
      setIsCapturing(false);
    }
  };

  const handleCaptureAll = async () => {
    if (isCapturing) return;
    
    try {
      setIsCapturing(true);
      await captureAll();
    } finally {
      setIsCapturing(false);
    }
  };

  return {
    isCapturing,
    handleCapture,
    handleCaptureAll
  };
};
