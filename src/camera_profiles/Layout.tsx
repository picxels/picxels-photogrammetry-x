
import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import ThemeToggle from "@/components/ThemeToggle";
import { useCameraDetection } from "@/camera_profiles/hooks/useCameraDetection";
import LoadingSpinner from "@/camera_profiles/components/LoadingSpinner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface LayoutProps {
  children: React.ReactNode;
  className?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, className }) => {
  const { isLoading, apiAvailable } = useCameraDetection();
  const [forceShowContent, setForceShowContent] = useState(false);

  // Force show content after 15 seconds to prevent endless loading
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isLoading) {
        console.log("Forcing content display after timeout");
        setForceShowContent(true);
      }
    }, 15000);
    
    return () => clearTimeout(timer);
  }, [isLoading]);

  return (
    <div className={cn(
      "min-h-screen bg-gradient-to-br from-background to-secondary/50",
      className
    )}>
      <header className="w-full py-4 px-6 bg-background/80 backdrop-blur-sm border-b border-border/40 sticky top-0 z-50">
        <div className="container flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
              <div className="h-3 w-3 rounded-full bg-primary animate-pulse" />
            </div>
            <h1 className="text-xl font-semibold tracking-tight">PhotogrammeryX</h1>
          </div>
          <div className="flex items-center space-x-2">
            <div className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-primary/10 text-primary">
              Jetson Nano Orin
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main className="container py-6 px-4 md:py-8 animate-fade-in">
        {apiAvailable === false && (
          <Alert variant="default" className="mb-4 border-yellow-500/50 bg-yellow-500/10">
            <AlertCircle className="h-4 w-4 text-yellow-500" />
            <AlertTitle>API Unavailable</AlertTitle>
            <AlertDescription>
              The camera control API is unavailable. Running in simulation mode.
            </AlertDescription>
          </Alert>
        )}
        
        {isLoading && !forceShowContent ? (
          <LoadingSpinner message="Initializing cameras..." />
        ) : (
          children
        )}
      </main>
    </div>
  );
};

export default Layout;
