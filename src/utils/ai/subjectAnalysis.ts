
import { toast } from "@/components/ui/use-toast";
import { 
  shouldUseFallbackData, 
  getRandomInt, 
  notifyFallbackMode,
  ensureModelsLoaded 
} from "./aiUtils";
import { analyzeImage, isOllamaAvailable, pullModelIfNeeded } from "@/services/ollamaService";
import { OLLAMA_CONFIG } from "@/config/jetsonAI.config";
import { isJetsonPlatform } from "../platformUtils";

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

// Convert image file to base64
const imageFileToBase64 = async (imagePath: string): Promise<string> => {
  try {
    // In a real implementation, this would read the file from disk
    // and convert it to base64. For now, we'll return a mock
    return "data:image/jpeg;base64,mockBase64Data";
  } catch (error) {
    console.error("Error converting image to base64:", error);
    throw error;
  }
};

// Extract tags from LLM response
const extractTagsFromResponse = (response: string): string[] => {
  // Look for patterns like "Tags:" or "Keywords:" or list formats
  const tagsRegex = /(?:tags|keywords|categories):\s*(.*?)(?:\n|$)/i;
  const match = response.match(tagsRegex);
  
  if (match && match[1]) {
    return match[1].split(/,\s*/).filter(tag => tag.trim().length > 0);
  }
  
  // If no explicit tags section, just extract nouns as potential tags
  const words = response.split(/\s+/);
  const potentialTags = words.filter(word => 
    word.length > 3 && !word.match(/^(the|and|this|that|with|from|have|been|would|could|should)$/i)
  );
  
  // Take up to 5 unique words as tags
  return [...new Set(potentialTags)].slice(0, 5);
};

// Extract subject and description from LLM response
const parseAnalysisResponse = (response: string): {subject: string, description: string, tags: string[]} => {
  // Default values
  let subject = "Unknown Object";
  let description = response.trim();
  let tags: string[] = [];
  
  // Try to extract subject from first line or sentence
  const firstLine = response.split(/\n/)[0];
  if (firstLine && firstLine.length < 50) {
    subject = firstLine.replace(/^(this is|i see|the image shows)\s+an?\s+/i, '').trim();
  } else {
    // Try to extract from first sentence
    const firstSentence = response.split(/\.\s+/)[0];
    if (firstSentence && firstSentence.length < 100) {
      subject = firstSentence.replace(/^(this is|i see|the image shows)\s+an?\s+/i, '').trim();
    } else {
      // Just use first 40 chars as subject if we can't parse it well
      subject = response.substring(0, 40).trim() + "...";
    }
  }
  
  // Capitalize first letter of subject
  subject = subject.charAt(0).toUpperCase() + subject.slice(1);
  
  // Extract tags
  tags = extractTagsFromResponse(response);
  
  return { subject, description, tags };
};

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
  
  // Real implementation for Jetson platform with Ollama
  try {
    // Check if Ollama is available
    const ollamaAvailable = await isOllamaAvailable();
    
    if (!ollamaAvailable) {
      throw new Error("Ollama service is not available");
    }
    
    // Check if the vision model is available, pull if needed
    await pullModelIfNeeded(OLLAMA_CONFIG.defaultModels.vision);
    
    // Convert image to base64
    const imageBase64 = await imageFileToBase64(imagePath);
    
    // Create prompt for detailed object analysis
    const prompt = `
      Analyze this object in detail. 
      What is this object? 
      Describe it in a couple of sentences, mentioning materials, style, likely purpose.
      Include 5 descriptive keywords or tags.
    `;
    
    // Run analysis with Ollama vision model
    const response = await analyzeImage(imageBase64, prompt, OLLAMA_CONFIG.defaultModels.vision);
    
    // Parse the response
    const parsedResult = parseAnalysisResponse(response);
    
    console.log(`Subject analysis complete: ${parsedResult.subject}`);
    
    return parsedResult;
  } catch (error) {
    console.error("Error analyzing subject:", error);
    
    // Show error toast
    toast({
      title: "Analysis Error",
      description: "Failed to analyze image. Using fallback data.",
      variant: "destructive"
    });
    
    // Fallback to mock data
    const fallbackIndex = getRandomInt(0, FALLBACK_SUBJECTS.length - 1);
    return FALLBACK_SUBJECTS[fallbackIndex];
  }
};
