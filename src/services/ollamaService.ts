
/**
 * Ollama API Service
 * 
 * Service for interacting with locally running Ollama API to run LLMs.
 */

import { toast } from "@/components/ui/use-toast";
import { OLLAMA_CONFIG } from "@/config/jetsonAI.config";
import { isJetsonPlatform, shouldUseSimulationMode } from "@/utils/platformUtils";

// Types for Ollama API
interface OllamaGenerateRequest {
  model: string;
  prompt: string;
  system?: string;
  template?: string;
  context?: number[];
  options?: {
    temperature?: number;
    num_predict?: number;
    top_k?: number;
    top_p?: number;
    repeat_penalty?: number;
    presence_penalty?: number;
    frequency_penalty?: number;
    numa?: boolean;
  };
  images?: string[];
  format?: string;
  stream?: boolean;
}

interface OllamaGenerateResponse {
  model: string;
  created_at: string;
  response: string;
  context: number[];
  done: boolean;
  total_duration?: number;
  load_duration?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}

interface OllamaEmbeddingRequest {
  model: string;
  prompt: string;
  options?: {
    temperature?: number;
  };
}

interface OllamaEmbeddingResponse {
  embedding: number[];
}

interface OllamaModelInfo {
  name: string;
  modified_at: string;
  size: number;
  digest: string;
  details: {
    parent_model: string;
    format: string;
    family: string;
    families: string[];
    parameter_size: string;
    quantization_level: string;
  };
}

// Check if Ollama is available on the system
export const isOllamaAvailable = async (): Promise<boolean> => {
  // If we're in simulation mode, return true for development convenience
  if (shouldUseSimulationMode()) {
    console.log("Ollama check: Running in simulation mode, assuming Ollama is available");
    return true;
  }
  
  // Only run this check on actual Jetson platform
  if (!isJetsonPlatform()) {
    console.log("Ollama check: Not on Jetson platform, assuming Ollama is not available");
    return false;
  }
  
  try {
    const response = await fetch(`${OLLAMA_CONFIG.apiUrl}/api/tags`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.warn("Ollama service not available:", response.status);
      return false;
    }
    
    const data = await response.json();
    return Array.isArray(data.models);
  } catch (error) {
    console.error("Error checking Ollama availability:", error);
    return false;
  }
};

// Get list of available models
export const getAvailableModels = async (): Promise<OllamaModelInfo[]> => {
  if (shouldUseSimulationMode()) {
    // Return mock models in simulation mode
    return [
      {
        name: "llama3.2:8b",
        modified_at: new Date().toISOString(),
        size: 4800000000,
        digest: "sha256:123456",
        details: {
          parent_model: "",
          format: "gguf",
          family: "llama",
          families: ["llama"],
          parameter_size: "8B",
          quantization_level: "Q4_K_M"
        }
      },
      {
        name: "phi3:mini",
        modified_at: new Date().toISOString(),
        size: 1900000000,
        digest: "sha256:abcdef",
        details: {
          parent_model: "",
          format: "gguf",
          family: "phi",
          families: ["phi"],
          parameter_size: "3.8B",
          quantization_level: "Q4_K_M"
        }
      }
    ];
  }
  
  try {
    const response = await fetch(`${OLLAMA_CONFIG.apiUrl}/api/tags`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get models: ${response.status}`);
    }
    
    const data = await response.json();
    return data.models;
  } catch (error) {
    console.error("Error getting Ollama models:", error);
    throw error;
  }
};

// Run text generation with Ollama
export const generateText = async (
  prompt: string,
  model: string = OLLAMA_CONFIG.defaultModels.text,
  systemPrompt?: string,
  options?: OllamaGenerateRequest['options']
): Promise<string> => {
  if (shouldUseSimulationMode()) {
    // Return mock responses in simulation mode
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const responses = [
      "This appears to be an antique ceramic vase with intricate floral patterns. The design suggests it's from the mid-20th century.",
      "I can see a wooden chess piece, specifically a knight, with detailed carving work. It appears to be made of polished hardwood.",
      "This is a 3D printed architectural model showing a modern building design with multiple geometric elements.",
      "The image shows a vintage film camera from approximately the 1950s or 1960s, with manual controls and a metal body."
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  }
  
  try {
    const generateRequest: OllamaGenerateRequest = {
      model,
      prompt,
      system: systemPrompt,
      options: {
        temperature: 0.7,
        num_predict: OLLAMA_CONFIG.maxTokens,
        ...(options || {})
      }
    };
    
    const response = await fetch(`${OLLAMA_CONFIG.apiUrl}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(generateRequest)
    });
    
    if (!response.ok) {
      throw new Error(`Ollama generate failed: ${response.status}`);
    }
    
    const data: OllamaGenerateResponse = await response.json();
    return data.response;
  } catch (error) {
    console.error("Error generating text with Ollama:", error);
    throw error;
  }
};

// Run image analysis with vision model
export const analyzeImage = async (
  base64Image: string,
  prompt: string = "Describe this object in detail. What is it?",
  model: string = OLLAMA_CONFIG.defaultModels.vision
): Promise<string> => {
  if (shouldUseSimulationMode()) {
    // Return mock vision analysis in simulation mode
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const responses = [
      "The image shows a detailed architectural model of a modernist house. It appears to be a scale representation with clean lines and minimalist design. The model includes multiple levels, large windows, and what looks like a flat roof typical of contemporary architecture.",
      "This is a vintage film camera, likely from the mid-20th century. It has a classic design with a metal body, manual control dials, and what appears to be a viewfinder on top. The lens is prominent, and the camera has the characteristic shape of rangefinder or SLR cameras from the 1950s-1960s era.",
      "The image depicts a decorative ceramic vase with a distinctive glazed finish. It has a rounded body and narrow neck, with flowing patterns visible on its surface. The craftsmanship suggests it's handmade, possibly using traditional pottery techniques. The color appears to have a gradient effect typical of certain glazing methods."
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  }
  
  try {
    const generateRequest: OllamaGenerateRequest = {
      model,
      prompt,
      images: [base64Image],
      options: {
        temperature: 0.3,
        num_predict: OLLAMA_CONFIG.maxTokens
      }
    };
    
    const response = await fetch(`${OLLAMA_CONFIG.apiUrl}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(generateRequest)
    });
    
    if (!response.ok) {
      throw new Error(`Ollama image analysis failed: ${response.status}`);
    }
    
    const data: OllamaGenerateResponse = await response.json();
    return data.response;
  } catch (error) {
    console.error("Error analyzing image with Ollama:", error);
    throw error;
  }
};

// Get embeddings from text
export const getEmbeddings = async (
  text: string,
  model: string = OLLAMA_CONFIG.defaultModels.embedding
): Promise<number[]> => {
  if (shouldUseSimulationMode()) {
    // Return mock embeddings in simulation mode
    await new Promise(resolve => setTimeout(resolve, 300));
    return Array.from({ length: 384 }, () => Math.random() * 2 - 1);
  }
  
  try {
    const embeddingRequest: OllamaEmbeddingRequest = {
      model,
      prompt: text
    };
    
    const response = await fetch(`${OLLAMA_CONFIG.apiUrl}/api/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(embeddingRequest)
    });
    
    if (!response.ok) {
      throw new Error(`Ollama embeddings failed: ${response.status}`);
    }
    
    const data: OllamaEmbeddingResponse = await response.json();
    return data.embedding;
  } catch (error) {
    console.error("Error getting embeddings from Ollama:", error);
    throw error;
  }
};

// Check if specific model is available
export const isModelAvailable = async (modelName: string): Promise<boolean> => {
  if (shouldUseSimulationMode()) {
    return true;
  }
  
  try {
    const models = await getAvailableModels();
    return models.some(model => model.name === modelName);
  } catch (error) {
    console.error(`Error checking if model ${modelName} is available:`, error);
    return false;
  }
};

// Pull model if not available
export const pullModelIfNeeded = async (modelName: string): Promise<boolean> => {
  // Skip in simulation mode
  if (shouldUseSimulationMode()) {
    return true;
  }
  
  try {
    const isAvailable = await isModelAvailable(modelName);
    
    if (isAvailable) {
      console.log(`Model ${modelName} is already available`);
      return true;
    }
    
    console.log(`Model ${modelName} not found, attempting to pull...`);
    
    toast({
      title: "Downloading Model",
      description: `Pulling ${modelName} from Ollama repository. This may take a while.`,
      duration: 5000,
    });
    
    const response = await fetch(`${OLLAMA_CONFIG.apiUrl}/api/pull`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name: modelName })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to pull model ${modelName}: ${response.status}`);
    }
    
    toast({
      title: "Model Downloaded",
      description: `${modelName} is now available for use.`,
      duration: 3000,
    });
    
    return true;
  } catch (error) {
    console.error(`Error pulling model ${modelName}:`, error);
    
    toast({
      title: "Model Download Failed",
      description: `Could not download ${modelName}. Using fallback options.`,
      variant: "destructive",
      duration: 5000,
    });
    
    return false;
  }
};
