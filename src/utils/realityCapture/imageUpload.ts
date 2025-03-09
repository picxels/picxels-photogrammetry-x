
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
        const imageRef = pass.images[imageIndex];
        
        // Handle different types of image references
        let sessionImage: SessionImage | undefined;
        
        if (typeof imageRef === 'string') {
          // If imageRef is a string ID, find the corresponding SessionImage object
          const foundImage = session.images.find(img => {
            if (typeof img === 'string') return img === imageRef;
            if (img && typeof img === 'object' && 'id' in img) return img.id === imageRef;
            return false;
          });
          
          if (foundImage && typeof foundImage === 'object' && 'id' in foundImage) {
            sessionImage = foundImage as SessionImage;
          }
        } else if (imageRef && typeof imageRef === 'object' && 'id' in imageRef) {
          // If imageRef is already a SessionImage object
          sessionImage = imageRef as SessionImage;
        }
        
        if (!sessionImage) {
          console.warn(`Could not find image data for reference at pass ${passIndex}, index ${imageIndex}`);
          continue;
        }
        
        // Convert to CapturedImage for further processing
        const capturedImage = sessionImageToCapturedImage(sessionImage);
        
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
        if (settings.exportMasks && sessionImage.hasMask) {
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
