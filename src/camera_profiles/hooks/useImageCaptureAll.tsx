
import { useState } from "react";
import { CameraDevice, CapturedImage, Session } from "@/types";
import { toast } from "@/components/ui/use-toast";
import { captureImage } from "@/utils/cameraUtils";
import { saveImageLocally } from "@/utils/fileSystem";
import { processImage } from "@/utils/imageProcessingUtils";
import { isEfficientViTAvailable } from "@/services/efficientViT";

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
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCaptureAll = async () => {
    try {
      // Update all camera statuses to capturing
      setCameras(prev => prev.map(c => 
        c.connected ? { ...c, status: "capturing" as const } : c
      ));
      
      // Capture from each camera sequentially
      const connectedCameras = cameras.filter(c => c.connected);
      console.log(`Capturing from all ${connectedCameras.length} connected cameras...`);
      
      // Check if we have EfficientViT available
      const hasEfficientViT = await isEfficientViTAvailable();
      
      for (const camera of connectedCameras) {
        try {
          const image = await captureImage(camera.id, currentSession.id, currentAngle);
          
          if (image) {
            await saveImageLocally(image);
            
            // Set processing status
            setIsProcessing(true);
            setCameras(prev => prev.map(c => 
              c.id === camera.id ? { ...c, status: "processing" as const } : c
            ));
            
            // Process the image (apply color profile and mask if available)
            const processedImage = await processImage(image);
            
            // Set camera back to idle
            setCameras(prev => prev.map(c => 
              c.id === camera.id ? { ...c, status: "idle" as const } : c
            ));
            
            // Notify with the processed image
            onImageCaptured(processedImage);
          }
        } catch (cameraError) {
          console.error(`Error capturing from camera ${camera.id}:`, cameraError);
          
          // Update just this camera's status to error
          setCameras(prev => prev.map(c => 
            c.id === camera.id ? { ...c, status: "error" as const } : c
          ));
          
          // Continue with next camera
          continue;
        }
      }
      
      setIsProcessing(false);
      
      // Reset camera statuses to idle for connected cameras
      setCameras(prev => prev.map(c => 
        c.connected ? { ...c, status: "idle" as const } : c
      ));
      
      toast({
        title: "Capture Complete",
        description: `Images captured from all ${connectedCameras.length} connected cameras${hasEfficientViT ? " with AI segmentation" : ""}.`
      });
    } catch (error) {
      console.error("Capture all failed:", error);
      toast({
        title: "Capture Failed",
        description: "Failed to capture from one or more cameras.",
        variant: "destructive"
      });
      
      // Reset camera statuses to error
      setCameras(prev => prev.map(c => ({ ...c, status: "error" as const })));
      setIsProcessing(false);
    } finally {
      // Refresh camera status after capture attempt is complete
      setTimeout(refreshCameras, 1000);
    }
  };

  return {
    handleCaptureAll,
    isProcessing
  };
};
