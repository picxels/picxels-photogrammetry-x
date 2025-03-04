
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Server, Link2, Shield, RefreshCw, Terminal, Copy } from "lucide-react";
import { RCNodeConfig } from "@/types";
import { loadRCNodeConfig, saveRCNodeConfig, testRCNodeConnection } from "@/utils/rcNodeService";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "@/components/ui/use-toast";

interface RCNodeConfigProps {
  onConnectionStatusChange?: (isConnected: boolean) => void;
}

const RCNodeConfigComponent: React.FC<RCNodeConfigProps> = ({ 
  onConnectionStatusChange 
}) => {
  const [config, setConfig] = useState<RCNodeConfig>(loadRCNodeConfig);
  const [isTesting, setIsTesting] = useState(false);
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const [debugLog, setDebugLog] = useState<string[]>([]);

  // Effect to test connection on initial load if both URL and token are present
  useEffect(() => {
    const testInitialConnection = async () => {
      if (config.nodeUrl && config.authToken) {
        await handleTestConnection();
      }
    };
    
    testInitialConnection();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Add debug log entry
  const addLogEntry = (message: string) => {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    setDebugLog(prev => [...prev, `[${timestamp}] ${message}`].slice(-10));
  };

  const handleSaveConfig = () => {
    saveRCNodeConfig(config);
    addLogEntry(`Config saved: URL=${config.nodeUrl}, Token=${config.authToken.substring(0, 8)}...`);
    toast({
      title: "Configuration Saved",
      description: "RC Node configuration has been saved to local storage."
    });
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    addLogEntry(`Testing connection to ${config.nodeUrl}`);
    
    try {
      const isConnected = await testRCNodeConnection(config);
      setConfig(prev => ({ ...prev, isConnected }));
      
      if (onConnectionStatusChange) {
        onConnectionStatusChange(isConnected);
      }
      
      addLogEntry(`Connection test ${isConnected ? 'successful' : 'failed'}`);
    } finally {
      setIsTesting(false);
    }
  };

  const handleCurlCommand = () => {
    const baseUrl = config.nodeUrl.endsWith('/') ? config.nodeUrl.slice(0, -1) : config.nodeUrl;
    const curlCommand = `curl ${baseUrl}/node/status -H "Authorization: Bearer ${config.authToken}"`;
    
    navigator.clipboard.writeText(curlCommand)
      .then(() => {
        toast({
          title: "Command Copied",
          description: "cURL command copied to clipboard"
        });
      })
      .catch((err) => {
        console.error("Failed to copy:", err);
      });
  };

  const generateTestCommand = () => {
    const baseUrl = config.nodeUrl.endsWith('/') ? config.nodeUrl.slice(0, -1) : config.nodeUrl;
    return `curl ${baseUrl}/node/status -H "Authorization: Bearer ${config.authToken}"`;
  };

  return (
    <Card className="w-full animate-scale-in">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Server className="h-5 w-5 text-primary" />
          <span>RC Node Configuration</span>
          {config.isConnected && (
            <Badge variant="outline" className="ml-2 bg-green-500/10 text-green-500 border-green-500/20">
              Connected
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Connect to the Reality Capture Node for photogrammetry processing
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="node-url">RC Node URL</Label>
          <div className="flex items-center space-x-2">
            <Link2 className="h-4 w-4 text-muted-foreground" />
            <Input
              id="node-url"
              placeholder="http://192.168.1.16:8000"
              value={config.nodeUrl}
              onChange={(e) => setConfig(prev => ({ ...prev, nodeUrl: e.target.value }))}
              className="flex-1"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            The URL where your Reality Capture Node is accessible, including port
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="auth-token">Authentication Token</Label>
          <div className="flex items-center space-x-2">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <Input
              id="auth-token"
              type="password"
              placeholder="E38BBD4E-69DE-4BCA-ADCB-98B8614CD6A7"
              value={config.authToken}
              onChange={(e) => setConfig(prev => ({ ...prev, authToken: e.target.value }))}
              className="flex-1"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            The authentication token for accessing your RC Node
          </p>
        </div>

        <Separator className="my-4" />

        <div className="text-sm">
          <p className="font-medium">Connection Status:</p>
          <div className="mt-1 flex items-center">
            <div className={`h-2 w-2 rounded-full mr-2 ${config.isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span>{config.isConnected ? 'Connected to RC Node' : 'Not connected'}</span>
          </div>
        </div>
        
        <Collapsible open={showDebugInfo} onOpenChange={setShowDebugInfo} className="mt-4">
          <CollapsibleTrigger asChild>
            <Button variant="outline" size="sm" className="w-full gap-1">
              <Terminal className="h-4 w-4" />
              {showDebugInfo ? "Hide Debugging Info" : "Show Debugging Info"}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2">
            <div className="p-3 bg-muted rounded-md text-xs font-mono space-y-2">
              <div className="flex justify-between items-center">
                <p className="font-medium">Test Command:</p>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 px-2"
                  onClick={handleCurlCommand}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
              <div className="p-2 bg-background/50 rounded overflow-x-auto whitespace-pre">
                {generateTestCommand()}
              </div>
              
              {debugLog.length > 0 && (
                <>
                  <p className="font-medium mt-2">Connection Log:</p>
                  <div className="p-2 bg-background/50 rounded overflow-y-auto max-h-32">
                    {debugLog.map((log, index) => (
                      <div key={index} className="text-xs">{log}</div>
                    ))}
                  </div>
                </>
              )}
              
              <p className="text-xs text-muted-foreground mt-2">
                You can use this command in a terminal to test the connection directly.
              </p>
            </div>
          </CollapsibleContent>
        </Collapsible>
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
