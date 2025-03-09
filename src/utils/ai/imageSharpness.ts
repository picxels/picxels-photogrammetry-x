
import { toast } from "@/components/ui/use-toast";
import { AIModels } from "./modelInitialization";
import { initializeAIModels } from "./modelInitialization";
import { shouldUseFallbackData, getRandomNumber, notifyFallbackMode } from "./fallbackUtils";

// Global variable to hold loaded models reference
let loadedModels: AIModels | null = null;

// Function to check image sharpness using loaded model
export const checkImageSharpness = async (
  imagePath: string,
  threshold: number = 0.75
): Promise<{isSharp: boolean, score: number}> => {
  console.log(`Checking sharpness for image: ${imagePath}`);
  
  // Check if we should use fallbacks
  if (shouldUseFallbackData()) {
    console.log("Using fallback data for sharpness check");
    
    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 300));
    
    // Generate a realistic sharpness score (biased toward sharper images)
    const mockScore = getRandomNumber(0.65, 0.95);
    const isSharp = mockScore > threshold;
    
    console.log(`Fallback sharpness check result: ${isSharp ? 'Sharp' : 'Blurry'} (score: ${mockScore.toFixed(2)})`);
    
    return {
      isSharp,
      score: mockScore
    };
  }
  
  // Real implementation for Jetson platform
  // Ensure sharpness model is loaded
  if (!loadedModels || !loadedModels.sharpness.loaded) {
    console.warn("Sharpness model not loaded, initializing now");
    loadedModels = await initializeAIModels();
    if (!loadedModels.sharpness.loaded) {
      throw new Error("Failed to load sharpness detection model");
    }
  }
  
  try {
    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    // In production, this would use the actual model inference result
    const mockScore = Math.random();
    const isSharp = mockScore > threshold;
    
    console.log(`Sharpness check result: ${isSharp ? 'Sharp' : 'Blurry'} (score: ${mockScore.toFixed(2)})`);
    
    return {
      isSharp,
      score: mockScore
    };
  } catch (error) {
    console.error("Error checking image sharpness:", error);
    throw error;
  }
};
