
import { cn } from "@/lib/utils";

interface CameraStatusIndicatorProps {
  connected: boolean;
  status: string;
}

const CameraStatusIndicator = ({ connected, status }: CameraStatusIndicatorProps) => {
  return (
    <div 
      className={cn(
        "h-3 w-3 rounded-full",
        connected 
          ? status === "error" 
            ? "bg-destructive" 
            : status === "capturing" 
              ? "bg-amber-500" 
              : "bg-green-500" 
          : "bg-red-500" // Red for disconnected
      )}
    />
  );
};

export default CameraStatusIndicator;
