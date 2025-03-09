
import { toast } from "@/components/ui/use-toast";
import { EFFICIENTVIT_CONFIG } from "@/config/jetsonAI.config";
import { executeCommand } from "@/utils/commandUtils";
import { isEfficientViTAvailable } from "./modelAvailability";

/**
 * Install EfficientViT if not already installed
 */
export const installEfficientViT = async (): Promise<boolean> => {
  try {
    console.log("Checking for EfficientViT installation...");
    
    // Check if already installed
    if (await isEfficientViTAvailable()) {
      console.log("EfficientViT is already installed");
      return true;
    }
    
    console.log("Installing EfficientViT from MIT-HAN-LAB...");
    
    // Run the installation script
    const installCommand = `bash ${EFFICIENTVIT_CONFIG.installScript}`;
    await executeCommand(installCommand);
    
    // Verify installation
    const isInstalled = await isEfficientViTAvailable();
    
    if (isInstalled) {
      console.log("EfficientViT installed successfully");
      toast({
        title: "EfficientViT Installed",
        description: "EfficientViT segmentation model has been installed successfully."
      });
      return true;
    } else {
      console.error("EfficientViT installation failed");
      toast({
        title: "Installation Failed",
        description: "Failed to install EfficientViT. Check system logs for details.",
        variant: "destructive"
      });
      return false;
    }
  } catch (error) {
    console.error("Error installing EfficientViT:", error);
    toast({
      title: "Installation Error",
      description: "Error installing EfficientViT: " + (error as Error).message,
      variant: "destructive"
    });
    return false;
  }
};
