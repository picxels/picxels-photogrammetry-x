
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
 * Resize and prepare image for Nano-VLM analysis
 */
export const prepareImageForAnalysis = async (
  imagePath: string
): Promise<string> => {
  try {
    // Create a resized version of the image for analysis
    const outputDir = `/tmp/picxels/analysis/resized`;
    const resizedFilename = `${Date.now()}_resized.jpg`;
    const resizedPath = `${outputDir}/${resizedFilename}`;
    
    // Ensure output directory exists
    await executeCommand(`mkdir -p ${outputDir}`);
    
    // Resize image to the max size specified in config
    const maxSize = JETSON_AI_MODELS.nanoVLM.maxImageSize;
    await executeCommand(`convert "${imagePath}" -resize ${maxSize}x${maxSize}\\> "${resizedPath}"`);
    
    console.log(`Image resized to ${maxSize}px for analysis: ${resizedPath}`);
    return resizedPath;
  } catch (error) {
    console.error("Error preparing image for analysis:", error);
    throw error;
  }
};

/**
 * Process an image to square format by center-cropping
 */
export const cropToSquare = async (
  imagePath: string,
  size: number = 3456
): Promise<string> => {
  try {
    const outputDir = `/tmp/picxels/processing/cropped`;
    const croppedFilename = `${Date.now()}_cropped.jpg`;
    const croppedPath = `${outputDir}/${croppedFilename}`;
    
    // Ensure output directory exists
    await executeCommand(`mkdir -p ${outputDir}`);
    
    // Center crop to square
    await executeCommand(`convert "${imagePath}" -gravity center -crop ${size}x${size}+0+0 +repage "${croppedPath}"`);
    
    console.log(`Image cropped to ${size}x${size}: ${croppedPath}`);
    return croppedPath;
  } catch (error) {
    console.error("Error cropping image to square:", error);
    throw error;
  }
};

/**
 * Analyze image subject using Nano-VLM
 */
export const analyzeImageWithNanoVLM = async (
  image: CapturedImage
): Promise<AnalysisResult> => {
  console.log(`Analyzing image with Nano-VLM: ${image.filePath || image.path}`);
  
  if (!(await isNanoVLMAvailable())) {
    throw new Error("Nano-VLM model is not available");
  }
  
  try {
    const startTime = performance.now();
    
    // Prepare image for analysis (resize)
    const resizedImagePath = await prepareImageForAnalysis(image.filePath || image.path || '');
    
    // Set up paths for output JSON
    const outputDir = `/tmp/picxels/analysis`;
    const outputFile = `${outputDir}/${image.id}_analysis.json`;
    
    // Ensure output directory exists
    await executeCommand(`mkdir -p ${outputDir}`);
    
    // More detailed prompt for the model - using VILA format
    const prompt = "Describe this object in detail. What is it? What material is it made of? What are its distinguishing features? What period or style does it represent? Please provide a comprehensive description that would be useful for a museum catalog.";
    
    // Build the command to run Nano-VLM with VILA 1.5 model
    const command = `python3 /opt/picxels/scripts/run_nanovlm.py \
      --model ${JETSON_AI_MODELS.nanoVLM.modelPath} \
      --input "${resizedImagePath}" \
      --output "${outputFile}" \
      --prompt "${prompt}" \
      --max_tokens ${JETSON_AI_MODELS.nanoVLM.maxTokenLength} \
      --temperature ${JETSON_AI_MODELS.nanoVLM.temperature} \
      --batch_size ${AI_HARDWARE_CONFIG.maxBatchSize} \
      --precision ${AI_HARDWARE_CONFIG.precisionMode} \
      ${JETSON_AI_MODELS.nanoVLM.useQuantization ? '--quantize' : ''}`;
    
    // Debug mode can return mock responses for testing
    if (AI_DEBUG_OPTIONS.mockAIResponses) {
      await new Promise(resolve => setTimeout(resolve, AI_DEBUG_OPTIONS.mockResponseDelay));
      
      // Mock responses for testing
      const mockResponses = [
        {
          subject: "Ming Dynasty Vase",
          description: "This is a blue and white porcelain vase from the Ming Dynasty (1368-1644). It features intricate hand-painted floral patterns typical of the Jingdezhen kilns. The cobalt blue pigment contrasts elegantly with the white porcelain body. The vase has a narrow neck and bulbous body with a stable base. Such vases were highly prized both in China and abroad, particularly in Europe where they influenced local ceramic production.",
          tags: ["ceramic", "porcelain", "Ming Dynasty", "Chinese", "antique", "blue and white", "vase", "decorative art"],
          confidence: 0.92,
          metadata: { period: "15th century", origin: "China", condition: "excellent" }
        },
        {
          subject: "Art Deco Sculpture",
          description: "This is an Art Deco bronze sculpture from the 1930s. It depicts a stylized female figure in an elongated pose characteristic of the Art Deco movement. The geometric simplification of form and the smooth, polished surface showcase the aesthetic principles of the period. The patina has a rich, dark brown tone with subtle green highlights indicative of its age.",
          tags: ["sculpture", "bronze", "Art Deco", "1930s", "decorative art", "figurative", "modernist"],
          confidence: 0.89,
          metadata: { period: "1930s", style: "Art Deco", material: "bronze" }
        },
        {
          subject: "Ancient Greek Amphora",
          description: "This is an Ancient Greek amphora from approximately 500-450 BCE (Classical period). The vessel has the typical two-handled design used for storing and transporting wine or olive oil. The terracotta surface displays black-figure painting technique with mythological scenes, possibly depicting Hercules. The craftsmanship suggests it was produced in Athens, a major center for pottery production in Ancient Greece.",
          tags: ["amphora", "Ancient Greek", "pottery", "classical", "archaeological", "black-figure", "terracotta"],
          confidence: 0.86,
          metadata: { period: "Classical Greece", age: "approx. 2500 years", technique: "black-figure" }
        }
      ];
      
      const mockResponse = mockResponses[Math.floor(Math.random() * mockResponses.length)];
      
      console.log("Using mock analysis result:", mockResponse);
      
      return {
        subjectMatter: mockResponse.subject,
        subject: mockResponse.subject,
        confidence: mockResponse.confidence,
        description: mockResponse.description,
        tags: mockResponse.tags,
        metadata: mockResponse.metadata
      };
    }
    
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
      subjectMatter: nanoVLMResponse.subject,
      subject: nanoVLMResponse.subject,
      confidence: nanoVLMResponse.confidence,
      description: nanoVLMResponse.description,
      tags: nanoVLMResponse.tags,
      metadata: nanoVLMResponse.metadata
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
      subjectMatter: "Unknown Object",
      subject: "Unknown Object",
      confidence: 0,
      description: "Analysis failed. The object could not be identified.",
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
    return `${analysis.subjectMatter} - ${date}`;
  } catch (error) {
    console.error("Error generating session name:", error);
    
    // Fallback to generic name
    const date = new Date().toISOString().split('T')[0];
    return `3D Scan - ${date}`;
  }
};
