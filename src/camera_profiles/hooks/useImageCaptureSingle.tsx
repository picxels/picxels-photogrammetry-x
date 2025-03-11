
import { useState } from "react";
import { CameraDevice, CapturedImage, Session } from "@/types";
import { toast } from "@/components/ui/use-toast";
import { captureImage } from "@/utils/cameraUtils";
import { saveImageLocally } from "@/utils/fileSystem";
import { processImage } from "@/utils/imageProcessingUtils";
import { isEfficientViTAvailable } from "@/services/efficientViT";

interface UseImageCaptureSingleProps {
  currentSession: Session;
  onImageCaptured: (image: CapturedImage) => void;
  currentAngle?: number;
  setCameras: React.Dispatch<React.SetStateAction<CameraDevice[]>>;
  refreshCameras: () => Promise<void>;
}

export const useImageCaptureSingle = ({
  currentSession,
  onImageCaptured,
  currentAngle,
  setCameras,
  refreshCameras
}: UseImageCaptureSingleProps) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCapture = async (camera: CameraDevice) => {
    if (!camera.connected) return;
    
    try {
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
        
        // Set processing status for UI feedback
        setIsProcessing(true);
        setCameras(prev => prev.map(c => 
          c.id === camera.id ? { ...c, status: "processing" } : c
        ));
        
        // Check if we have EfficientViT available
        const hasEfficientViT = await isEfficientViTAvailable();
        
        // Process the image (apply color profile and mask if available)
        const processedImage = await processImage(image);
        
        // Update camera status back to idle
        setCameras(prev => prev.map(c => 
          c.id === camera.id ? { ...c, status: "idle" } : c
        ));
        
        setIsProcessing(false);
        
        // Notify parent component with the processed image
        onImageCaptured(processedImage);
        
        toast({
          title: "Image Captured",
          description: `${camera.name} captured an image successfully${hasEfficientViT ? " with AI segmentation" : ""}.`
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
      
      setIsProcessing(false);
      
      // Try to reconnect to the camera
      await refreshCameras();
    }
  };

  return {
    handleCapture,
    isProcessing
  };
};
