import { CapturedImage } from "@/types";
import { toast } from "@/components/ui/use-toast";
import { JETSON_AI_MODELS, AI_HARDWARE_CONFIG, AI_DEBUG_OPTIONS, IMAGE_PROCESSING } from "@/config/jetsonAI.config";
import { executeCommand } from "@/utils/commandUtils";
import { isJetsonPlatform } from "@/utils/platformUtils";

/**
 * Interface for segmentation results
 */
export interface SegmentationResult {
  maskPath: string;
  confidence: number;
  processingTime: number;
  success: boolean;
}

/**
 * Check if EfficientViT model is available and enabled
 */
export const isEfficientViTAvailable = async (): Promise<boolean> => {
  if (!JETSON_AI_MODELS.efficientViT.enabled) {
    return false;
  }
  
  if (!isJetsonPlatform()) {
    console.log("EfficientViT is only available on Jetson platforms");
    return false;
  }
  
  try {
    // Check if model file exists
    const modelPath = JETSON_AI_MODELS.efficientViT.modelPath;
    const checkCommand = `ls ${modelPath}`;
    
    const result = await executeCommand(checkCommand);
    return result.includes(modelPath.split('/').pop() || '');
  } catch (error) {
    console.error("Error checking EfficientViT availability:", error);
    return false;
  }
};

/**
 * Resize and prepare image for EfficientViT processing
 */
export const prepareImageForSegmentation = async (
  imagePath: string
): Promise<string> => {
  try {
    // Create a resized version of the image for segmentation
    const outputDir = `/tmp/picxels/segmentation/resized`;
    const resizedFilename = `${Date.now()}_resized.jpg`;
    const resizedPath = `${outputDir}/${resizedFilename}`;
    
    // Ensure output directory exists
    await executeCommand(`mkdir -p ${outputDir}`);
    
    // Resize image to the input size specified in config (1024x1024)
    const inputSize = JETSON_AI_MODELS.efficientViT.inputSize;
    await executeCommand(`convert "${imagePath}" -resize ${inputSize}x${inputSize}\\> "${resizedPath}"`);
    
    console.log(`Image resized to ${inputSize}px for segmentation: ${resizedPath}`);
    return resizedPath;
  } catch (error) {
    console.error("Error preparing image for segmentation:", error);
    throw error;
  }
};

/**
 * Generate background mask using EfficientViT
 */
export const generateMaskWithEfficientViT = async (
  image: CapturedImage
): Promise<SegmentationResult> => {
  console.log(`Generating mask with EfficientViT for image: ${image.path}`);
  
  if (!(await isEfficientViTAvailable())) {
    throw new Error("EfficientViT model is not available");
  }
  
  try {
    const startTime = performance.now();
    
    // Prepare image for segmentation (resize to input size)
    const resizedImagePath = await prepareImageForSegmentation(image.path);
    
    // Set up paths
    const outputDir = `/tmp/picxels/masks`;
    const maskFilename = `${image.id}_mask.png`;
    const maskPath = `${outputDir}/${maskFilename}`;
    
    // Ensure output directory exists
    await executeCommand(`mkdir -p ${outputDir}`);
    
    // Debug mode can return mock results for testing
    if (AI_DEBUG_OPTIONS.mockAIResponses) {
      await new Promise(resolve => setTimeout(resolve, AI_DEBUG_OPTIONS.mockResponseDelay));
      
      // Generate a simple white circle on black background as mock mask
      await executeCommand(
        `convert -size 1024x1024 xc:black -fill white -draw "circle 512,512 300,300" "${maskPath}"`
      );
      
      // Calculate processing time
      const endTime = performance.now();
      const processingTime = endTime - startTime;
      
      console.log("Generated mock mask for testing");
      
      return {
        maskPath,
        confidence: 0.95,
        processingTime,
        success: true
      };
    }
    
    // Build the command to run EfficientViT
    // In production, this would use TensorRT to run the model locally
    const command = `python3 /opt/picxels/scripts/run_efficientvit.py \
      --model ${JETSON_AI_MODELS.efficientViT.modelPath} \
      --input "${resizedImagePath}" \
      --output "${maskPath}" \
      --threshold ${JETSON_AI_MODELS.efficientViT.confidenceThreshold} \
      --input_size ${JETSON_AI_MODELS.efficientViT.inputSize} \
      --batch_size ${AI_HARDWARE_CONFIG.maxBatchSize} \
      --precision ${AI_HARDWARE_CONFIG.precisionMode} \
      ${AI_HARDWARE_CONFIG.useDLA ? '--use_dla' : ''} \
      ${AI_DEBUG_OPTIONS.visualizeSegmentation ? '--visualize' : ''}`;
    
    // Execute the command
    await executeCommand(command);
    
    // Calculate processing time
    const endTime = performance.now();
    const processingTime = endTime - startTime;
    
    // Log inference time if enabled
    if (AI_DEBUG_OPTIONS.logInferenceTime) {
      console.log(`EfficientViT inference time: ${processingTime.toFixed(2)}ms`);
    }
    
    // Check if mask file was created
    const checkResult = await executeCommand(`ls ${maskPath} 2>/dev/null || echo "not_found"`);
    const success = !checkResult.includes("not_found");
    
    if (success) {
      // Resize mask back to original size if needed
      if (JETSON_AI_MODELS.efficientViT.outputSize !== JETSON_AI_MODELS.efficientViT.inputSize) {
        const finalMaskPath = `${outputDir}/${image.id}_final_mask.png`;
        await executeCommand(
          `convert "${maskPath}" -resize ${JETSON_AI_MODELS.efficientViT.outputSize}x${JETSON_AI_MODELS.efficientViT.outputSize} "${finalMaskPath}"`
        );
        
        // Replace the original mask path with the resized one
        await executeCommand(`mv "${finalMaskPath}" "${maskPath}"`);
      }
      
      toast({
        title: "Enhanced Segmentation Complete",
        description: `Background removed with EfficientViT (${processingTime.toFixed(0)}ms)`
      });
      
      return {
        maskPath,
        confidence: 0.95, // Placeholder, actual confidence would come from the model
        processingTime,
        success: true
      };
    } else {
      throw new Error("Mask file was not created");
    }
  } catch (error) {
    console.error("Error generating mask with EfficientViT:", error);
    
    toast({
      title: "Segmentation Failed",
      description: "Could not generate mask with EfficientViT",
      variant: "destructive"
    });
    
    return {
      maskPath: "",
      confidence: 0,
      processingTime: 0,
      success: false
    };
  }
};

/**
 * Apply the generated mask to an image
 */
export const applyMask = async (
  image: CapturedImage,
  maskPath: string
): Promise<CapturedImage> => {
  try {
    // Create output path for masked image
    const outputDir = `/tmp/picxels/masked`;
    const maskedFilename = `${image.id}_masked.jpg`;
    const maskedPath = `${outputDir}/${maskedFilename}`;
    
    // Ensure output directory exists
    await executeCommand(`mkdir -p ${outputDir}`);
    
    // Apply mask to image using ImageMagick
    const command = `convert "${image.path}" "${maskPath}" -alpha off -compose CopyOpacity -composite "${maskedPath}"`;
    await executeCommand(command);
    
    // Return updated image information
    return {
      ...image,
      hasMask: true,
      maskedPath: maskedPath
    };
  } catch (error) {
    console.error("Error applying mask:", error);
    return image;
  }
};

/**
 * Process image for photogrammetry workflow
 * 1. Convert to TIFF if necessary
 * 2. Crop to square
 * 3. Generate mask
 * 4. Create JPEG version
 */
export const processImageForPhotogrammetry = async (
  image: CapturedImage
): Promise<CapturedImage> => {
  try {
    // Ensure output directories exist
    const outputDir = `/tmp/picxels/processed/${image.sessionId}`;
    await executeCommand(`mkdir -p ${outputDir}/tiff`);
    await executeCommand(`mkdir -p ${outputDir}/jpeg`);
    await executeCommand(`mkdir -p ${outputDir}/masks`);
    
    // Step 1: Convert to 16-bit TIFF if not already
    const tiffFilename = `${image.id}.tiff`;
    const tiffPath = `${outputDir}/tiff/${tiffFilename}`;
    
    await executeCommand(
      `convert "${image.path}" -depth 16 "${tiffPath}"`
    );
    
    // Step 2: Crop to square (only adjust width, maintain height)
    const croppedTiffPath = `${outputDir}/tiff/${image.id}_cropped.tiff`;
    const finalSize = IMAGE_PROCESSING.finalImageSize;
    
    // Use -gravity center to center the crop and only modify width, not height
    await executeCommand(
      `convert "${tiffPath}" -gravity center -crop ${finalSize}x+0+0 +repage "${croppedTiffPath}"`
    );
    
    // Step 3: Create 8-bit JPEG version
    const jpegFilename = `${image.id}.jpg`;
    const jpegPath = `${outputDir}/jpeg/${jpegFilename}`;
    
    await executeCommand(
      `convert "${croppedTiffPath}" -quality ${IMAGE_PROCESSING.jpegQuality} "${jpegPath}"`
    );
    
    // Step 4: Generate mask using EfficientViT (if available)
    let maskPath = "";
    let hasMask = false;
    
    if (await isEfficientViTAvailable()) {
      // We use the JPEG for mask generation (smaller file, faster processing)
      const segmentationResult = await generateMaskWithEfficientViT({
        ...image,
        path: jpegPath // Use the JPEG version for segmentation
      });
      
      if (segmentationResult.success) {
        // Save the mask in the masks directory
        maskPath = `${outputDir}/masks/${image.id}_mask.png`;
        await executeCommand(`cp "${segmentationResult.maskPath}" "${maskPath}"`);
        hasMask = true;
      }
    }
    
    // Return updated image with all the generated paths
    return {
      ...image,
      tiffPath: croppedTiffPath,
      originalPath: image.path,
      jpegPath: jpegPath,
      maskPath: maskPath,
      maskedPath: hasMask ? `${outputDir}/masked/${image.id}_masked.jpg` : undefined,
      hasMask: hasMask,
      croppedWidth: finalSize
    };
  } catch (error) {
    console.error("Error processing image for photogrammetry:", error);
    toast({
      title: "Processing Failed",
      description: "Failed to process image for photogrammetry workflow.",
      variant: "destructive"
    });
    return image;
  }
};
