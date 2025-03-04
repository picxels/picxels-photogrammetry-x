
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CameraDevice } from "@/types";
import CameraItem from "./CameraItem";

interface CameraListProps {
  cameras: CameraDevice[];
  isCapturing: boolean;
  onCapture: (camera: CameraDevice) => void;
  onRefresh: () => void;
  isLoading: boolean;
}

const CameraList = ({ 
  cameras, 
  isCapturing, 
  onCapture, 
  onRefresh,
  isLoading
}: CameraListProps) => {
  if (cameras.length === 0) {
    return (
      <div className="py-8 flex flex-col items-center justify-center">
        <p className="text-muted-foreground">No cameras detected</p>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={onRefresh}
        >
          <RefreshCw className="mr-2 h-4 w-4" /> Refresh
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {cameras.map((camera) => (
        <CameraItem
          key={camera.id}
          camera={camera}
          isCapturing={isCapturing}
          onCapture={onCapture}
        />
      ))}
      
      <div className="flex justify-end">
        <Button 
          variant="outline" 
          size="sm"
          onClick={onRefresh}
          disabled={isLoading || isCapturing}
          className="mr-2"
        >
          <RefreshCw className="mr-2 h-4 w-4" /> Refresh Status
        </Button>
      </div>
    </div>
  );
};

export default CameraList;
