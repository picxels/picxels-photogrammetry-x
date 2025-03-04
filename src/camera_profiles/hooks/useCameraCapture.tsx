
import { useState } from "react";
import { CameraDevice, CapturedImage, Session } from "@/types";
import { toast } from "@/components/ui/use-toast";
import { captureImage } from "@/utils/cameraUtils";
import { saveImageLocally } from "@/utils/fileSystem";

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
    isCapturing,
    handleCapture,
    handleCaptureAll
  };
};
