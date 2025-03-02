import { useEffect, useState } from "react";
import { Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CameraDevice, CapturedImage, Session } from "@/types";
import { toast } from "@/components/ui/use-toast";
import { captureImage, detectCameras } from "@/utils/cameraUtils";
import { saveImageLocally } from "@/utils/fileSystem";
import { cn } from "@/lib/utils";

interface CameraControlProps {
  currentSession: Session;
  onImageCaptured: (image: CapturedImage) => void;
  currentAngle?: number;
}

const CameraControl = ({ currentSession, onImageCaptured, currentAngle }: CameraControlProps) => {
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCapturing, setIsCapturing] = useState(false);

  useEffect(() => {
    const initCameras = async () => {
      try {
        const detectedCameras = await detectCameras();
        setCameras(detectedCameras);
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
    };

    initCameras();
  }, []);

  const handleCapture = async (camera: CameraDevice) => {
    if (isCapturing) return;
    
    try {
      setIsCapturing(true);
      
      // Update camera status
      setCameras(cameras.map(c => 
        c.id === camera.id ? { ...c, status: "capturing" } : c
      ));
      
      // Trigger the capture
      const image = await captureImage(camera.id, currentSession.id, currentAngle);
      
      if (image) {
        // Save the image locally
        await saveImageLocally(image);
        
        // Update camera status
        setCameras(cameras.map(c => 
          c.id === camera.id ? { ...c, status: "idle" } : c
        ));
        
        // Notify parent component
        onImageCaptured(image);
        
        toast({
          title: "Image Captured",
          description: `${camera.name} captured an image successfully.`
        });
      }
    } catch (error) {
      console.error("Capture failed:", error);
      toast({
        title: "Capture Failed",
        description: "Failed to capture or save the image.",
        variant: "destructive"
      });
      
      // Reset camera status
      setCameras(cameras.map(c => 
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
      
      // Update all camera statuses
      setCameras(cameras.map(c => ({ ...c, status: "capturing" })));
      
      // Capture from each camera sequentially
      for (const camera of cameras) {
        if (camera.connected) {
          const image = await captureImage(camera.id, currentSession.id, currentAngle);
          
          if (image) {
            await saveImageLocally(image);
            onImageCaptured(image);
          }
        }
      }
      
      // Reset camera statuses
      setCameras(cameras.map(c => ({ ...c, status: "idle" })));
      
      toast({
        title: "Capture Complete",
        description: "Images captured from all connected cameras."
      });
    } catch (error) {
      console.error("Capture all failed:", error);
      toast({
        title: "Capture Failed",
        description: "Failed to capture from one or more cameras.",
        variant: "destructive"
      });
      
      // Reset camera statuses
      setCameras(cameras.map(c => ({ ...c, status: "error" })));
    } finally {
      setIsCapturing(false);
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
              onClick={() => {
                setIsLoading(true);
                detectCameras().then(setCameras).finally(() => setIsLoading(false));
              }}
            >
              Refresh
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {cameras.map((camera) => (
              <div 
                key={camera.id}
                className="flex items-center justify-between p-4 rounded-md border border-border/40 hover:bg-background/40 transition-colors"
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
                        : "bg-muted"
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
                    className="text-xs"
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
