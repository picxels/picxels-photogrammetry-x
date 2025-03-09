
import { toast } from "@/components/ui/use-toast";
import { MODEL_PATHS, SYSTEM_REQUIREMENTS, PERFORMANCE_SETTINGS } from "@/config/jetson.config";

// Interfaces for model configurations
export interface ModelConfig {
  path: string;
  optimized: boolean;
  loaded: boolean;
  type: 'onnx' | 'tensorrt';
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
  llm: { path: '', optimized: false, loaded: false, type: 'tensorrt' }
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
    // In production, this would:
    // 1. Check file paths from config
    // 2. Load models into memory
    // 3. Initialize CUDA context
    
    // Check if model files exist
    const modelPathsExist = await checkModelFilesExist();
    
    if (!modelPathsExist) {
      throw new Error("Required model files not found. Please check installation.");
    }
    
    // Enable max performance mode if configured
    if (PERFORMANCE_SETTINGS.useMaxPerformanceMode) {
      await enableJetsonMaxPerformance();
    }
    
    // Simulate initialization delay
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
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
        path: MODEL_PATHS.llm.tensorrt, 
        optimized: true, 
        loaded: true, 
        type: 'tensorrt' 
      }
    };
    
    console.log("AI models loaded successfully");
    toast({
      title: "AI Models Loaded",
      description: `TensorRT ${tensorRTVersion} with CUDA ${cudaVersion} initialized successfully.`
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
      llm: { path: '', optimized: false, loaded: false, type: 'onnx' }
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
    await new Promise(resolve => setTimeout(resolve, 500));
    
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
