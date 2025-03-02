
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Cpu, HardDrive, AlertCircle, CheckCircle2 } from "lucide-react";
import { detectTensorRTVersion, detectCUDAVersion } from "@/utils/jetsonAI";

const SystemInfo = () => {
  const [systemInfo, setSystemInfo] = useState({
    tensorrt: { version: "Checking...", compatible: false },
    cuda: { version: "Checking...", compatible: false },
    models: { loaded: false, count: 0 }
  });

  useEffect(() => {
    const checkSystem = async () => {
      try {
        // In a real implementation, these would be actual API calls
        // For demo purposes, we're simulating delayed responses
        const tensorrt = await detectTensorRTVersion();
        const cuda = await detectCUDAVersion();
        
        // Check versions against requirements
        const tensorrtCompatible = tensorrt !== "unknown" && tensorrt >= "8.0";
        const cudaCompatible = cuda !== "unknown" && cuda >= "11.0";
        
        setSystemInfo({
          tensorrt: { version: tensorrt, compatible: tensorrtCompatible },
          cuda: { version: cuda, compatible: cudaCompatible },
          models: { loaded: tensorrtCompatible && cudaCompatible, count: 3 }
        });
      } catch (error) {
        console.error("Error checking system:", error);
      }
    };
    
    checkSystem();
  }, []);

  return (
    <Card className="bg-background/60 backdrop-blur-sm border-muted">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Cpu className="h-5 w-5" />
          System Information
        </CardTitle>
        <CardDescription>
          Hardware compatibility status
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">TensorRT</span>
            <Badge variant={systemInfo.tensorrt.compatible ? "success" : "destructive"} className="gap-1 items-center">
              {systemInfo.tensorrt.compatible ? (
                <CheckCircle2 className="h-3 w-3" />
              ) : (
                <AlertCircle className="h-3 w-3" />
              )}
              v{systemInfo.tensorrt.version}
            </Badge>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">CUDA Toolkit</span>
            <Badge variant={systemInfo.cuda.compatible ? "success" : "destructive"} className="gap-1 items-center">
              {systemInfo.cuda.compatible ? (
                <CheckCircle2 className="h-3 w-3" />
              ) : (
                <AlertCircle className="h-3 w-3" />
              )}
              v{systemInfo.cuda.version}
            </Badge>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">AI Models</span>
            <Badge variant={systemInfo.models.loaded ? "success" : "destructive"} className="gap-1 items-center">
              {systemInfo.models.loaded ? (
                <CheckCircle2 className="h-3 w-3" />
              ) : (
                <AlertCircle className="h-3 w-3" />
              )}
              {systemInfo.models.loaded ? `${systemInfo.models.count} Loaded` : "Not Loaded"}
            </Badge>
          </div>
        </div>
        
        <div className="pt-2 text-xs text-muted-foreground">
          <p className="flex items-center gap-1">
            <HardDrive className="h-3 w-3" />
            <span>Jetson Orin Nano Developer Kit</span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default SystemInfo;
