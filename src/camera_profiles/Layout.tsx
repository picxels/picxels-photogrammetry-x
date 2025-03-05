
import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import ThemeToggle from "@/components/ThemeToggle";
import { useCameraDetection } from "@/camera_profiles/hooks/useCameraDetection";
import LoadingSpinner from "@/camera_profiles/components/LoadingSpinner";

interface LayoutProps {
  children: React.ReactNode;
  className?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, className }) => {
  const { isLoading } = useCameraDetection();
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
      "min-h-screen bg-gradient-to-br from-background to-secondary",
      className
    )}>
      <header className="w-full py-4 px-6 glass border-b border-border/40 sticky top-0 z-50">
        <div className="container flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
              <div className="h-3 w-3 rounded-full bg-primary animate-pulse-subtle"/>
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
