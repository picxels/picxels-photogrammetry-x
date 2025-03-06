
import { CapturedImage, AnalysisResult } from "@/types";
import { toast } from "@/components/ui/use-toast";
import { JETSON_AI_MODELS, AI_HARDWARE_CONFIG, AI_DEBUG_OPTIONS } from "@/config/jetsonAI.config";
import { executeCommand } from "@/utils/commandUtils";
import { isJetsonPlatform } from "@/utils/platformUtils";

/**
 * Interface for the raw Nano-VLM response
 */
interface NanoVLMResponse {
  subject: string;
  description: string;
  tags: string[];
  confidence: number;
  metadata: Record<string, any>;
}

/**
 * Check if Nano-VLM model is available and enabled
 */
export const isNanoVLMAvailable = async (): Promise<boolean> => {
  if (!JETSON_AI_MODELS.nanoVLM.enabled) {
    return false;
  }
  
  if (!isJetsonPlatform()) {
    console.log("Nano-VLM is only available on Jetson platforms");
    return false;
  }
  
  try {
    // Check if model file exists
    const modelPath = JETSON_AI_MODELS.nanoVLM.modelPath;
    const checkCommand = `ls ${modelPath}`;
    
    const result = await executeCommand(checkCommand);
    return result.includes(modelPath.split('/').pop() || '');
  } catch (error) {
    console.error("Error checking Nano-VLM availability:", error);
    return false;
  }
};

/**
 * Analyze image subject using Nano-VLM
 */
export const analyzeImageWithNanoVLM = async (
  image: CapturedImage
): Promise<AnalysisResult> => {
  console.log(`Analyzing image with Nano-VLM: ${image.path}`);
  
  if (!(await isNanoVLMAvailable())) {
    throw new Error("Nano-VLM model is not available");
  }
  
  try {
    const startTime = performance.now();
    
    // Set up paths for output JSON
    const outputDir = `/tmp/picxels/analysis`;
    const outputFile = `${outputDir}/${image.id}_analysis.json`;
    
    // Ensure output directory exists
    await executeCommand(`mkdir -p ${outputDir}`);
    
    // Prompt for the model - describe the object in detail
    const prompt = "Describe this object in detail. What is it? What material is it made of? What are its distinguishing features?";
    
    // Build the command to run Nano-VLM
    const command = `python3 /opt/picxels/scripts/run_nanovlm.py \
      --model ${JETSON_AI_MODELS.nanoVLM.modelPath} \
      --input "${image.path}" \
      --output "${outputFile}" \
      --prompt "${prompt}" \
      --max_tokens ${JETSON_AI_MODELS.nanoVLM.maxTokenLength} \
      --temperature ${JETSON_AI_MODELS.nanoVLM.temperature} \
      --batch_size ${AI_HARDWARE_CONFIG.maxBatchSize} \
      --precision ${AI_HARDWARE_CONFIG.precisionMode} \
      ${JETSON_AI_MODELS.nanoVLM.useQuantization ? '--quantize' : ''}`;
    
    // Execute the command
    await executeCommand(command);
    
    // Calculate processing time
    const endTime = performance.now();
    const processingTime = endTime - startTime;
    
    // Log inference time if enabled
    if (AI_DEBUG_OPTIONS.logInferenceTime) {
      console.log(`Nano-VLM inference time: ${processingTime.toFixed(2)}ms`);
    }
    
    // Read the output JSON file
    const readCommand = `cat ${outputFile}`;
    const jsonOutput = await executeCommand(readCommand);
    
    // Parse the JSON output
    const nanoVLMResponse: NanoVLMResponse = JSON.parse(jsonOutput);
    
    toast({
      title: "Subject Analysis Complete",
      description: `Analyzed with Nano-VLM: ${nanoVLMResponse.subject}`
    });
    
    // Convert to our application's AnalysisResult format
    return {
      subject: nanoVLMResponse.subject,
      confidence: nanoVLMResponse.confidence,
      tags: nanoVLMResponse.tags
    };
  } catch (error) {
    console.error("Error analyzing image with Nano-VLM:", error);
    
    toast({
      title: "Analysis Failed",
      description: "Could not analyze image with Nano-VLM",
      variant: "destructive"
    });
    
    // Return fallback result
    return {
      subject: "Unknown Object",
      confidence: 0,
      tags: ["error", "unknown"]
    };
  }
};

/**
 * Generate suggested session name based on analysis
 */
export const generateSessionNameWithNanoVLM = async (
  image: CapturedImage
): Promise<string> => {
  try {
    // Analyze the image
    const analysis = await analyzeImageWithNanoVLM(image);
    
    // Generate name with date
    const date = new Date().toISOString().split('T')[0];
    return `${analysis.subject} Scan - ${date}`;
  } catch (error) {
    console.error("Error generating session name:", error);
    
    // Fallback to generic name
    const date = new Date().toISOString().split('T')[0];
    return `3D Scan - ${date}`;
  }
};
