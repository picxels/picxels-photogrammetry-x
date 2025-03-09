
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Server, RefreshCw, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useRCNodeConfig } from "@/hooks/useRCNodeConfig";
import RCNodeConfigForm from "./RCNode/RCNodeConfigForm";
import RCNodeStatusBadge from "./RCNode/RCNodeStatusBadge";
import RCNodeDebugInfo from "./RCNode/RCNodeDebugInfo";

interface RCNodeConfigProps {
  onConnectionStatusChange?: (isConnected: boolean) => void;
}

const RCNodeConfigComponent: React.FC<RCNodeConfigProps> = ({ 
  onConnectionStatusChange 
}) => {
  const {
    config,
    setConfig,
    isTesting,
    isServerReachable,
    showDebugInfo,
    setShowDebugInfo,
    debugLog,
    connectionError,
    advancedResults,
    simulationMode,
    handleSaveConfig,
    handleTestConnection,
    handleTestConnectionAdvanced,
    handleCurlCommand,
    generateTestCommand,
    handleBrowserCommand
  } = useRCNodeConfig({ onConnectionStatusChange });

  return (
    <Card className="w-full animate-scale-in">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Server className="h-5 w-5 text-primary" />
          <span>RC Node Configuration</span>
        </CardTitle>
        <CardDescription>
          Connect to the Reality Capture Node for photogrammetry processing
          {simulationMode && (
            <div className="mt-2 text-yellow-500 text-xs font-medium">
              Running in simulation mode - no real connections will be made
            </div>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <RCNodeConfigForm 
          nodeUrl={config.nodeUrl}
          authToken={config.authToken}
          onNodeUrlChange={(url) => setConfig(prev => ({ ...prev, nodeUrl: url }))}
          onAuthTokenChange={(token) => setConfig(prev => ({ ...prev, authToken: token }))}
        />

        {connectionError && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Connection Error</AlertTitle>
            <AlertDescription>
              {connectionError}
            </AlertDescription>
          </Alert>
        )}

        <Separator className="my-4" />

        <RCNodeStatusBadge 
          isConnected={config.isConnected}
          simulationMode={simulationMode}
          isServerReachable={isServerReachable}
        />
        
        <RCNodeDebugInfo 
          showDebugInfo={showDebugInfo}
          onShowDebugInfoChange={setShowDebugInfo}
          debugLog={debugLog}
          isTesting={isTesting}
          generateTestCommand={generateTestCommand}
          advancedResults={advancedResults}
          onCopyCommand={handleCurlCommand}
          onBrowserTest={handleBrowserCommand}
          onRunAdvancedDiagnostics={handleTestConnectionAdvanced}
        />
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={handleSaveConfig}>
          Save Configuration
        </Button>
        <Button 
          onClick={handleTestConnection} 
          disabled={isTesting || !config.nodeUrl || !config.authToken}
          className="gap-1"
        >
          {isTesting ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Test Connection
        </Button>
      </CardFooter>
    </Card>
  );
};

export default RCNodeConfigComponent;
