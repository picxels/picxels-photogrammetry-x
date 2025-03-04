
import { useEffect, useState, useCallback } from "react";
import { Camera, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CameraDevice, CapturedImage, Session } from "@/types";
import { toast } from "@/components/ui/use-toast";
import { captureImage, detectCameras } from "@/utils/cameraUtils";
import { saveImageLocally } from "@/utils/fileSystem";
import { cn } from "@/lib/utils";
import { CAMERA_DEVICE_PATHS } from "@/config/jetson.config";

interface CameraControlProps {
  currentSession: Session;
  onImageCaptured: (image: CapturedImage) => void;
  currentAngle?: number;
}

const CameraControl = ({ currentSession, onImageCaptured, currentAngle }: CameraControlProps) => {
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCapturing, setIsCapturing] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);

  const refreshCameras = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log("Manually refreshing camera status...");
      const detectedCameras = await detectCameras();
      setCameras(detectedCameras);
      setLastUpdateTime(new Date());
      
      // Show toast with detection results
      if (detectedCameras.length === 0) {
        toast({
          title: "No Cameras Detected",
          description: "No cameras were found. Please check connections and try again.",
          variant: "destructive"
        });
      } else if (!detectedCameras.some(camera => camera.connected)) {
        toast({
          title: "Cameras Disconnected",
          description: "Cameras were detected but are not responding. Check power and connections.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Cameras Refreshed",
          description: `Found ${detectedCameras.filter(c => c.connected).length} connected cameras.`,
          variant: "default"
        });
      }
    } catch (error) {
      console.error("Failed to detect cameras:", error);
      toast({
        title: "Camera Detection Failed",
        description: "Could not detect connected cameras. Please check USB connections.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initialize camera detection only once on component mount
    refreshCameras();
  }, [refreshCameras]);

  const handleCapture = async (camera: CameraDevice) => {
    if (isCapturing || !camera.connected) return;
    
    try {
      setIsCapturing(true);
      
      // Update camera status to capturing
      setCameras(prev => prev.map(c => 
        c.id === camera.id ? { ...c, status: "capturing" } : c
      ));
      
      console.log(`Capturing image from ${camera.name} (${camera.id})...`);
      
      // Trigger the capture
      const image = await captureImage(camera.id, currentSession.id, currentAngle);
      
      if (image) {
        // Save the image locally
        await saveImageLocally(image);
        
        // Update camera status back to idle
        setCameras(prev => prev.map(c => 
          c.id === camera.id ? { ...c, status: "idle" } : c
        ));
        
        // Notify parent component
        onImageCaptured(image);
        
        toast({
          title: "Image Captured",
          description: `${camera.name} captured an image successfully.`
        });
      } else {
        // If image is null, there was a problem
        setCameras(prev => prev.map(c => 
          c.id === camera.id ? { ...c, status: "error" } : c
        ));
        
        toast({
          title: "Capture Failed",
          description: `Failed to capture image from ${camera.name}.`,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Capture failed:", error);
      toast({
        title: "Capture Failed",
        description: "Failed to capture or save the image.",
        variant: "destructive"
      });
      
      // Reset camera status to error
      setCameras(prev => prev.map(c => 
        c.id === camera.id ? { ...c, status: "error" } : c
      ));
    } finally {
      setIsCapturing(false);
    }
  };

  const handleCaptureAll = async () => {
    if (isCapturing) return;
    
    try {
      setIsCapturing(true);
      
      // Update all camera statuses to capturing
      setCameras(prev => prev.map(c => 
        c.connected ? { ...c, status: "capturing" } : c
      ));
      
      // Capture from each camera sequentially
      const connectedCameras = cameras.filter(c => c.connected);
      console.log(`Capturing from all ${connectedCameras.length} connected cameras...`);
      
      for (const camera of connectedCameras) {
        const image = await captureImage(camera.id, currentSession.id, currentAngle);
        
        if (image) {
          await saveImageLocally(image);
          onImageCaptured(image);
        }
      }
      
      // Reset camera statuses to idle
      setCameras(prev => prev.map(c => 
        c.connected ? { ...c, status: "idle" } : c
      ));
      
      toast({
        title: "Capture Complete",
        description: `Images captured from all ${connectedCameras.length} connected cameras.`
      });
    } catch (error) {
      console.error("Capture all failed:", error);
      toast({
        title: "Capture Failed",
        description: "Failed to capture from one or more cameras.",
        variant: "destructive"
      });
      
      // Reset camera statuses to error
      setCameras(prev => prev.map(c => ({ ...c, status: "error" })));
    } finally {
      setIsCapturing(false);
      
      // Refresh camera status after capture attempt is complete
      setTimeout(refreshCameras, 1000);
    }
  };

  return (
    <Card className="glass animate-scale-in">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5 text-primary" />
          <span>Camera Control</span>
        </CardTitle>
        <CardDescription>
          Manage and trigger connected cameras
          {lastUpdateTime && (
            <div className="text-xs text-muted-foreground mt-1">
              Last updated: {lastUpdateTime.toLocaleTimeString()}
            </div>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="py-8 flex flex-col items-center justify-center">
            <div className="h-10 w-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <p className="mt-4 text-sm text-muted-foreground">Detecting cameras...</p>
          </div>
        ) : cameras.length === 0 ? (
          <div className="py-8 flex flex-col items-center justify-center">
            <p className="text-muted-foreground">No cameras detected</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={refreshCameras}
            >
              <RefreshCw className="mr-2 h-4 w-4" /> Refresh
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {cameras.map((camera) => (
              <div 
                key={camera.id}
                className={cn(
                  "flex items-center justify-between p-4 rounded-md border border-border/40 hover:bg-background/40 transition-colors",
                  !camera.connected && "bg-muted/30"
                )}
              >
                <div className="flex items-center gap-3">
                  <div 
                    className={cn(
                      "h-3 w-3 rounded-full",
                      camera.connected 
                        ? camera.status === "error" 
                          ? "bg-destructive" 
                          : camera.status === "capturing" 
                            ? "bg-amber-500" 
                            : "bg-green-500" 
                        : "bg-red-500" // Red for disconnected
                    )}
                  />
                  <div>
                    <p className="font-medium">{camera.name}</p>
                    <p className="text-xs text-muted-foreground">{camera.type}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant={camera.connected ? "outline" : "secondary"}
                    className={cn(
                      "text-xs",
                      !camera.connected && "bg-red-500/10 text-red-500 hover:bg-red-500/20"
                    )}
                  >
                    {camera.connected ? "Connected" : "Disconnected"}
                  </Badge>
                  <Button
                    size="sm"
                    disabled={!camera.connected || isCapturing}
                    onClick={() => handleCapture(camera)}
                  >
                    Capture
                  </Button>
                </div>
              </div>
            ))}
            
            <div className="flex justify-end">
              <Button 
                variant="outline" 
                size="sm"
                onClick={refreshCameras}
                disabled={isLoading || isCapturing}
                className="mr-2"
              >
                <RefreshCw className="mr-2 h-4 w-4" /> Refresh Status
              </Button>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button 
          disabled={isLoading || isCapturing || cameras.filter(c => c.connected).length === 0}
          onClick={handleCaptureAll}
          className="hover-scale"
        >
          Capture All
        </Button>
      </CardFooter>
    </Card>
  );
};

export default CameraControl;
