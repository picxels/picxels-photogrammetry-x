
import { useState } from "react";
import { CameraDevice, CapturedImage, Session } from "@/types";
import { toast } from "@/components/ui/use-toast";
import { captureImage } from "@/utils/cameraUtils";
import { saveImageLocally } from "@/utils/fileSystem";
import { applyColorProfile, getCameraTypeFromId } from "@/utils/colorProfileUtils";
import { useImageProcessing } from "./useImageProcessing";

interface UseImageCaptureAllProps {
  currentSession: Session;
  onImageCaptured: (image: CapturedImage) => void;
  currentAngle?: number;
  cameras: CameraDevice[];
  setCameras: React.Dispatch<React.SetStateAction<CameraDevice[]>>;
  refreshCameras: () => Promise<void>;
}

export const useImageCaptureAll = ({
  currentSession,
  onImageCaptured,
  currentAngle,
  cameras,
  setCameras,
  refreshCameras
}: UseImageCaptureAllProps) => {
  const { processImage } = useImageProcessing();

  const handleCaptureAll = async () => {
    try {
      // Update all camera statuses to capturing
      setCameras(prev => prev.map(c => 
        c.connected ? { ...c, status: "capturing" } : c
      ));
      
      // Capture from each camera sequentially
      const connectedCameras = cameras.filter(c => c.connected);
      console.log(`Capturing from all ${connectedCameras.length} connected cameras...`);
      
      for (const camera of connectedCameras) {
        try {
          const image = await captureImage(camera.id, currentSession.id, currentAngle);
          
          if (image) {
            await saveImageLocally(image);
            
            // Process the image (apply color profile and possibly mask)
            const processedImage = await processImage(image);
            
            // Notify with the processed image
            onImageCaptured(processedImage);
          }
        } catch (cameraError) {
          console.error(`Error capturing from camera ${camera.id}:`, cameraError);
          
          // Update just this camera's status to error
          setCameras(prev => prev.map(c => 
            c.id === camera.id ? { ...c, status: "error" } : c
          ));
          
          // Continue with next camera
          continue;
        }
      }
      
      // Reset camera statuses to idle for connected cameras
      setCameras(prev => prev.map(c => 
        c.connected ? { ...c, status: "idle" } : c
      ));
      
      toast({
        title: "Capture Complete",
        description: `Images captured from all ${connectedCameras.length} connected cameras with color profiles applied.`
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
      // Refresh camera status after capture attempt is complete
      setTimeout(refreshCameras, 1000);
    }
  };

  return {
    handleCaptureAll
  };
};
