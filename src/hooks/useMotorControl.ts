
import { useState, useEffect } from "react";
import { toast } from "@/components/ui/use-toast";
import { MotorPosition, MotorSettings } from "@/types";
import { defaultMotorSettings, initializeMotor, moveMotorToPosition, performFullScan } from "@/utils/motorControl";

interface UseMotorControlProps {
  onPositionChanged: (position: MotorPosition) => void;
  onScanStep: (position: MotorPosition) => Promise<void>;
}

export function useMotorControl({ onPositionChanged, onScanStep }: UseMotorControlProps) {
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

  return {
    settings,
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
  };
}
