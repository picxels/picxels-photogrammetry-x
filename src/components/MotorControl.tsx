
import React, { useEffect, useState } from "react";
import { RotateCw, Loader2, Play, RefreshCw } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { MotorPosition, MotorSettings } from "@/types";
import { toast } from "@/components/ui/use-toast";
import { defaultMotorSettings, initializeMotor, moveMotorToPosition, performFullScan } from "@/utils/motorControl";

interface MotorControlProps {
  onPositionChanged: (position: MotorPosition) => void;
  onScanStep: (position: MotorPosition) => Promise<void>;
}

const MotorControl: React.FC<MotorControlProps> = ({ onPositionChanged, onScanStep }) => {
  const [settings, setSettings] = useState<MotorSettings>(defaultMotorSettings);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isMoving, setIsMoving] = useState(false);
  const [targetAngle, setTargetAngle] = useState(0);
  const [scanSteps, setScanSteps] = useState("24");
  const [isScanning, setIsScanning] = useState(false);
  const [autoCapture, setAutoCapture] = useState(true);

  // Initialize motor on component mount
  useEffect(() => {
    const init = async () => {
      try {
        const motorSettings = await initializeMotor();
        setSettings(motorSettings);
        setTargetAngle(motorSettings.currentPosition.angle);
      } catch (error) {
        console.error("Failed to initialize motor:", error);
        toast({
          title: "Motor Initialization Failed",
          description: "Could not initialize the stepper motor. Check connections.",
          variant: "destructive"
        });
      } finally {
        setIsInitializing(false);
      }
    };

    init();
  }, []);

  // Handle manual rotation
  const handleRotate = async () => {
    if (isMoving || isScanning) return;
    
    try {
      setIsMoving(true);
      
      const targetPosition: MotorPosition = {
        angle: targetAngle,
        step: Math.round(targetAngle / (360 / settings.stepsPerRevolution))
      };
      
      const newPosition = await moveMotorToPosition(settings, targetPosition);
      
      // Update settings with new position
      setSettings({
        ...settings,
        currentPosition: newPosition
      });
      
      // Notify parent of position change
      onPositionChanged(newPosition);
    } catch (error) {
      console.error("Failed to rotate motor:", error);
      toast({
        title: "Rotation Failed",
        description: "Failed to rotate the motor to the target angle.",
        variant: "destructive"
      });
    } finally {
      setIsMoving(false);
    }
  };

  // Handle full scan
  const handleStartScan = async () => {
    if (isScanning || isMoving) return;
    
    try {
      setIsScanning(true);
      
      // Perform the scan
      await performFullScan(
        settings,
        parseInt(scanSteps),
        async (position) => {
          // Update our local state
          setSettings({
            ...settings,
            currentPosition: position
          });
          
          // Notify parent of position change
          onPositionChanged(position);
          
          // If auto-capture is enabled, trigger a capture at this position
          if (autoCapture) {
            await onScanStep(position);
          }
        }
      );
    } catch (error) {
      console.error("Scan failed:", error);
      toast({
        title: "Scan Failed",
        description: "An error occurred during the scanning process.",
        variant: "destructive"
      });
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <Card className="glass animate-scale-in">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RotateCw className="h-5 w-5 text-primary" />
          <span>Motor Control</span>
        </CardTitle>
        <CardDescription>
          Control the stepper motor for 360° scanning
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {isInitializing ? (
          <div className="py-8 flex flex-col items-center justify-center">
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
            <p className="mt-4 text-sm text-muted-foreground">Initializing motor...</p>
          </div>
        ) : (
          <>
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
            
            <div className="pt-4 border-t border-border/40">
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
            </div>
          </>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          disabled={isInitializing || isMoving || isScanning}
          onClick={handleRotate}
        >
          {isMoving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
          Rotate
        </Button>
        
        <Button
          disabled={isInitializing || isMoving || isScanning}
          onClick={handleStartScan}
          className="hover-scale"
        >
          {isScanning ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
          {isScanning ? "Scanning..." : "Start Scan"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default MotorControl;
