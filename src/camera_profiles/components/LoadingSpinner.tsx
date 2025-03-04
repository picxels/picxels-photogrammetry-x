
import React from "react";

interface LoadingSpinnerProps {
  message?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ message = "Detecting cameras..." }) => {
  return (
    <div className="py-8 flex flex-col items-center justify-center">
      <div className="h-10 w-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      <p className="mt-4 text-sm text-muted-foreground">{message}</p>
    </div>
  );
};

export default LoadingSpinner;
