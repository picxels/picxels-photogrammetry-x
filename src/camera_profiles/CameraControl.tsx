
import { Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CapturedImage, Session } from "@/types";
import { useCameraControl } from "./hooks/useCameraControl";
import LoadingSpinner from "./components/LoadingSpinner";
import CameraList from "./components/CameraList";

interface CameraControlProps {
  currentSession: Session;
  onImageCaptured: (image: CapturedImage) => void;
  currentAngle?: number;
}

const CameraControl = ({ currentSession, onImageCaptured, currentAngle }: CameraControlProps) => {
  const {
    cameras,
    isLoading,
    isCapturing,
    lastUpdateTime,
    refreshCameras,
    handleCapture,
    handleCaptureAll
  } = useCameraControl({
    currentSession,
    onImageCaptured,
    currentAngle
  });

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
          <LoadingSpinner message="Detecting cameras..." />
        ) : (
          <CameraList
            cameras={cameras}
            isCapturing={isCapturing}
            onCapture={handleCapture}
            onRefresh={refreshCameras}
            isLoading={isLoading}
          />
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
