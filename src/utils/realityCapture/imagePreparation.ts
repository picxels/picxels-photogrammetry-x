
import { 
  Session, 
  CapturedImage, 
  SessionImage,
} from '@/types';
import { executeCommand } from '@/utils/commandUtils';
import { toast } from '@/components/ui/use-toast';
import { processImage } from '@/utils/imageProcessingUtils';

/**
 * Helper function to convert SessionImage to CapturedImage for compatibility
 */
export const sessionImageToCapturedImage = (image: SessionImage): CapturedImage => {
  return {
    id: image.id,
    camera: image.camera,
    filePath: image.filePath,
    previewUrl: image.previewUrl || "", // Provide default value
    timestamp: image.timestamp || image.dateCaptured,
    angle: image.angle ? parseFloat(image.angle) : undefined,
    hasMask: image.hasMask,
    hasColorProfile: image.hasColorProfile,
    maskPath: image.maskPath,
    path: image.filePath,
    sharpness: image.sharpness,
    croppedWidth: undefined
  };
};

/**
 * Prepare session images for RealityCapture processing
 */
export const prepareImagesForRealityCapture = async (session: Session): Promise<boolean> => {
  try {
    console.log(`Preparing ${session.images.length} images for Reality Capture processing`);
    
    // Create the session directory if it doesn't exist
    const sessionDir = `/tmp/reality_capture/${session.id}`;
    await executeCommand(`mkdir -p ${sessionDir}/images`);
    
    // Process each image - in a real implementation, we'd:
    // 1. Apply color profile if not already applied
    // 2. Generate masks if needed
    // 3. Copy/link images to the RC processing directory
    for (const image of session.images) {
      try {
        // Check if the image is a string (ID) or an object
        const imageId = typeof image === 'string' ? image : image.id;
        const imageObj = typeof image === 'string' 
          ? session.images.find(img => typeof img !== 'string' && img.id === imageId) as SessionImage | undefined
          : image as SessionImage;
          
        if (!imageObj || !imageObj.filePath) {
          console.error(`No file path found for image ${imageId}`);
          continue;
        }
        
        // For full images (not just IDs), check if we need to process it
        if (typeof image !== 'string') {
          // Apply color profile if needed
          if (!imageObj.hasColorProfile) {
            // Convert to CapturedImage format for processImage
            await processImage(sessionImageToCapturedImage(imageObj));
          }
          
          // Generate mask if needed and if image is sharp enough
          if (!imageObj.hasMask && imageObj.sharpness && imageObj.sharpness > 80) {
            // Convert to CapturedImage format for processImage
            await processImage(sessionImageToCapturedImage(imageObj));
          }
        }
        
        // Copy or link the image to the RC working directory
        await executeCommand(`cp "${imageObj.filePath}" "${sessionDir}/images/"`);
      } catch (imageError) {
        console.error(`Error processing image for RC:`, imageError);
      }
    }
    
    console.log(`Images prepared for Reality Capture in ${sessionDir}`);
    return true;
  } catch (error) {
    console.error(`Error preparing images for Reality Capture:`, error);
    toast({
      title: "Preparation Failed",
      description: "Could not prepare images for processing.",
      variant: "destructive"
    });
    return false;
  }
};

/**
 * Check if all images in a session have masks
 */
export const checkImageMasks = (session: Session): boolean => {
  // Count images with masks
  let totalImages = 0;
  let maskedImages = 0;
  
  for (const image of session.images) {
    totalImages++;
    
    // Check if the image has a mask
    const hasMask = typeof image === 'string'
      ? session.images.find(img => typeof img !== 'string' && img.id === image)?.hasMask
      : image.hasMask;
    
    if (hasMask) {
      maskedImages++;
    }
  }
  
  // Return true if all images have masks
  return totalImages > 0 && maskedImages === totalImages;
};
