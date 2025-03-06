
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, Loader2, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { isEfficientViTAvailable } from "@/services/efficientViTService";
import { isNanoVLMAvailable } from "@/services/nanoVLMService";
import { isJetsonPlatform } from "@/utils/platformUtils";
import { AI_FEATURES } from "@/config/jetsonAI.config";

interface AISystemStatusProps {
  className?: string;
}

interface AIModelStatus {
  name: string;
  available: boolean | null;
  loading: boolean;
  enabled: boolean;
}

const AISystemStatus: React.FC<AISystemStatusProps> = ({ className }) => {
  const [modelStatus, setModelStatus] = useState<AIModelStatus[]>([
    { name: "EfficientViT", available: null, loading: true, enabled: AI_FEATURES.enhancedSegmentation },
    { name: "Nano-VLM", available: null, loading: true, enabled: AI_FEATURES.smartSubjectAnalysis }
  ]);
  
  const [isJetson, setIsJetson] = useState<boolean | null>(null);
  
  useEffect(() => {
    const checkPlatformAndModels = async () => {
      // Check if we're on a Jetson platform
      const jetsonPlatform = isJetsonPlatform();
      setIsJetson(jetsonPlatform);
      
      if (!jetsonPlatform) {
        // If not on Jetson, mark all as unavailable but not loading
        setModelStatus(prev => prev.map(model => ({
          ...model,
          available: false,
          loading: false
        })));
        return;
      }
      
      // Check EfficientViT availability
      try {
        const efficientViTAvailable = await isEfficientViTAvailable();
        setModelStatus(prev => prev.map(model => 
          model.name === "EfficientViT" 
            ? { ...model, available: efficientViTAvailable, loading: false }
            : model
        ));
      } catch (error) {
        console.error("Error checking EfficientViT:", error);
        setModelStatus(prev => prev.map(model => 
          model.name === "EfficientViT" 
            ? { ...model, available: false, loading: false }
            : model
        ));
      }
      
      // Check Nano-VLM availability
      try {
        const nanoVLMAvailable = await isNanoVLMAvailable();
        setModelStatus(prev => prev.map(model => 
          model.name === "Nano-VLM" 
            ? { ...model, available: nanoVLMAvailable, loading: false }
            : model
        ));
      } catch (error) {
        console.error("Error checking Nano-VLM:", error);
        setModelStatus(prev => prev.map(model => 
          model.name === "Nano-VLM" 
            ? { ...model, available: false, loading: false }
            : model
        ));
      }
    };
    
    checkPlatformAndModels();
  }, []);
  
  // Determine overall system status
  const getOverallStatus = () => {
    if (modelStatus.some(model => model.loading)) {
      return "checking";
    }
    
    if (!isJetson) {
      return "unsupported";
    }
    
    if (modelStatus.every(model => model.available === true)) {
      return "operational";
    }
    
    if (modelStatus.every(model => model.available === false)) {
      return "unavailable";
    }
    
    return "partial";
  };
  
  const overallStatus = getOverallStatus();
  
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Bot className="h-4 w-4 text-primary" />
          <span>Jetson AI System</span>
          {overallStatus === "checking" && (
            <Badge variant="outline" className="ml-auto h-5 bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
              <Loader2 className="h-3 w-3 animate-spin mr-1" />
              Checking
            </Badge>
          )}
          {overallStatus === "operational" && (
            <Badge variant="outline" className="ml-auto h-5 bg-green-500/10 text-green-500 border-green-500/20">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Operational
            </Badge>
          )}
          {overallStatus === "partial" && (
            <Badge variant="outline" className="ml-auto h-5 bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
              <AlertCircle className="h-3 w-3 mr-1" />
              Partial
            </Badge>
          )}
          {overallStatus === "unavailable" && (
            <Badge variant="outline" className="ml-auto h-5 bg-red-500/10 text-red-500 border-red-500/20">
              <XCircle className="h-3 w-3 mr-1" />
              Unavailable
            </Badge>
          )}
          {overallStatus === "unsupported" && (
            <Badge variant="outline" className="ml-auto h-5 bg-slate-500/10 text-slate-500 border-slate-500/20">
              Not on Jetson
            </Badge>
          )}
        </CardTitle>
        <CardDescription className="text-xs">
          {isJetson ? 'Enhanced AI features for Jetson Orin Nano' : 'Jetson platform not detected'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-xs space-y-1.5">
          {modelStatus.map((model) => (
            <div key={model.name} className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                {model.loading ? (
                  <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                ) : model.available ? (
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                ) : (
                  <XCircle className="h-3 w-3 text-red-500" />
                )}
                <span>{model.name}</span>
                {!model.enabled && (
                  <span className="text-muted-foreground">(disabled)</span>
                )}
              </div>
              <div>
                {model.loading ? (
                  <span className="text-muted-foreground">Checking...</span>
                ) : model.available ? (
                  <span className="text-green-500">Available</span>
                ) : (
                  <span className="text-red-500">Unavailable</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default AISystemStatus;
