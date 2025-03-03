
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Server, Link2, Shield, RefreshCw } from "lucide-react";
import { RCNodeConfig } from "@/types";
import { loadRCNodeConfig, saveRCNodeConfig, testRCNodeConnection } from "@/utils/rcNodeService";

interface RCNodeConfigProps {
  onConnectionStatusChange?: (isConnected: boolean) => void;
}

const RCNodeConfigComponent: React.FC<RCNodeConfigProps> = ({ 
  onConnectionStatusChange 
}) => {
  const [config, setConfig] = useState<RCNodeConfig>(loadRCNodeConfig);
  const [isTesting, setIsTesting] = useState(false);

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

  const handleSaveConfig = () => {
    saveRCNodeConfig(config);
    console.log("RC Node configuration saved:", config);
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    try {
      const isConnected = await testRCNodeConnection(config);
      setConfig(prev => ({ ...prev, isConnected }));
      
      if (onConnectionStatusChange) {
        onConnectionStatusChange(isConnected);
      }
    } finally {
      setIsTesting(false);
    }
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
