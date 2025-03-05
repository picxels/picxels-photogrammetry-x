import { toast } from "@/components/ui/use-toast";
import { CapturedImage } from "@/types";
import { executeCommand, releaseCamera, triggerAutofocus, setImageFormatToJpeg } from "./commandUtils";
import { applyColorProfile, getCameraTypeFromId } from "./colorProfileUtils";
import { checkImageSharpness, generateImageMask } from "./imageQualityUtils";
import { CAMERA_DEVICE_PATHS } from "@/config/jetson.config";

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
    
    console.log(`Executing gphoto2 capture on port ${portInfo}`);
    
    // Create capture directory
    const captureDir = `/tmp/picxels/captures/${sessionId}`;
    await executeCommand(`mkdir -p ${captureDir}`);
    
    const timestamp = Date.now();
    const filename = `${cameraType}_${timestamp}.jpg`;
    const filePath = `${captureDir}/${filename}`;
    
    // Release camera to ensure no other process is using it
    await releaseCamera();
    
    // Trigger autofocus before capture
    try {
      await triggerAutofocus(portInfo);
    } catch (error) {
      console.warn("Autofocus failed, continuing with capture:", error);
    }
    
    // Set image format to JPEG
    try {
      await setImageFormatToJpeg(portInfo);
    } catch (error) {
      console.warn("Setting image format failed, continuing with default format:", error);
    }
    
    // Capture the image
    const captureCommand = `gphoto2 --port=${portInfo} --capture-image-and-download --filename=${filePath} --force-overwrite`;
    console.log(`Executing: ${captureCommand}`);
    
    try {
      const stdout = await executeCommand(captureCommand);
      console.log("Capture output:", stdout);
      
      if (!stdout.includes('New file') && !stdout.includes('Saving file')) {
        console.error("Capture did not produce a new file");
        throw new Error(`Failed to capture image: No file produced`);
      }
      
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
        sessionId,
        path: filePath,
        timestamp,
        camera: cameraId,
        angle,
        previewUrl,
        sharpness
      };
      
      const cameraTypeForProfile = getCameraTypeFromId(cameraId);
      const profiledImage = await applyColorProfile(image, cameraTypeForProfile);
      
      // Apply background mask if the image is sharp enough
      if (checkImageSharpness(profiledImage)) {
        try {
          const maskedImage = await generateImageMask(profiledImage);
          if (maskedImage.hasMask) {
            return maskedImage;
          }
        } catch (maskError) {
          console.error("Error applying mask:", maskError);
        }
      }
      
      console.log("Image captured and color profile applied:", profiledImage);
      return profiledImage;
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

// Re-export functions from imageQualityUtils
export { checkImageSharpness, generateImageMask } from "./imageQualityUtils";
