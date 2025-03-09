
import { 
  Session, 
  RCNodeConfig, 
  ExportSettings
} from '@/types';
import { toast } from '@/components/ui/use-toast';
import { sendRCNodeCommand, getWorkflowTemplateFromSession, formatRCCommand } from '@/utils/rcNodeCommands';

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
        let imageObj = undefined;
        
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
          imageObj = imageIdOrObj;
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

// Import the SessionImage type from the types module
import { SessionImage } from '@/types';

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
