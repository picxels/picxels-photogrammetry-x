import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CameraDevice } from "@/types";
import { cn } from "@/lib/utils";
import CameraStatusIndicator from "./CameraStatusIndicator";

interface CameraItemProps {
  camera: CameraDevice;
  isCapturing: boolean;
  onCapture: (camera: CameraDevice) => void;
}

const CameraItem = ({ camera, isCapturing, onCapture }: CameraItemProps) => {
  return (
    <div 
      className={cn(
        "flex items-center justify-between p-4 rounded-md border border-border/40 hover:bg-background/40 transition-colors",
        !camera.connected && "bg-muted/30"
      )}
    >
      <div className="flex items-center gap-3">
        <CameraStatusIndicator 
          connected={camera.connected} 
          status={camera.status || 'idle'} 
        />
        <div>
          <p className="font-medium">{camera.name}</p>
          <p className="text-xs text-muted-foreground">
            {camera.type} {camera.port && `(${camera.port})`}
          </p>
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
          onClick={() => onCapture(camera)}
        >
          Capture
        </Button>
      </div>
    </div>
  );
};

export default CameraItem;
