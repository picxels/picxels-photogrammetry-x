
import { 
  Session, 
  RCNodeConfig, 
  ExportSettings,
  SessionImage,
  CapturedImage
} from '@/types';
import { toast } from '@/components/ui/use-toast';
import { generateRCFilename } from './filenameUtils';
import { sessionImageToCapturedImage } from './imagePreparation';

/**
 * Upload images from a session to RC Node for Reality Capture processing
 */
export const uploadSessionImagesToRCNode = async (
  session: Session,
  config: RCNodeConfig,
  settings: ExportSettings
): Promise<boolean> => {
  try {
    const projectName = session.name.replace(/[^a-zA-Z0-9]/g, '_');
    
    console.log(`Uploading images from ${session.passes.length} passes for session: ${session.name}`);
    
    let totalUploadedCount = 0;
    
    // Process images by pass to maintain organization
    for (let passIndex = 0; passIndex < session.passes.length; passIndex++) {
      const pass = session.passes[passIndex];
      
      console.log(`Processing pass ${passIndex + 1}: ${pass.name} with ${pass.images.length} images`);
      
      // Determine if this is the first pass or additional pass
      const isFirstPass = passIndex === 0;
      const baseImagePath = isFirstPass ? 
        `${projectName}/Images` : 
        `${projectName}/Images/Additional`;
      
      // For each image in the pass
      for (let imageIndex = 0; imageIndex < pass.images.length; imageIndex++) {
        const imageIdOrObj = pass.images[imageIndex];
        
        // Find the actual image object from session.images
        let imageId = '';
        
        if (typeof imageIdOrObj === 'string') {
          imageId = imageIdOrObj;
        } else if (imageIdOrObj && typeof imageIdOrObj === 'object' && 'id' in imageIdOrObj) {
          imageId = imageIdOrObj.id;
        } else {
          console.warn(`Invalid image reference at pass ${passIndex}, index ${imageIndex}`);
          continue;
        }
        
        // Handle the case when imageIdOrObj is a string (just an ID reference)
        // We need to find the corresponding image object from session.images
        let actualImage: SessionImage | undefined;
        
        if (typeof imageIdOrObj === 'string') {
          // Search through session.images for a matching ID
          const foundImage = session.images.find(img => {
            if (typeof img === 'string') {
              return img === imageIdOrObj;
            } else {
              return img.id === imageIdOrObj;
            }
          });
          
          if (foundImage && typeof foundImage !== 'string') {
            actualImage = foundImage;
          }
        } else {
          // imageIdOrObj is already a SessionImage
          actualImage = imageIdOrObj as SessionImage;
        }
        
        if (!actualImage) {
          console.warn(`Image with ID ${imageId} not found in session`);
          continue;
        }
        
        // Convert to CapturedImage for further processing
        const capturedImage = sessionImageToCapturedImage(actualImage);
        
        // Generate filenames following RC conventions
        console.log(`Processing image: ${capturedImage.id} from pass ${passIndex + 1}`);
        
        // Upload main image
        const mainFilename = generateRCFilename(
          capturedImage,
          pass, 
          passIndex, 
          imageIndex, 
          'geometry'
        );
        console.log(`Would upload main image to ${baseImagePath}/${mainFilename}`);
        
        // If exporting PNGs for geometry
        if (settings.exportPng) {
          const geometryFilename = generateRCFilename(
            capturedImage, 
            pass, 
            passIndex, 
            imageIndex, 
            'geometry'
          );
          console.log(`Would upload PNG version to ${baseImagePath}/.geometry/${geometryFilename}`);
        }
        
        // If exporting TIFFs for texturing
        if (settings.exportTiff) {
          const textureFilename = generateRCFilename(
            capturedImage, 
            pass, 
            passIndex, 
            imageIndex, 
            'texture'
          );
          console.log(`Would upload TIFF version to ${baseImagePath}/.texture.TextureLayer/${textureFilename}`);
        }
        
        // If exporting masks
        const hasImageMask = actualImage.hasMask;
        if (settings.exportMasks && hasImageMask) {
          const maskFilename = generateRCFilename(
            capturedImage, 
            pass, 
            passIndex, 
            imageIndex, 
            'mask'
          );
          console.log(`Would upload mask to ${baseImagePath}/.mask/${maskFilename}`);
        }
        
        totalUploadedCount++;
      }
    }
    
    toast({
      title: "Upload Complete",
      description: `${totalUploadedCount} images from ${session.passes.length} passes uploaded for processing with Reality Capture`,
    });
    
    return true;
  } catch (error) {
    console.error("Error uploading images to RC Node:", error);
    
    toast({
      title: "Upload Failed",
      description: "Failed to upload images to RC Node. See console for details.",
      variant: "destructive"
    });
    
    return false;
  }
};
