
import { Camera, RefreshCw } from "lucide-react";
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
    isRefreshing,
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
        <CardDescription className="flex flex-col gap-1">
          <span>Manage and trigger connected cameras</span>
          <div className="flex items-center justify-between">
            {lastUpdateTime && (
              <div className="text-xs text-muted-foreground">
                Last updated: {lastUpdateTime.toLocaleTimeString()}
              </div>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={refreshCameras} 
              disabled={isLoading || isRefreshing}
              className="text-xs flex items-center gap-1"
            >
              {isRefreshing ? (
                <RefreshCw className="h-3 w-3 animate-spin" />
              ) : (
                <RefreshCw className="h-3 w-3" />
              )}
              Refresh
            </Button>
          </div>
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
            isLoading={isLoading || isRefreshing}
          />
        )}
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button 
          disabled={isLoading || isCapturing || isRefreshing || cameras.filter(c => c.connected).length === 0}
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
