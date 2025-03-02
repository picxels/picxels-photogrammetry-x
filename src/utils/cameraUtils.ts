
import { toast } from "@/components/ui/use-toast";
import { CameraDevice, CapturedImage, Session } from "@/types";

// Mock function to simulate USB camera detection
export const detectCameras = async (): Promise<CameraDevice[]> => {
  // In a real implementation, this would use a WebUSB or similar API
  // to detect and connect to cameras over USB
  console.log("Detecting cameras...");
  
  // Simulate camera detection delay
  await new Promise((resolve) => setTimeout(resolve, 1500));
  
  // Return mock cameras for demo purposes
  return [
    {
      id: "t2i-1",
      name: "Canon T2i",
      type: "T2i",
      connected: true,
      status: "idle"
    },
    {
      id: "t3i-1",
      name: "Canon T3i",
      type: "T3i",
      connected: true,
      status: "idle"
    }
  ];
};

// Mock function to simulate taking a photo
export const captureImage = async (
  cameraId: string,
  sessionId: string,
  angle?: number
): Promise<CapturedImage | null> => {
  // In a real implementation, this would trigger the actual camera
  console.log(`Capturing image from camera ${cameraId} at angle ${angle}°`);
  
  try {
    // Simulate capture delay
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    // Generate a mock image path
    const timestamp = Date.now();
    const path = `/captures/${sessionId}/${cameraId}_${timestamp}.jpg`;
    
    // In a real implementation, we would save the actual image here
    // For demo, we'll use a placeholder image
    const previewUrl = "https://images.unsplash.com/photo-1568605114967-8130f3a36994";
    
    const image: CapturedImage = {
      id: `img-${timestamp}`,
      sessionId,
      path,
      timestamp,
      camera: cameraId,
      angle,
      previewUrl
    };
    
    console.log("Image captured:", image);
    return image;
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

// Function to create a new photo session
export const createSession = (name: string = "New Session"): Session => {
  const timestamp = Date.now();
  return {
    id: `session-${timestamp}`,
    name,
    timestamp,
    images: [],
    completed: false
  };
};

// Function to add an image to a session
export const addImageToSession = (
  session: Session,
  image: CapturedImage
): Session => {
  return {
    ...session,
    images: [...session.images, image]
  };
};

// Function to rename a session
export const renameSession = (
  session: Session,
  newName: string
): Session => {
  return {
    ...session,
    name: newName
  };
};
