import { ExportSettings, RCNodeConfig, Session } from "@/types";
import { toast } from "@/components/ui/use-toast";
import { exportSessionToRealityCapture } from "./rcRealityCaptureService";

// Save session data locally
export const saveSession = async (session: Session): Promise<void> => {
  // In a real implementation, this would save to local storage or IndexedDB
  try {
    console.log("Saving session:", session);
    
    // Simulate save delay
    await new Promise((resolve) => setTimeout(resolve, 800));
    
    toast({
      title: "Session Saved",
      description: `${session.name} has been saved successfully.`
    });
    
    return Promise.resolve();
  } catch (error) {
    console.error("Error saving session:", error);
    toast({
      title: "Save Failed",
      description: "Failed to save session data.",
      variant: "destructive"
    });
    
    return Promise.reject(error);
  }
};

// Save a captured image locally
export const saveImageLocally = async (imageData: any): Promise<void> => {
  // In a real implementation, this would save the image to local storage or disk
  console.log("Saving image locally:", imageData);
  
  // Simulate save delay
  await new Promise((resolve) => setTimeout(resolve, 300));
  
  return Promise.resolve();
};

/**
 * Save a byte array to a file
 * @param sourcePath The source file path
 * @param targetPath The target file path
 */
export const saveByteArray = async (sourcePath: string, targetPath: string): Promise<void> => {
  // In a real implementation, this would copy the file from source to target
  console.log(`Saving file from ${sourcePath} to ${targetPath}`);
  
  // Simulate copy operation delay
  await new Promise((resolve) => setTimeout(resolve, 300));
  
  return Promise.resolve();
};

// Export session data and images
export const exportSession = async (
  session: Session,
  settings: ExportSettings,
  rcNodeConfig?: RCNodeConfig
): Promise<void> => {
  try {
    console.log("Exporting session with settings:", settings);
    
    // Log what's being exported
    if (settings.exportPng) {
      console.log("Exporting 8-bit PNGs for construction");
    }
    
    if (settings.exportTiff) {
      console.log("Exporting 16-bit TIFFs for texturing");
    }
    
    if (settings.exportMasks) {
      console.log("Exporting B&W masks for background removal");
    }
    
    // If sending to Reality Capture and RC Node config is provided
    if (settings.sendToRealityCapture && rcNodeConfig && rcNodeConfig.isConnected) {
      console.log("Sending data to Reality Capture Node");
      await exportSessionToRealityCapture(session, rcNodeConfig, settings);
    } else if (settings.sendToRealityCapture) {
      console.log("Cannot send to Reality Capture Node: not connected or no config provided");
    }
    
    // Simulate export delay
    await new Promise((resolve) => setTimeout(resolve, 1200));
    
    toast({
      title: "Export Complete",
      description: `${session.name} has been exported successfully.`
    });
    
    return Promise.resolve();
  } catch (error) {
    console.error("Error exporting session:", error);
    toast({
      title: "Export Failed",
      description: "Failed to export session data.",
      variant: "destructive"
    });
    
    return Promise.reject(error);
  }
};
