
import { toast } from "@/components/ui/use-toast";
import { CapturedImage } from "@/types";
import { isJetsonPlatform, isDevelopmentMode } from "./platformUtils";
import { executeCommand } from "./commandUtils";
import { applyColorProfile, getCameraTypeFromId } from "./colorProfileUtils";
import { getSampleImageUrl } from "./sampleImageUtils";
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
    
    if ((isJetsonPlatform() || !isDevelopmentMode()) && portInfo) {
      console.log(`Executing gphoto2 capture on port ${portInfo}`);
      
      const captureDir = `/tmp/picxels/captures/${sessionId}`;
      await executeCommand(`mkdir -p ${captureDir}`);
      
      const timestamp = Date.now();
      const filename = `${cameraType}_${timestamp}.jpg`;
      const filePath = `${captureDir}/${filename}`;
      
      const captureCommand = `gphoto2 --port=${portInfo} --capture-image-and-download --filename=${filePath}`;
      console.log(`Executing: ${captureCommand}`);
      
      try {
        const stdout = await executeCommand(captureCommand);
        console.log("Capture output:", stdout);
        
        if (!stdout.includes('New file')) {
          console.error("Capture did not produce a new file");
          throw new Error(`Failed to capture image: No file produced`);
        }
        
        const fileCheckCommand = `ls -la ${filePath}`;
        const fileCheckOutput = await executeCommand(fileCheckCommand);
        console.log("File check output:", fileCheckOutput);
        
        if (!fileCheckOutput.includes(filename)) {
          console.error("File does not exist after capture");
          throw new Error(`Captured file not found: ${filePath}`);
        }
        
        const publicPath = `/public/captures/${sessionId}`;
        const publicFilePath = `${publicPath}/${filename}`;
        
        await executeCommand(`mkdir -p public/captures/${sessionId}`);
        await executeCommand(`cp ${filePath} public/${publicFilePath}`);
        
        const previewUrl = publicFilePath;
        
        const sharpness = 85;
        
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
        
        console.log("Image captured and color profile applied:", profiledImage);
        return profiledImage;
      } catch (error) {
        console.error("Error during capture:", error);
        throw error;
      }
    } else {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      const timestamp = Date.now();
      const path = `/captures/${sessionId}/${cameraId}_${timestamp}.jpg`;
      
      const previewUrl = getSampleImageUrl(cameraId, angle);
      console.log(`Using sample image: ${previewUrl}`);
      
      const sharpness = Math.floor(Math.random() * 30) + 70;
      
      const image: CapturedImage = {
        id: `img-${timestamp}`,
        sessionId,
        path,
        timestamp,
        camera: cameraId,
        angle,
        previewUrl,
        sharpness
      };
      
      if (sharpness < 80) {
        console.log(`Image sharpness (${sharpness}) below threshold, refocusing camera...`);
        toast({
          title: "Refocusing Camera",
          description: `Image sharpness (${sharpness}/100) too low. Refocusing and retaking.`,
          variant: "default"
        });
        
        await new Promise((resolve) => setTimeout(resolve, 800));
        
        const improvedSharpness = Math.floor(Math.random() * 10) + 85;
        image.sharpness = improvedSharpness;
        
        console.log(`Retaken image with improved sharpness: ${improvedSharpness}`);
      }
      
      const cameraType = getCameraTypeFromId(cameraId);
      const profiledImage = await applyColorProfile(image, cameraType);
      
      console.log("Image captured and color profile applied:", profiledImage);
      return profiledImage;
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
