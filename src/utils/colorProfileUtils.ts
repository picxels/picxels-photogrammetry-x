
import { CameraDevice, CapturedImage } from "@/types";
import { toast } from "@/components/ui/use-toast";

// Map of camera types to their profile files
const COLOR_PROFILE_MAP = {
  "T2i": "/camera_profiles/T2i_ColorProfile.dcp",
  "T3i": "/camera_profiles/T3i_ColorProfile.dcp"
};

/**
 * Applies the appropriate color profile to an image based on the camera type
 * In a real implementation, this would use a library like DCRaw or a similar
 * raw processing library to apply the DCP profiles to the images
 */
export const applyColorProfile = async (
  image: CapturedImage, 
  cameraType: string
): Promise<CapturedImage> => {
  console.log(`Applying color profile for ${cameraType} to image ${image.id}`);
  
  // Get the appropriate profile path
  const profilePath = COLOR_PROFILE_MAP[cameraType as keyof typeof COLOR_PROFILE_MAP];
  
  if (!profilePath) {
    console.warn(`No color profile found for camera type: ${cameraType}`);
    toast({
      title: "Warning",
      description: `No color profile available for ${cameraType} camera. Using default processing.`,
      variant: "default"
    });
    return image;
  }
  
  try {
    // Simulate profile application with a delay
    // In a real-world scenario, this would use a library to actually apply the profile
    await new Promise(resolve => setTimeout(resolve, 500));
    
    console.log(`Successfully applied ${cameraType} color profile to image ${image.id}`);
    
    // Return the image with a flag indicating profile has been applied
    return {
      ...image,
      hasColorProfile: true,
      colorProfileType: cameraType
    };
  } catch (error) {
    console.error("Error applying color profile:", error);
    toast({
      title: "Profile Application Failed",
      description: `Failed to apply ${cameraType} color profile to image.`,
      variant: "destructive"
    });
    return image;
  }
};

/**
 * Checks if the required color profiles are available in the system
 * Returns a mapping of camera types to profile availability
 */
export const checkColorProfilesAvailability = async (): Promise<Record<string, boolean>> => {
  console.log("Checking color profiles availability");
  
  // In a real implementation, this would check if the files exist
  // For this demo, we'll simulate both profiles exist
  const availability: Record<string, boolean> = {
    "T2i": true, // Changed to true since we now have T2i profile
    "T3i": true
  };
  
  return availability;
};

/**
 * Gets the camera type from a camera ID
 */
export const getCameraTypeFromId = (cameraId: string): string => {
  if (cameraId.includes("t2i")) return "T2i";
  if (cameraId.includes("t3i")) return "T3i";
  return "Unknown";
};
