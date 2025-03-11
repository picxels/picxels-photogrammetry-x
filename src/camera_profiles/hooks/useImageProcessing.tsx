
import { useState } from 'react';
import { CapturedImage } from "@/types";
import { toast } from "@/components/ui/use-toast";
import { processImage, ensureColorProfile } from "@/utils/imageProcessingUtils";

export const useImageProcessing = () => {
  const [processingImages, setProcessingImages] = useState<string[]>([]);

  const handleProcessImage = async (image: CapturedImage): Promise<CapturedImage> => {
    if (!image) return image;

    setProcessingImages(prev => [...prev, image.id]);
    
    try {
      // Process the image for photogrammetry
      const processedImage = await processImage(image);
      
      // Ensure the image has a color profile
      const finalImage = await ensureColorProfile(processedImage) as CapturedImage;
      
      return finalImage;
    } catch (error) {
      console.error("Error processing image:", error);
      toast({
        title: "Error processing image",
        description: "Please try again later",
        variant: "destructive"
      });
      return image;
    } finally {
      setProcessingImages(prev => prev.filter(id => id !== image.id));
    }
  };

  return {
    processingImages,
    handleProcessImage
  };
};
