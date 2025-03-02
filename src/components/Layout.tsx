
import React from "react";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: React.ReactNode;
  className?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, className }) => {
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
          </div>
        </div>
      </header>
      <main className="container py-6 px-4 md:py-8 animate-fade-in">
        {children}
      </main>
    </div>
  );
};

export default Layout;
