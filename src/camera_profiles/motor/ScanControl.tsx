
import React from "react";
import { Play, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

interface ScanControlProps {
  scanSteps: string;
  setScanSteps: (steps: string) => void;
  autoCapture: boolean;
  setAutoCapture: (capture: boolean) => void;
  isScanning: boolean;
  isMoving: boolean;
  handleStartScan: () => Promise<void>;
}

const ScanControl: React.FC<ScanControlProps> = ({
  scanSteps,
  setScanSteps,
  autoCapture,
  setAutoCapture,
  isScanning,
  isMoving,
  handleStartScan
}) => {
  return (
    <div className="space-y-4">
      <h3 className="font-medium mb-4">Automated Scanning</h3>
      
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="scan-steps">Scan Steps</Label>
            <Select 
              value={scanSteps} 
              onValueChange={setScanSteps}
              disabled={isScanning}
            >
              <SelectTrigger id="scan-steps">
                <SelectValue placeholder="Select Steps" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="12">12 Steps (30°)</SelectItem>
                <SelectItem value="24">24 Steps (15°)</SelectItem>
                <SelectItem value="36">36 Steps (10°)</SelectItem>
                <SelectItem value="72">72 Steps (5°)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="auto-capture">Auto Capture</Label>
            <p className="text-xs text-muted-foreground">
              Automatically capture images at each step
            </p>
          </div>
          <Switch
            id="auto-capture"
            checked={autoCapture}
            onCheckedChange={setAutoCapture}
            disabled={isScanning}
          />
        </div>
      </div>

      <Button
        disabled={isMoving || isScanning}
        onClick={handleStartScan}
        className="w-full hover-scale"
      >
        {isScanning ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
        {isScanning ? "Scanning..." : "Start Scan"}
      </Button>
    </div>
  );
};

export default ScanControl;
