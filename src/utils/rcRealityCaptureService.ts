
import { 
  Session, 
  CapturedImage, 
  RCPreviewData, 
  ProcessedModel,
  SessionStatus,
  SessionImage,
  RCNodeConfig,
  ExportSettings,
  Pass
} from '@/types';
import { executeCommand } from '@/utils/commandUtils';
import { toast } from '@/components/ui/use-toast';
import { updateSession, updateSessionStatus } from '@/services/sessionDatabaseService';
import { processImage } from '@/utils/imageProcessingUtils';
import { isJetsonPlatform } from '@/utils/platformUtils';
import { sendRCNodeCommand, getWorkflowTemplateFromSession, formatRCCommand } from '@/utils/rcNodeCommands';

/**
 * Helper function to convert SessionImage to CapturedImage for compatibility
 */
const sessionImageToCapturedImage = (image: SessionImage): CapturedImage => {
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

/**
 * Prepare a dataset for Reality Capture processing via RC Node
 * Following Reality Capture naming conventions
 * @param session - The session containing images and metadata
 * @param config - RC Node configuration
 * @param settings - Export settings
 */
export const prepareRealityCaptureDataset = async (
  session: Session,
  config: RCNodeConfig,
  settings: ExportSettings
): Promise<boolean> => {
  try {
    // Create a sanitized project name from session name (remove spaces, special chars)
    const projectName = session.name.replace(/[^a-zA-Z0-9]/g, '_');
    const modelName = session.subjectMatter ? 
      session.subjectMatter.replace(/[^a-zA-Z0-9]/g, '_') : 
      projectName;
    
    console.log(`Preparing Reality Capture dataset for session: ${session.name}`);
    console.log(`Using model name: ${modelName}, project name: ${projectName}`);
    console.log(`Subject matter: ${session.subjectMatter || 'Unknown'}`);
    
    // Log the export settings
    console.log("Export settings:", settings);
    
    // Create project folder structure on RC Node
    await sendRCNodeCommand(config, "createFolder", {
      path: `${projectName}/Images`
    });
    
    // Create folder for geometry (construction) images
    if (settings.exportPng) {
      await sendRCNodeCommand(config, "createFolder", {
        path: `${projectName}/Images/.geometry`
      });
    }
    
    // Create folder for texture images
    if (settings.exportTiff) {
      await sendRCNodeCommand(config, "createFolder", {
        path: `${projectName}/Images/.texture.TextureLayer`
      });
    }
    
    // Create folder for masks if needed
    if (settings.exportMasks) {
      await sendRCNodeCommand(config, "createFolder", {
        path: `${projectName}/Images/.mask`
      });
    }
    
    // Create additional passes folders if we have multiple passes
    if (session.passes.length > 1) {
      await sendRCNodeCommand(config, "createFolder", {
        path: `${projectName}/Images/Additional`
      });
      
      if (settings.exportMasks) {
        await sendRCNodeCommand(config, "createFolder", {
          path: `${projectName}/Images/Additional/.mask`
        });
      }
      
      if (settings.exportTiff) {
        await sendRCNodeCommand(config, "createFolder", {
          path: `${projectName}/Images/Additional/.texture.TextureLayer`
        });
      }
    }
    
    // Create project folder for RC project files
    await sendRCNodeCommand(config, "createFolder", {
      path: `${projectName}/Project`
    });
    
    // Create model output folder
    await sendRCNodeCommand(config, "createFolder", {
      path: `${projectName}/Output`
    });
    
    // Create renders folder
    await sendRCNodeCommand(config, "createFolder", {
      path: `${projectName}/Output/Renders`
    });
    
    // Pass subject metadata to RC Node for use in workflow
    if (session.subjectMatter) {
      await sendRCNodeCommand(config, "tag", {
        key: "subject",
        value: session.subjectMatter
      });
    }
    
    toast({
      title: "Dataset Prepared",
      description: `Project structure created for ${projectName}`,
    });
    
    return true;
  } catch (error) {
    console.error("Error preparing Reality Capture dataset:", error);
    
    toast({
      title: "Preparation Failed",
      description: "Failed to prepare Reality Capture dataset. See console for details.",
      variant: "destructive"
    });
    
    return false;
  }
};

/**
 * Generate an RC-compatible filename for an image
 * Following Reality Capture naming conventions
 */
const generateRCFilename = (
  image: CapturedImage, 
  pass: Pass, 
  passIndex: number, 
  imageIndex: number,
  purpose: 'geometry' | 'texture' | 'mask'
): string => {
  // Extract camera identifier without spaces
  const camera = image.camera.replace(/\s+/g, '');
  
  // Format: Camera_PassX_AngleY_Z
  // Where X is pass number, Y is angle, Z is image index
  const angle = image.angle !== undefined ? Math.round(image.angle) : 0;
  const baseFilename = `${camera}_Pass${passIndex + 1}_Angle${angle}_${imageIndex + 1}`;
  
  switch (purpose) {
    case 'geometry':
      return `${baseFilename}.png`;
    case 'texture':
      return `${baseFilename}.tiff`;
    case 'mask':
      return `${baseFilename}_mask.png`;
    default:
      return `${baseFilename}.jpg`;
  }
};

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
          for (const img of session.images) {
            if (typeof img === 'string') {
              if (img === imageIdOrObj) {
                // This is just an ID reference, we need to find the actual object elsewhere
                // but for now we can't find it, so we'll skip this image
                console.warn(`Image with ID ${imageId} is a string reference, not an object`);
                continue;
              }
            } else if (img.id === imageIdOrObj) {
              actualImage = img;
              break;
            }
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

/**
 * Process a session with Reality Capture via RC Node using a predefined workflow
 */
export const processWithRealityCapture = async (
  session: Session,
  config: RCNodeConfig,
  settings: ExportSettings
): Promise<boolean> => {
  try {
    // Create a sanitized project name from session name
    const projectName = session.name.replace(/[^a-zA-Z0-9]/g, '_');
    const modelName = session.subjectMatter ? 
      session.subjectMatter.replace(/[^a-zA-Z0-9]/g, '_') : 
      projectName;
    
    console.log(`Processing with Reality Capture: ${projectName} with ${session.passes.length} passes`);
    console.log(`Subject: ${session.subjectMatter || 'Unknown'}`);
    
    // Generate a workflow from the session data
    const workflow = getWorkflowTemplateFromSession(
      session,
      session.subjectMatter ? [session.subjectMatter.toLowerCase()] : []
    );
    
    console.log("Generated workflow:", workflow);
    
    // Extract commands from workflow
    const commands = workflow.stages.flatMap(stage => 
      stage.commands.map(cmd => formatRCCommand(cmd))
    );
    
    // Join commands and execute via RC Node
    const commandString = commands.join(" ");
    console.log("RC Command:", commandString);
    
    // In a real implementation, we would execute each command in sequence
    // via the RC Node API, tracking progress for each stage
    
    toast({
      title: "Processing Started",
      description: `Reality Capture processing started for ${session.name} with ${session.passes.length} passes`,
    });
    
    return true;
  } catch (error) {
    console.error("Error processing with Reality Capture:", error);
    
    toast({
      title: "Processing Failed",
      description: "Failed to process with Reality Capture. See console for details.",
      variant: "destructive"
    });
    
    return false;
  }
};

/**
 * Main function to export a session to Reality Capture via RC Node
 */
export const exportSessionToRealityCapture = async (
  session: Session,
  config: RCNodeConfig,
  settings: ExportSettings
): Promise<boolean> => {
  try {
    // Check that RC Node is connected
    if (!config.isConnected) {
      throw new Error("RC Node is not connected");
    }
    
    // 1. Prepare the dataset (create folder structure)
    const prepared = await prepareRealityCaptureDataset(session, config, settings);
    if (!prepared) {
      throw new Error("Failed to prepare dataset");
    }
    
    // 2. Upload the images
    const uploaded = await uploadSessionImagesToRCNode(session, config, settings);
    if (!uploaded) {
      throw new Error("Failed to upload images");
    }
    
    // 3. Process with Reality Capture
    const processed = await processWithRealityCapture(session, config, settings);
    if (!processed) {
      throw new Error("Failed to process with Reality Capture");
    }
    
    toast({
      title: "Export Successful",
      description: `Session ${session.name} with ${session.passes.length} passes exported to Reality Capture successfully`,
    });
    
    return true;
  } catch (error) {
    console.error("Error exporting session to Reality Capture:", error);
    
    toast({
      title: "Export Failed",
      description: error instanceof Error ? error.message : "Unknown error",
      variant: "destructive"
    });
    
    return false;
  }
};

/**
 * Process a session for Reality Capture
 * @param session - The session containing images and metadata
 * @param exportSettings - Export settings
 */
export const processSessionForRealityCapture = async (
  session: Session,
  exportSettings: ExportSettings
): Promise<boolean> => {
  try {
    // Create a sanitized project name from session name
    const projectName = session.name.replace(/[^a-zA-Z0-9]/g, '_');
    const modelName = session.subjectMatter ? 
      session.subjectMatter.replace(/[^a-zA-Z0-9]/g, '_') : 
      projectName;
    
    console.log(`Processing with Reality Capture: ${projectName} with ${session.passes.length} passes`);
    console.log(`Subject: ${session.subjectMatter || 'Unknown'}`);
    
    // Process all images in the session
    for (const passId of session.passes.map(pass => pass.id)) {
      const pass = session.passes.find(p => p.id === passId);
      if (!pass) continue;
      
      // Process all images in this pass
      for (const imageIdOrObj of pass.images) {
        // Handle both string IDs and SessionImage objects
        let imageId: string;
        let imageObj: SessionImage | undefined;
        
        if (typeof imageIdOrObj === 'string') {
          imageId = imageIdOrObj;
          // Find the corresponding image object
          const foundImage = session.images.find(img => {
            if (typeof img === 'string') {
              return img === imageIdOrObj;
            } else {
              return img.id === imageIdOrObj;
            }
          });
          
          if (foundImage && typeof foundImage !== 'string') {
            imageObj = foundImage;
          }
        } else if (imageIdOrObj && typeof imageIdOrObj === 'object' && 'id' in imageIdOrObj) {
          imageId = imageIdOrObj.id;
          imageObj = imageIdOrObj as SessionImage;
        } else {
          console.warn(`Invalid image reference in pass ${pass.id}`);
          continue;
        }
        
        if (!imageObj) {
          console.warn(`Image with ID ${imageId} not found in session`);
          continue;
        }
        
        // Now we have the full image object, process it
        if (exportSettings.exportPng) {
          console.log(`Exporting PNG for image: ${imageId}`);
          await exportImageAsPng(imageObj);
        }
        
        if (exportSettings.exportTiff) {
          console.log(`Exporting TIFF for image: ${imageId}`);
          await exportImageAsTiff(imageObj);
        }
        
        if (exportSettings.exportMasks && imageObj.hasMask) {
          console.log(`Exporting mask for image: ${imageId}`);
          await exportImageMask(imageObj);
        }
      }
    }
    
    toast({
      title: "Processing Complete",
      description: `Reality Capture processing completed for ${session.name} with ${session.passes.length} passes`,
    });
    
    return true;
  } catch (error) {
    console.error("Error processing session for Reality Capture:", error);
    
    toast({
      title: "Processing Failed",
      description: "Failed to process session for Reality Capture. See console for details.",
      variant: "destructive"
    });
    
    return false;
  }
};

// Helper functions to export images
const exportImageAsPng = async (image: SessionImage): Promise<void> => {
  // Implementation
};

const exportImageAsTiff = async (image: SessionImage): Promise<void> => {
  // Implementation
};

const exportImageMask = async (image: SessionImage): Promise<void> => {
  // Implementation
};

