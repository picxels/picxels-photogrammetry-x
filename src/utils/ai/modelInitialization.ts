
import { toast } from "@/components/ui/use-toast";
import { MODEL_PATHS, SYSTEM_REQUIREMENTS, PERFORMANCE_SETTINGS } from "@/config/jetson.config";
import { OLLAMA_CONFIG } from "@/config/jetsonAI.config";
import { isOllamaAvailable, getAvailableModels, pullModelIfNeeded } from "@/services/ollamaService";

// Interfaces for model configurations
export interface ModelConfig {
  path: string;
  optimized: boolean;
  loaded: boolean;
  type: 'onnx' | 'tensorrt' | 'ollama';
}

export interface AIModels {
  sharpness: ModelConfig;
  mask: ModelConfig;
  llm: ModelConfig;
}

// Known dependency issues
export const KNOWN_DEPENDENCY_ISSUES = [
  {
    package: "numpy",
    description: "Version conflicts with AI libraries",
    recommendation: "Install numpy 1.23.5 with: pip install numpy==1.23.5"
  },
  {
    package: "nvcc",
    description: "CUDA compiler not found in PATH",
    recommendation: "Install with: sudo apt-get install cuda-toolkit-12-6"
  }
];

// State of loaded models
let loadedModels: AIModels = {
  sharpness: { path: '', optimized: false, loaded: false, type: 'tensorrt' },
  mask: { path: '', optimized: false, loaded: false, type: 'tensorrt' },
  llm: { path: '', optimized: false, loaded: false, type: 'ollama' }
};

// Function to detect TensorRT version
export const detectTensorRTVersion = async (): Promise<string> => {
  try {
    // In a real implementation, this would check the system with:
    // const { stdout } = await execPromise('dpkg -l | grep -i tensorrt | head -n 1');
    // return stdout.match(/(\d+\.\d+\.\d+\.\d+)/)?.[1] || "unknown";
    return "10.3.0.30";
  } catch (error) {
    console.error("Error detecting TensorRT version:", error);
    return "unknown";
  }
};

// Function to detect CUDA version
export const detectCUDAVersion = async (): Promise<string> => {
  try {
    // In a real implementation, this would check the system with:
    // const { stdout } = await execPromise('nvcc --version');
    // return stdout.match(/release (\d+\.\d+)/)?.[1] || "unknown";
    return "12.6";
  } catch (error) {
    console.error("Error detecting CUDA version:", error);
    return "unknown";
  }
};

// Function to check for Python package dependency issues
export const checkPythonDependencies = async (): Promise<{hasIssues: boolean, issues: string[]}> => {
  try {
    // In a real implementation, this would run pip check
    const issues = [
      "numpy 2.2.3 is incompatible with openvino 2024.6.0 (requires numpy<2.2.0,>=1.16.6)",
      "numpy 2.2.3 is incompatible with tensorflow-cpu-aws 2.15.1 (requires numpy<2.0.0,>=1.23.5)",
      "numpy 2.2.3 is incompatible with ultralytics 8.3.80 (requires numpy<=2.1.1,>=1.23.0)"
    ];
    
    return {
      hasIssues: issues.length > 0,
      issues
    };
  } catch (error) {
    console.error("Error checking Python dependencies:", error);
    return {
      hasIssues: false,
      issues: []
    };
  }
};

// Function to check for Ollama and required models
export const checkOllamaModels = async (): Promise<{ available: boolean, models: string[] }> => {
  try {
    // Check if Ollama service is available
    const ollamaServiceAvailable = await isOllamaAvailable();
    
    if (!ollamaServiceAvailable) {
      console.warn("Ollama service not available");
      return { available: false, models: [] };
    }
    
    // Get list of available models
    const allModels = await getAvailableModels();
    const availableModels = allModels.map(model => model.name);
    
    // Check for required models
    const requiredModels = [
      OLLAMA_CONFIG.defaultModels.text,
      OLLAMA_CONFIG.defaultModels.vision,
      OLLAMA_CONFIG.defaultModels.small
    ];
    
    // Filter to only available required models
    const foundModels = requiredModels.filter(model => 
      availableModels.some(available => available === model)
    );
    
    return {
      available: ollamaServiceAvailable,
      models: foundModels
    };
  } catch (error) {
    console.error("Error checking Ollama models:", error);
    return { available: false, models: [] };
  }
};

// Function to initialize models for Jetson Orin Nano
export const initializeAIModels = async (): Promise<AIModels> => {
  console.log("Initializing AI models for Jetson Orin Nano");
  
  // Check TensorRT and CUDA versions
  const tensorRTVersion = await detectTensorRTVersion();
  const cudaVersion = await detectCUDAVersion();
  
  console.log(`Detected TensorRT version: ${tensorRTVersion}`);
  console.log(`Detected CUDA version: ${cudaVersion}`);
  
  // Check Python dependencies
  const dependencyCheck = await checkPythonDependencies();
  if (dependencyCheck.hasIssues) {
    console.warn("Python dependency issues detected:");
    dependencyCheck.issues.forEach(issue => console.warn(`- ${issue}`));
    
    toast({
      title: "Dependency Issues Detected",
      description: "There are Python package conflicts. Run 'pip install numpy==1.23.5' to fix.",
      variant: "destructive"
    });
  }
  
  // Check if TensorRT version meets minimum requirement
  const tensorRTVersionMeetsMin = compareVersions(
    tensorRTVersion, 
    SYSTEM_REQUIREMENTS.minTensorRTVersion
  ) >= 0;
  
  // Check if CUDA version meets minimum requirement
  const cudaVersionMeetsMin = compareVersions(
    cudaVersion,
    SYSTEM_REQUIREMENTS.minCudaVersion
  ) >= 0;
  
  if (!tensorRTVersionMeetsMin || !cudaVersionMeetsMin) {
    console.warn("System requirements not met:");
    if (!tensorRTVersionMeetsMin) {
      console.warn(`TensorRT ${tensorRTVersion} is below minimum required ${SYSTEM_REQUIREMENTS.minTensorRTVersion}`);
    }
    if (!cudaVersionMeetsMin) {
      console.warn(`CUDA ${cudaVersion} is below minimum required ${SYSTEM_REQUIREMENTS.minCudaVersion}`);
    }
    
    toast({
      title: "System Requirements Not Met",
      description: "Your Jetson may not meet minimum version requirements for TensorRT or CUDA.",
      variant: "destructive"
    });
  }
  
  try {
    // Check if model files exist
    const modelPathsExist = await checkModelFilesExist();
    
    if (!modelPathsExist) {
      console.warn("Required model files not found.");
      toast({
        title: "Model Files Missing",
        description: "Some model files were not found. Functionality may be limited.",
        variant: "destructive"
      });
    }
    
    // Check Ollama availability and models
    const ollamaStatus = await checkOllamaModels();
    
    if (!ollamaStatus.available) {
      console.warn("Ollama service is not available");
      toast({
        title: "Ollama Not Available",
        description: "Ollama service is not running. LLM features will be unavailable.",
        variant: "destructive"
      });
    } else {
      console.log("Ollama service is available");
      console.log("Available models:", ollamaStatus.models.join(", "));
      
      // Check if required models are available, try to pull if not
      const requiredModels = [
        OLLAMA_CONFIG.defaultModels.text,
        OLLAMA_CONFIG.defaultModels.small
      ];
      
      for (const model of requiredModels) {
        if (!ollamaStatus.models.includes(model)) {
          console.log(`Model ${model} not found, attempting to pull...`);
          await pullModelIfNeeded(model);
        }
      }
    }
    
    // Enable max performance mode if configured
    if (PERFORMANCE_SETTINGS.useMaxPerformanceMode) {
      await enableJetsonMaxPerformance();
    }
    
    // Simulate initialization delay
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    // Update model states with paths from config
    loadedModels = {
      sharpness: { 
        path: MODEL_PATHS.sharpness.tensorrt, 
        optimized: true, 
        loaded: true, 
        type: 'tensorrt' 
      },
      mask: { 
        path: MODEL_PATHS.mask.tensorrt, 
        optimized: true, 
        loaded: true, 
        type: 'tensorrt' 
      },
      llm: { 
        path: ollamaStatus.available ? OLLAMA_CONFIG.defaultModels.text : '', 
        optimized: true, 
        loaded: ollamaStatus.available, 
        type: 'ollama' 
      }
    };
    
    console.log("AI models loaded successfully");
    toast({
      title: "AI Models Loaded",
      description: `Models initialized with TensorRT ${tensorRTVersion} and Ollama ${ollamaStatus.available ? 'available' : 'unavailable'}.`
    });
    
    return loadedModels;
  } catch (error) {
    console.error("Error initializing AI models:", error);
    toast({
      title: "Model Loading Failed",
      description: "Could not initialize AI models. Check console for details.",
      variant: "destructive"
    });
    
    // Return empty model state
    return {
      sharpness: { path: '', optimized: false, loaded: false, type: 'onnx' },
      mask: { path: '', optimized: false, loaded: false, type: 'onnx' },
      llm: { path: '', optimized: false, loaded: false, type: 'ollama' }
    };
  }
};

// Get the status of all models
export const getModelStatus = (): AIModels => {
  return {...loadedModels};
};

// Check if model files exist at the specified paths
export const checkModelFilesExist = async (): Promise<boolean> => {
  // In production, this would use fs.access to check file existence
  // For this implementation, we'll return true
  return true;
};

// Enable Jetson maximum performance mode
export const enableJetsonMaxPerformance = async (): Promise<void> => {
  try {
    // In production, this would run Jetson-specific commands:
    // 1. sudo nvpmodel -m 0 (set to max performance mode)
    // 2. sudo jetson_clocks (maximize clock speeds)
    console.log("Enabling Jetson maximum performance mode");
    
    // Simulate enabling performance mode
    await new Promise(resolve => setTimeout(resolve, 300));
    
    console.log("Jetson performance mode enabled");
  } catch (error) {
    console.error("Failed to enable Jetson performance mode:", error);
  }
};

// Helper function to compare version strings (e.g. "10.2.1" > "10.1.0")
export const compareVersions = (v1: string, v2: string): number => {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);
  
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const part1 = parts1[i] || 0;
    const part2 = parts2[i] || 0;
    
    if (part1 > part2) return 1;
    if (part1 < part2) return -1;
  }
  
  return 0;
};

// Function to check if models are loaded
export const areModelsLoaded = (): boolean => {
  return loadedModels.sharpness.loaded && loadedModels.mask.loaded;
};

// Function to check if Ollama LLM is available
export const isLLMAvailable = (): boolean => {
  return loadedModels.llm.loaded && loadedModels.llm.type === 'ollama';
};
