
import React from "react";
import { RotateCw } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { MotorPosition } from "@/types";
import { useMotorControl } from "@/hooks/useMotorControl";
import RotationControl from "./motor/RotationControl";
import ScanControl from "./motor/ScanControl";
import MotorLoading from "./motor/MotorLoading";

interface MotorControlProps {
  onPositionChanged: (position: MotorPosition) => void;
  onScanStep: (position: MotorPosition) => Promise<void>;
}

const MotorControl: React.FC<MotorControlProps> = ({ onPositionChanged, onScanStep }) => {
  const {
    isInitializing,
    isMoving,
    targetAngle,
    setTargetAngle,
    scanSteps,
    setScanSteps,
    isScanning,
    autoCapture,
    setAutoCapture,
    handleRotate,
    handleStartScan
  } = useMotorControl({ onPositionChanged, onScanStep });

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
          <MotorLoading />
        ) : (
          <>
            <RotationControl 
              targetAngle={targetAngle}
              setTargetAngle={setTargetAngle}
              isMoving={isMoving}
              isScanning={isScanning}
              handleRotate={handleRotate}
            />
            
            <div className="pt-4 border-t border-border/40">
              <ScanControl
                scanSteps={scanSteps}
                setScanSteps={setScanSteps}
                autoCapture={autoCapture}
                setAutoCapture={setAutoCapture}
                isScanning={isScanning}
                isMoving={isMoving}
                handleStartScan={handleStartScan}
              />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default MotorControl;
