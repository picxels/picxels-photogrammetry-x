
import React from "react";
import { useRCNodeConnection } from "@/hooks/useRCNodeConnection";
import RCNodeConfigComponent from "@/components/RCNodeConfig";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Server, Activity, Workflow } from "lucide-react";
import { Session, RCNodeConfig } from "@/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { testRCNodeConnectionAdvanced } from "@/utils/rcNodeService";
import { useState } from "react";

interface RCNodeTabProps {
  session: Session;
  rcNodeConfig: RCNodeConfig;
  onRCNodeConnectionChange: (isConnected: boolean, config?: RCNodeConfig) => void;
}

const RCNodeTab: React.FC<RCNodeTabProps> = ({
  session,
  rcNodeConfig,
  onRCNodeConnectionChange
}) => {
  const [diagnosticsResult, setDiagnosticsResult] = useState<any>(null);
  const [runningDiagnostics, setRunningDiagnostics] = useState(false);

  const handleConnectionStatusChange = (isConnected: boolean) => {
    onRCNodeConnectionChange(isConnected);
  };

  const runAdvancedDiagnostics = async () => {
    setRunningDiagnostics(true);
    try {
      const result = await testRCNodeConnectionAdvanced(rcNodeConfig);
      setDiagnosticsResult(result);
    } catch (error) {
      setDiagnosticsResult({
        success: false,
        message: error instanceof Error ? error.message : "Unknown error occurred"
      });
    } finally {
      setRunningDiagnostics(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5 text-primary" />
              <span>RC Node Management</span>
            </CardTitle>
            <CardDescription>
              Configure and manage your Reality Capture Node connection
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <RCNodeConfigComponent 
                onConnectionStatusChange={handleConnectionStatusChange} 
              />
              
              {rcNodeConfig.isConnected && (
                <div className="pt-4 border-t">
                  <Alert variant="success" className="bg-green-500/10 text-green-700 border-green-300 dark:text-green-400">
                    <Activity className="h-4 w-4" />
                    <AlertTitle>Connected to RC Node</AlertTitle>
                    <AlertDescription>
                      Your RC Node connection is active and ready for photogrammetry processing.
                      {rcNodeConfig.nodeUrl && (
                        <span className="block mt-1 text-xs opacity-70">{rcNodeConfig.nodeUrl}</span>
                      )}
                    </AlertDescription>
                  </Alert>
                  
                  <div className="mt-4 grid gap-4">
                    <Button
                      variant="outline"
                      onClick={runAdvancedDiagnostics}
                      disabled={runningDiagnostics}
                      className="w-full"
                    >
                      <Workflow className="h-4 w-4 mr-2" />
                      {runningDiagnostics ? "Running Diagnostics..." : "Run Connection Diagnostics"}
                    </Button>
                    
                    {diagnosticsResult && (
                      <div className={`p-3 rounded-md text-sm ${
                        diagnosticsResult.success 
                          ? "bg-green-500/10 border border-green-200 text-green-700 dark:text-green-400" 
                          : "bg-red-500/10 border border-red-200 text-red-700 dark:text-red-400"
                      }`}>
                        <div className="font-medium mb-1">
                          {diagnosticsResult.success ? "Connection Healthy" : "Connection Issues Detected"}
                        </div>
                        <div className="text-xs">{diagnosticsResult.message}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            <span>Documentation & Resources</span>
          </CardTitle>
          <CardDescription>
            Helpful resources for using Reality Capture Node
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-primary/5 rounded-md border border-primary/20">
              <h3 className="text-sm font-medium mb-2">RC Node Documentation</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Learn how to configure and use the Reality Capture Node for photogrammetry processing.
              </p>
              <Button variant="outline" className="w-full" onClick={() => window.open('docs/RCNode/Static/docu/api.html', '_blank')}>
                View RC Node API Documentation
              </Button>
            </div>
            
            <div className="p-4 bg-primary/5 rounded-md border border-primary/20">
              <h3 className="text-sm font-medium mb-2">Second Screen Interface</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Open the Reality Capture Second Screen interface to view the model processing.
              </p>
              <Button variant="outline" className="w-full" onClick={() => window.open('docs/RCNode/Static/secondscreen/secondscreen.html', '_blank')}>
                Open Second Screen
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RCNodeTab;
