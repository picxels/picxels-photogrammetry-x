
import { useState } from "react";
import { CapturedImage } from "@/types";
import { processImage, checkImageSharpness, ensureColorProfile } from "@/utils/imageProcessingUtils";
import { toast } from "@/components/ui/use-toast";

export const useImageProcessing = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingImageId, setProcessingImageId] = useState<string | null>(null);

  const handleProcessImage = async (image: CapturedImage): Promise<CapturedImage | null> => {
    try {
      setIsProcessing(true);
      setProcessingImageId(image.id);
      
      // Ensure color profile is applied
      const imageWithColorProfile = await ensureColorProfile(image);
      
      // Check image sharpness
      const sharpness = await checkImageSharpness(imageWithColorProfile.filePath);
      
      // Process the image (apply segmentation if available)
      const processedImage = await processImage({
        ...imageWithColorProfile,
        sharpness
      });
      
      toast({
        title: "Image Processed",
        description: processedImage.hasMask ? 
          "Image processed with automatic segmentation mask." : 
          "Image processed successfully."
      });
      
      return processedImage;
    } catch (error) {
      console.error("Error processing image:", error);
      toast({
        title: "Processing Failed",
        description: "Failed to process image.",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsProcessing(false);
      setProcessingImageId(null);
    }
  };

  return {
    handleProcessImage,
    isProcessing,
    processingImageId
  };
};
