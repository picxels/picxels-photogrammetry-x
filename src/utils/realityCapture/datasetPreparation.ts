
import { 
  Session, 
  RCNodeConfig, 
  ExportSettings,
  Pass
} from '@/types';
import { toast } from '@/components/ui/use-toast';
import { sendRCNodeCommand } from '@/utils/rcNodeCommands';

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
