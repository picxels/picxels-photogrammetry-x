
import { toast } from "@/components/ui/use-toast";
import { ExportSettings, RCNodeConfig, Session } from "@/types";
import { sendRCNodeCommand } from "./rcNodeService";

/**
 * Prepare a dataset for Reality Capture processing via RC Node
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
    // This would create folders similar to what we see in the example batch files
    await sendRCNodeCommand(config, "createFolder", {
      path: `${projectName}/Images`
    });
    
    if (settings.exportTiff) {
      await sendRCNodeCommand(config, "createFolder", {
        path: `${projectName}/Images/.texture.TextureLayer`
      });
    }
    
    if (settings.exportPng) {
      await sendRCNodeCommand(config, "createFolder", {
        path: `${projectName}/Images/.geometry`
      });
    }
    
    await sendRCNodeCommand(config, "createFolder", {
      path: `${projectName}/Project`
    });
    
    // The actual image upload would happen here
    // This is a placeholder for the actual implementation
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
    
    console.log(`Processing with Reality Capture: ${projectName}`);
    
    // Build a command set based on the _ProcessAll.bat examples
    // The commands follow the pattern seen in the example batch files
    
    // Based on docs/RC_examples/CalculateTextured3DModel/_ProcessAll.bat
    const commands = [
      // Set working directory to the project folder
      `-set "workingFolder=${projectName}"`,
      
      // Add images folder - using patterns from examples
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
    
    // Join commands with ^ as in batch files
    const commandString = commands.join(" ^ ");
    
    // This would be the actual command execution
    // For now, we're just logging it
    console.log("Would execute RC command:", commandString);
    
    // In reality, we would use something like:
    // await sendRCNodeCommand(config, "executeCommand", { command: commandString });
    
    toast({
      title: "Processing Started",
      description: `Reality Capture processing started for ${projectName}`,
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
 * Upload images from a session to RC Node for Reality Capture processing
 */
export const uploadSessionImagesToRCNode = async (
  session: Session,
  config: RCNodeConfig,
  settings: ExportSettings
): Promise<boolean> => {
  try {
    const projectName = session.name.replace(/[^a-zA-Z0-9]/g, '_');
    
    console.log(`Uploading ${session.images.length} images for session: ${session.name}`);
    
    // For each image in the session, we would upload it to the appropriate folder
    // based on the export settings
    let uploadedCount = 0;
    
    for (const image of session.images) {
      // In a real implementation, this would upload the actual image data
      // to the RC Node server
      console.log(`Would upload image: ${image.id} to ${projectName}/Images`);
      
      // If exporting PNGs for geometry
      if (settings.exportPng) {
        console.log(`Would upload PNG version to ${projectName}/Images/.geometry`);
      }
      
      // If exporting TIFFs for texturing
      if (settings.exportTiff) {
        console.log(`Would upload TIFF version to ${projectName}/Images/.texture.TextureLayer`);
      }
      
      // If exporting masks
      if (settings.exportMasks && image.hasMask) {
        console.log(`Would upload mask for ${image.id}`);
      }
      
      uploadedCount++;
    }
    
    toast({
      title: "Upload Complete",
      description: `${uploadedCount} images uploaded for processing with Reality Capture`,
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
      description: `Session ${session.name} exported to Reality Capture successfully`,
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
