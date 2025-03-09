
// Export all functions from the realityCapture modules
export * from './imagePreparation';
export * from './datasetPreparation';
export * from './filenameUtils';
export * from './imageUpload';
export * from './workflowProcessing';

// Add a combined export function for convenience
import { Session, RCNodeConfig, ExportSettings } from '@/types';
import { prepareRealityCaptureDataset } from './datasetPreparation';
import { uploadSessionImagesToRCNode } from './imageUpload';
import { processWithRealityCapture } from './workflowProcessing';
import { toast } from '@/components/ui/use-toast';

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
