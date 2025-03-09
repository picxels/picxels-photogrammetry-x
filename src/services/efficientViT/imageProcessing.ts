
import { CapturedImage } from "@/types";
import { executeCommand } from "@/utils/commandUtils";
import { toast } from "@/components/ui/use-toast";
import { IMAGE_PROCESSING } from "@/config/jetsonAI.config";
import { isEfficientViTAvailable } from "./modelAvailability";
import { generateMaskWithEfficientViT } from "./maskGeneration";

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
