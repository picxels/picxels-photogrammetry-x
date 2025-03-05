import React from "react";
import { Loader2 } from "lucide-react";

const MotorLoading: React.FC = () => {
  return (
    <div className="py-8 flex flex-col items-center justify-center">
      <Loader2 className="h-10 w-10 text-primary animate-spin" />
      <p className="mt-4 text-sm text-muted-foreground">Initializing motor...</p>
    </div>
  );
};

export default MotorLoading;
