
import React from "react";
import { Button } from "@/components/ui/button";
import { Pass } from "@/types";

interface PassControlsProps {
  passes: Pass[];
  currentPassId: string;
  onSwitchPass: (passId: string) => void;
  onNewPass: () => void;
}

const PassControls: React.FC<PassControlsProps> = ({ 
  passes, 
  currentPassId, 
  onSwitchPass, 
  onNewPass 
}) => {
  return (
    <div className="flex justify-between items-center mb-2">
      <div className="flex gap-2">
        {passes.map(pass => (
          <Button
            key={pass.id}
            variant={currentPassId === pass.id ? "default" : "outline"}
            size="sm"
            onClick={() => onSwitchPass(pass.id)}
          >
            {pass.name}
          </Button>
        ))}
      </div>
      <Button size="sm" onClick={onNewPass}>Add Pass</Button>
    </div>
  );
};

export default PassControls;
