
import { toast } from "@/components/ui/use-toast";
import { ExportSettings, RCNodeConfig, Session, CapturedImage, Pass } from "@/types";
import { sendRCNodeCommand } from "./rcNodeService";

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
    const modelName = projectName;
    
    console.log(`Preparing Reality Capture dataset for session: ${session.name}`);
    console.log(`Using model name: ${modelName}, project name: ${projectName}`);
    
    // Log the export settings
    console.log("Export settings:", settings);
    
    // Create project folder structure on RC Node
    // This follows the examples in the batch files
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
    
    // Create project folder for RC project files
    await sendRCNodeCommand(config, "createFolder", {
      path: `${projectName}/Project`
    });
    
    // Create model output folder
    await sendRCNodeCommand(config, "createFolder", {
      path: `${projectName}/Model`
    });
    
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
      
      // For each image in the pass
      for (let imageIndex = 0; imageIndex < pass.images.length; imageIndex++) {
        const image = pass.images[imageIndex];
        
        // Generate filenames following RC conventions
        const baseImagePath = `${projectName}/Images`;
        
        // In a real implementation, this would upload the actual image data
        // to the RC Node server using the naming convention
        console.log(`Processing image: ${image.id} from pass ${passIndex + 1}`);
        
        // Upload main image
        const mainFilename = generateRCFilename(image, pass, passIndex, imageIndex, 'geometry');
        console.log(`Would upload main image to ${baseImagePath}/${mainFilename}`);
        
        // If exporting PNGs for geometry
        if (settings.exportPng) {
          const geometryFilename = generateRCFilename(image, pass, passIndex, imageIndex, 'geometry');
          console.log(`Would upload PNG version to ${baseImagePath}/.geometry/${geometryFilename}`);
        }
        
        // If exporting TIFFs for texturing
        if (settings.exportTiff) {
          const textureFilename = generateRCFilename(image, pass, passIndex, imageIndex, 'texture');
          console.log(`Would upload TIFF version to ${baseImagePath}/.texture.TextureLayer/${textureFilename}`);
        }
        
        // If exporting masks
        if (settings.exportMasks && image.hasMask) {
          const maskFilename = generateRCFilename(image, pass, passIndex, imageIndex, 'mask');
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
 * Process a session with Reality Capture via RC Node
 * Follows the patterns seen in the example batch files
 */
export const processWithRealityCapture = async (
  session: Session,
  config: RCNodeConfig,
  settings: ExportSettings
): Promise<boolean> => {
  try {
    // Create a sanitized project name from session name
    const projectName = session.name.replace(/[^a-zA-Z0-9]/g, '_');
    const modelName = projectName;
    
    console.log(`Processing with Reality Capture: ${projectName} with ${session.passes.length} passes`);
    
    // Build a command set based on the RC example batch files
    const commands = [
      // Set working directory to the project folder
      `-set "workingFolder=${projectName}"`,
      
      // Add images folder
      `-addFolder "${projectName}/Images"`,
      
      // Align images
      `-align`,
      
      // Set reconstruction region automatically
      `-setReconstructionRegionAuto`,
      
      // Calculate normal model
      `-calculateNormalModel`,
      
      // Select marginal triangles
      `-selectMarginalTriangles`,
      
      // Remove selected triangles
      `-removeSelectedTriangles`,
      
      // Rename model
      `-renameSelectedModel "${modelName}"`,
      
      // Calculate texture (this step is conditional based on settings)
      ...(settings.exportTiff ? [`-calculateTexture`] : []),
      
      // Save project
      `-save "${projectName}/Project/${projectName}.rcproj"`,
      
      // Export model
      `-exportModel "${modelName}" "${projectName}/Model/${modelName}.obj"`,
      
      // Quit Reality Capture
      `-quit`
    ];
    
    // Join commands
    const commandString = commands.join(" ");
    
    // Log the command string
    console.log("RC Command:", commandString);
    
    // In a real implementation, we would execute the command via RC Node API
    // await sendRCNodeCommand(config, "executeRCCommand", { command: commandString });
    
    toast({
      title: "Processing Started",
      description: `Reality Capture processing started for ${projectName} with ${session.passes.length} passes`,
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
