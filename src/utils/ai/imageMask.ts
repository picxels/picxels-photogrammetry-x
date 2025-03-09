
import { toast } from "@/components/ui/use-toast";
import { AIModels } from "./modelInitialization";
import { initializeAIModels } from "./modelInitialization";
import { shouldUseFallbackData, notifyFallbackMode } from "./fallbackUtils";

// Global variable to hold loaded models reference
let loadedModels: AIModels | null = null;

// Function to generate image mask using segmentation model
export const generateImageMask = async (
  imagePath: string
): Promise<string> => {
  console.log(`Generating mask for image: ${imagePath}`);
  
  // Check if we should use fallbacks
  if (shouldUseFallbackData()) {
    console.log("Using fallback data for mask generation");
    
    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    // Mock mask path (in production this would be the actual saved mask path)
    const maskPath = imagePath.replace(/\.[^/.]+$/, "_mask.png");
    
    console.log(`Fallback mask generated: ${maskPath}`);
    
    return maskPath;
  }
  
  // Real implementation for Jetson platform
  // Ensure mask model is loaded
  if (!loadedModels || !loadedModels.mask.loaded) {
    console.warn("Mask model not loaded, initializing now");
    loadedModels = await initializeAIModels();
    if (!loadedModels.mask.loaded) {
      throw new Error("Failed to load segmentation model");
    }
  }
  
  try {
    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 800));
    
    // Mock mask path (in production this would be the actual saved mask path)
    const maskPath = imagePath.replace(/\.[^/.]+$/, "_mask.png");
    
    console.log(`Mask generated: ${maskPath}`);
    
    return maskPath;
  } catch (error) {
    console.error("Error generating mask:", error);
    throw error;
  }
};
