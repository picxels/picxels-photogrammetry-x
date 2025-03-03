
import React from "react";
import { RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";

interface RotationControlProps {
  targetAngle: number;
  setTargetAngle: (angle: number) => void;
  isMoving: boolean;
  isScanning: boolean;
  handleRotate: () => Promise<void>;
}

const RotationControl: React.FC<RotationControlProps> = ({
  targetAngle,
  setTargetAngle,
  isMoving,
  isScanning,
  handleRotate
}) => {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="angle-slider">Rotation Angle</Label>
          <span className="text-sm font-medium">{targetAngle}°</span>
        </div>
        <Slider
          id="angle-slider"
          min={0}
          max={360}
          step={1}
          value={[targetAngle]}
          onValueChange={(value) => setTargetAngle(value[0])}
          disabled={isMoving || isScanning}
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>0°</span>
          <span>90°</span>
          <span>180°</span>
          <span>270°</span>
          <span>360°</span>
        </div>
      </div>
      
      <div className="grid grid-cols-4 gap-4">
        {[0, 90, 180, 270].map((angle) => (
          <Button 
            key={angle}
            variant="outline"
            size="sm"
            disabled={isMoving || isScanning}
            onClick={() => setTargetAngle(angle)}
            className={angle === targetAngle ? "bg-primary/10" : ""}
          >
            {angle}°
          </Button>
        ))}
      </div>

      <Button
        variant="outline"
        disabled={isMoving || isScanning}
        onClick={handleRotate}
        className="w-full"
      >
        {isMoving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
        Rotate
      </Button>
    </div>
  );
};

export default RotationControl;
