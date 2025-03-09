
import { toast } from "@/components/ui/use-toast";
import { CapturedImage } from "@/types";
import { executeCommand } from "./commandUtils";
import { cameraCaptureService } from "@/services/cameraCaptureService";

/**
 * Captures an image from a camera and processes it
 */
export const captureImage = async (
  cameraId: string,
  sessionId: string,
  angle?: number
): Promise<CapturedImage | null> => {
  console.log(`Capturing image from camera ${cameraId} at angle ${angle}°`);
  
  try {
    const cameraDevice = cameraId.split('-');
    const cameraType = cameraDevice[0].toLowerCase();
    let portInfo = "";
    
    if (cameraDevice.length > 1) {
      portInfo = `usb:001,${cameraDevice[1]}`;
    }
    
    console.log(`Using cameraCaptureService to capture on port ${portInfo}`);
    
    // Create capture directory
    const captureDir = `/tmp/picxels/captures/${sessionId}`;
    await executeCommand(`mkdir -p ${captureDir}`);
    
    const timestamp = Date.now();
    const filename = `${cameraType}_${timestamp}.jpg`;
    const filePath = `${captureDir}/${filename}`;
    
    try {
      // Use the camera capture service for image capture
      await cameraCaptureService.captureImage(portInfo, filePath);
      
      // Verify the file exists
      const fileCheckCommand = `ls -la ${filePath}`;
      const fileCheckOutput = await executeCommand(fileCheckCommand);
      console.log("File check output:", fileCheckOutput);
      
      if (!fileCheckOutput.includes(filename)) {
        console.error("File does not exist after capture");
        throw new Error(`Captured file not found: ${filePath}`);
      }
      
      // Copy to public directory for web access
      const publicPath = `/public/captures/${sessionId}`;
      const publicFilePath = `${publicPath}/${filename}`;
      
      await executeCommand(`mkdir -p public/captures/${sessionId}`);
      await executeCommand(`cp ${filePath} public/${publicFilePath}`);
      
      const previewUrl = publicFilePath;
      
      // Calculate sharpness using the Python script
      const sharpnessCommand = `python3 /path/to/your/sharpness.py "${filePath}"`;
      const sharpnessOutput = await executeCommand(sharpnessCommand);
      const sharpness = parseInt(sharpnessOutput.trim()) || 85; // Default to 85 if parsing fails
      
      const image: CapturedImage = {
        id: `img-${timestamp}`,
        filePath: filePath,
        path: filePath,  // For backward compatibility
        sessionId,
        timestamp,
        camera: cameraId,
        angle,
        previewUrl,
        sharpness
      };
      
      console.log("Image captured successfully:", image.id);
      return image;
    } catch (error) {
      console.error("Error during capture:", error);
      throw error;
    }
  } catch (error) {
    console.error("Error capturing image:", error);
    toast({
      title: "Capture Failed",
      description: "Failed to capture image. Please check camera connection.",
      variant: "destructive"
    });
    return null;
  }
};

// Re-export image quality functions from imageProcessingUtils
export { 
  checkImageSharpness, 
  generateImageMask 
} from "./imageProcessingUtils";
