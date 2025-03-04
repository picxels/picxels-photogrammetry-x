
import { useState } from "react";
import { MotorPosition } from "@/types";

export const useMotorControlState = () => {
  const [currentPosition, setCurrentPosition] = useState<MotorPosition>({ angle: 0, step: 0 });

  const handlePositionChanged = (position: MotorPosition) => {
    setCurrentPosition(position);
  };

  const handleScanStep = async (position: MotorPosition) => {
    return new Promise<void>((resolve) => {
      setTimeout(resolve, 300);
    });
  };

  return {
    currentPosition,
    handlePositionChanged,
    handleScanStep
  };
};
