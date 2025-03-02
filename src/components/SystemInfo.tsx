
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { detectTensorRTVersion, detectCUDAVersion, KNOWN_DEPENDENCY_ISSUES, checkPythonDependencies } from "@/utils/jetsonAI";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Check, Info } from "lucide-react";

export function SystemInfo() {
  const [tensorRTVersion, setTensorRTVersion] = useState<string>("detecting...");
  const [cudaVersion, setCudaVersion] = useState<string>("detecting...");
  const [dependencyIssues, setDependencyIssues] = useState<string[]>([]);
  
  useEffect(() => {
    const detectVersions = async () => {
      try {
        const trtVersion = await detectTensorRTVersion();
        const cudaVer = await detectCUDAVersion();
        
        setTensorRTVersion(trtVersion);
        setCudaVersion(cudaVer);
        
        // Check for Python dependency issues
        const { issues } = await checkPythonDependencies();
        setDependencyIssues(issues);
      } catch (error) {
        console.error("Error detecting system versions:", error);
      }
    };
    
    detectVersions();
  }, []);

  return (
    <Card className="shadow-md h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">System Information</CardTitle>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">TensorRT:</span>
            <Badge 
              variant={tensorRTVersion !== "unknown" ? "default" : "destructive"}
              className="ml-2"
            >
              {tensorRTVersion}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">CUDA:</span>
            <Badge 
              variant={cudaVersion !== "unknown" ? "default" : "destructive"}
              className="ml-2"
            >
              {cudaVersion}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Hardware:</span>
            <Badge 
              variant="default"
              className="ml-2"
            >
              Jetson Orin Nano
            </Badge>
          </div>
          
          {dependencyIssues.length > 0 && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Python Dependency Issues</AlertTitle>
              <AlertDescription>
                <p className="text-xs mb-1">Fix numpy version conflicts with:</p>
                <code className="text-xs bg-slate-900 p-1 rounded">pip install numpy==1.23.5</code>
              </AlertDescription>
            </Alert>
          )}
          
          {KNOWN_DEPENDENCY_ISSUES.some(issue => issue.package === "nvcc") && (
            <Alert variant="destructive" className="mt-2">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>CUDA Compiler Missing</AlertTitle>
              <AlertDescription>
                <p className="text-xs mb-1">Install CUDA compiler with:</p>
                <code className="text-xs bg-slate-900 p-1 rounded">sudo apt-get install cuda-toolkit-12-6</code>
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
