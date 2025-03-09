
import { toast } from "@/components/ui/use-toast";
import { 
  shouldUseFallbackData, 
  getRandomInt, 
  notifyFallbackMode,
  ensureModelsLoaded 
} from "./aiUtils";

// Sample fallback subjects for development mode
const FALLBACK_SUBJECTS = [
  {
    subject: "Antique Vase",
    description: "A decorative ceramic vase with floral patterns from the mid-20th century.",
    tags: ["ceramic", "antique", "vase", "decorative", "floral"]
  },
  {
    subject: "Chess Piece",
    description: "A carved wooden knight chess piece with detailed craftsmanship.",
    tags: ["chess", "wooden", "game piece", "carved", "knight"]
  },
  {
    subject: "3D Printed Model",
    description: "A 3D printed architectural model of a modern building with geometric design.",
    tags: ["3d print", "architecture", "model", "building", "geometric"]
  },
  {
    subject: "Vintage Camera",
    description: "A mid-century film camera with metal body and manual controls.",
    tags: ["camera", "vintage", "photography", "analog", "retro"]
  },
  {
    subject: "Crystal Sculpture",
    description: "A handcrafted crystal sculpture with intricate internal patterns.",
    tags: ["crystal", "sculpture", "art", "transparent", "decorative"]
  }
];

// Function to analyze subject using LLM
export const analyzeSubjectWithLLM = async (
  imagePath: string
): Promise<{subject: string, description: string, tags: string[]}> => {
  console.log(`Analyzing subject with LLM for image: ${imagePath}`);
  
  // Check if we should use fallbacks
  if (shouldUseFallbackData()) {
    console.log("Using fallback data for subject analysis");
    
    // Only show the notification once per session
    const hasNotified = sessionStorage.getItem("fallback-notified");
    if (!hasNotified) {
      notifyFallbackMode();
      sessionStorage.setItem("fallback-notified", "true");
    }
    
    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 800));
    
    // Select a random subject from our fallbacks
    const fallbackIndex = getRandomInt(0, FALLBACK_SUBJECTS.length - 1);
    const result = FALLBACK_SUBJECTS[fallbackIndex];
    
    console.log(`Fallback subject analysis complete: ${result.subject}`);
    
    return result;
  }
  
  // Real implementation for Jetson platform
  try {
    // Ensure LLM model is loaded
    const loadedModels = await ensureModelsLoaded();
    
    if (!loadedModels.llm.loaded) {
      throw new Error("Failed to load LLM model");
    }
    
    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 1200));
    
    // Mock analysis results (in production, this would be from the LLM)
    const subjects = [
      {
        subject: "Antique Vase",
        description: "A decorative ceramic vase with floral patterns from the mid-20th century.",
        tags: ["ceramic", "antique", "vase", "decorative", "floral"]
      },
      {
        subject: "Chess Piece",
        description: "A carved wooden knight chess piece with detailed craftsmanship.",
        tags: ["chess", "wooden", "game piece", "carved", "knight"]
      },
      {
        subject: "3D Printed Model",
        description: "A 3D printed architectural model of a modern building with geometric design.",
        tags: ["3d print", "architecture", "model", "building", "geometric"]
      }
    ];
    
    // Select a random subject for demonstration
    const result = subjects[Math.floor(Math.random() * subjects.length)];
    
    console.log(`Subject analysis complete: ${result.subject}`);
    
    return result;
  } catch (error) {
    console.error("Error analyzing subject:", error);
    throw error;
  }
};
