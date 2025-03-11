
import { useEffect, useRef } from "react";

interface UseCameraInitializationProps {
  refreshCameras: () => Promise<void>;
}

export const useCameraInitialization = ({ refreshCameras }: UseCameraInitializationProps) => {
  // Use a ref to track if we've initialized
  const initializedRef = useRef(false);
  
  // Run camera detection once on component mount
  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      refreshCameras();
    }
  }, [refreshCameras]);

  return {
    initializedRef
  };
};
