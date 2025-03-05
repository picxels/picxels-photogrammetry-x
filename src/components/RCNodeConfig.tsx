
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Server, Link2, Shield, RefreshCw, Terminal, Copy, AlertCircle, Check, X } from "lucide-react";
import { RCNodeConfig } from "@/types";
import { 
  loadRCNodeConfig, 
  saveRCNodeConfig, 
  testRCNodeConnection, 
  testServerReachable,
  testRCNodeConnectionAdvanced 
} from "@/utils/rcNodeService";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "@/components/ui/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { DEBUG_SETTINGS } from "@/config/jetson.config";

interface RCNodeConfigProps {
  onConnectionStatusChange?: (isConnected: boolean) => void;
}

const RCNodeConfigComponent: React.FC<RCNodeConfigProps> = ({ 
  onConnectionStatusChange 
}) => {
  const [config, setConfig] = useState<RCNodeConfig>(loadRCNodeConfig);
  const [isTesting, setIsTesting] = useState(false);
  const [isServerReachable, setIsServerReachable] = useState<boolean | null>(null);
  const [showDebugInfo, setShowDebugInfo] = useState(DEBUG_SETTINGS.rcNodeDebugMode);
  const [debugLog, setDebugLog] = useState<string[]>([]);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [advancedResults, setAdvancedResults] = useState<any>(null);
  const [simulationMode, setSimulationMode] = useState(false);

  useEffect(() => {
    // Check if the API is reachable
    const checkApiAvailability = async () => {
      try {
        const response = await fetch('/api/health', { method: 'HEAD' });
        const apiAvailable = response.ok;
        
        // Only enable simulation if API is not available
        const shouldSimulate = !apiAvailable;
        setSimulationMode(shouldSimulate);
        
        if (shouldSimulate) {
          addLogEntry("Running in SIMULATION MODE - no real API connections will be made");
        } else {
          addLogEntry("API server is available - using normal operation mode");
        }
      } catch (error) {
        console.error("Error checking API availability:", error);
        setSimulationMode(true);
        addLogEntry("Error checking API, defaulting to SIMULATION MODE");
      }
    };
    
    checkApiAvailability();
    
    const testInitialConnection = async () => {
      if (config.nodeUrl && config.authToken) {
        await handleTestConnection();
      }
    };
    
    testInitialConnection();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addLogEntry = (message: string) => {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    setDebugLog(prev => [...prev, `[${timestamp}] ${message}`].slice(-20));
  };

  const handleSaveConfig = () => {
    const normalizedUrl = config.nodeUrl.endsWith('/') 
      ? config.nodeUrl.slice(0, -1) 
      : config.nodeUrl;
    
    const updatedConfig = {
      ...config,
      nodeUrl: normalizedUrl
    };
    
    setConfig(updatedConfig);
    saveRCNodeConfig(updatedConfig);
    addLogEntry(`Config saved: URL=${normalizedUrl}, Token=${config.authToken.substring(0, 8)}...`);
    
    toast({
      title: "Configuration Saved",
      description: "RC Node configuration has been saved to local storage."
    });
  };

  const checkServerReachable = async () => {
    if (!config.nodeUrl) return false;
    
    if (simulationMode) {
      addLogEntry(`Checking if server is reachable: ${config.nodeUrl} (SIMULATION)`);
      setIsServerReachable(true);
      addLogEntry(`Server reachability (SIMULATED): YES`);
      return true;
    } else {
      // Perform an actual check
      try {
        addLogEntry(`Checking if server is reachable: ${config.nodeUrl}`);
        const result = await testServerReachable(config.nodeUrl);
        setIsServerReachable(result.reachable);
        addLogEntry(`Server reachability: ${result.reachable ? 'YES' : 'NO - ' + result.error}`);
        return result.reachable;
      } catch (error) {
        addLogEntry(`Server reachability check error: ${error.message}`);
        setIsServerReachable(false);
        return false;
      }
    }
  };

  const handleTestConnectionAdvanced = async () => {
    setIsTesting(true);
    setConnectionError(null);
    setAdvancedResults(null);
    
    addLogEntry("Running advanced connection diagnostics...");
    
    try {
      await checkServerReachable();
      
      if (simulationMode) {
        // Simulate test in simulation mode
        await new Promise(resolve => setTimeout(resolve, 800));
        const mockResult = {
          success: true,
          message: "Advanced test successful (SIMULATED)",
          details: {
            version: "1.0.0",
            mode: "Simulation",
            testTime: new Date().toISOString()
          }
        };
        setAdvancedResults(mockResult);
        addLogEntry(`Advanced test result: SUCCESS (SIMULATED)`);
        setConfig(prev => ({ ...prev, isConnected: true }));
        
        if (onConnectionStatusChange) {
          onConnectionStatusChange(true);
        }
      } else {
        // Perform real test
        const advancedTest = await testRCNodeConnectionAdvanced(config);
        
        addLogEntry(`Advanced test result: ${advancedTest.success ? 'SUCCESS' : 'FAILED'}`);
        addLogEntry(advancedTest.message);
        
        setAdvancedResults(advancedTest);
        
        if (advancedTest.success) {
          setConfig(prev => ({ ...prev, isConnected: true }));
          
          if (onConnectionStatusChange) {
            onConnectionStatusChange(true);
          }
        } else {
          setConnectionError(advancedTest.message);
        }
      }
    } catch (error) {
      console.error("Advanced connection test error:", error);
      setConnectionError(error.message);
      addLogEntry(`Advanced test error: ${error.message}`);
    } finally {
      setIsTesting(false);
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setConnectionError(null);
    
    if (simulationMode) {
      // Simulate connection test
      await new Promise(resolve => setTimeout(resolve, 800));
      
      addLogEntry(`Testing connection to ${config.nodeUrl} (SIMULATION)`);
      
      setConfig(prev => ({ ...prev, isConnected: true }));
      
      if (onConnectionStatusChange) {
        onConnectionStatusChange(true);
      }
      
      addLogEntry(`Connection test SIMULATED - pretending connection is successful`);
    } else {
      // Attempt real connection
      addLogEntry(`Testing connection to ${config.nodeUrl}`);
      
      try {
        const success = await testRCNodeConnection(config);
        
        setConfig(prev => ({ ...prev, isConnected: success }));
        
        if (onConnectionStatusChange) {
          onConnectionStatusChange(success);
        }
        
        if (success) {
          addLogEntry(`Connection test successful`);
        } else {
          addLogEntry(`Connection test failed`);
          setConnectionError("Connection failed. Check the URL, auth token, and ensure the RC Node is running.");
        }
      } catch (error) {
        addLogEntry(`Connection test error: ${error.message}`);
        setConnectionError(error.message);
        setConfig(prev => ({ ...prev, isConnected: false }));
        
        if (onConnectionStatusChange) {
          onConnectionStatusChange(false);
        }
      }
    }
    
    setIsTesting(false);
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

  const handleBrowserCommand = () => {
    const baseUrl = config.nodeUrl.endsWith('/') ? config.nodeUrl.slice(0, -1) : config.nodeUrl;
    const url = `${baseUrl}/node/status?authToken=${config.authToken}`;
    
    window.open(url, '_blank');
    
    toast({
      title: "Opening Browser Test",
      description: "Testing RC Node connection in a new browser tab"
    });
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
          {simulationMode && (
            <Badge variant="outline" className="ml-2 bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
              Simulation Mode
            </Badge>
          )}
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
            The URL where your Reality Capture Node is accessible, including port (no trailing slash)
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

        <div className="text-sm">
          <p className="font-medium">Connection Status:</p>
          <div className="mt-1 flex items-center">
            <div className={`h-2 w-2 rounded-full mr-2 ${config.isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span>{config.isConnected ? 'Connected to RC Node' : 'Not connected'}</span>
            {isServerReachable !== null && (
              <Badge 
                variant="outline" 
                className={`ml-2 ${isServerReachable ? 'bg-blue-500/10 text-blue-500' : 'bg-orange-500/10 text-orange-500'}`}
              >
                Server {isServerReachable ? 'Reachable' : 'Unreachable'}
              </Badge>
            )}
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
              <div className="flex justify-between items-center mb-2">
                <p className="font-medium">Connection Test Commands:</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <p>cURL Command:</p>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 px-2"
                      onClick={handleCurlCommand}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="p-2 bg-background/50 rounded overflow-x-auto whitespace-pre text-xs">
                    {generateTestCommand()}
                  </div>
                </div>
                
                <div>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="w-full mb-2"
                    onClick={handleBrowserCommand}
                  >
                    Open in Browser
                  </Button>
                  
                  <Button 
                    size="sm" 
                    variant="secondary" 
                    className="w-full"
                    onClick={handleTestConnectionAdvanced}
                    disabled={isTesting}
                  >
                    {isTesting ? (
                      <RefreshCw className="h-3 w-3 animate-spin mr-1" />
                    ) : null}
                    Run Advanced Diagnostics
                  </Button>
                </div>
              </div>
              
              {advancedResults && (
                <div className="border rounded p-2 mb-4 bg-background/50">
                  <p className="font-medium flex items-center">
                    Advanced Test Results: 
                    {advancedResults.success ? (
                      <Check className="h-4 w-4 text-green-500 ml-2" />
                    ) : (
                      <X className="h-4 w-4 text-red-500 ml-2" />
                    )}
                  </p>
                  <p className="text-xs mt-1">{advancedResults.message}</p>
                  
                  {advancedResults.details && (
                    <div className="mt-2 text-xs">
                      <p>Details:</p>
                      <pre className="p-1 bg-black/10 overflow-auto max-h-20 rounded text-xs mt-1">
                        {JSON.stringify(advancedResults.details, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
              
              {debugLog.length > 0 && (
                <>
                  <p className="font-medium mt-2">Connection Log:</p>
                  <div className="p-2 bg-background/50 rounded overflow-y-auto max-h-40">
                    {debugLog.map((log, index) => (
                      <div key={index} className="text-xs">{log}</div>
                    ))}
                  </div>
                </>
              )}
              
              <div className="mt-2 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-md">
                <p className="text-xs font-medium text-yellow-600 dark:text-yellow-400">Troubleshooting Tips:</p>
                <ul className="text-xs ml-4 list-disc text-muted-foreground mt-1 space-y-1">
                  <li>Make sure the URL has no trailing slash</li>
                  <li>Verify the auth token is correct (case sensitive)</li>
                  <li>Check that the RC Node server is running</li>
                  <li>Try accessing the URL directly in a browser</li>
                  <li>Check network settings/firewalls (port 8000 open)</li>
                  <li>Try on same device with curl to rule out CORS</li>
                  <li>If curl works but the app doesn't, it's likely a CORS issue</li>
                  <li>Check if RC Node allows cross-origin requests</li>
                </ul>
              </div>
              
              <p className="text-xs text-muted-foreground mt-4">
                Debugging Mode: {DEBUG_SETTINGS.rcNodeDebugMode ? "Enabled" : "Disabled"}<br/>
                CORS Mode: {DEBUG_SETTINGS.disableCors ? "Disabled (no-cors)" : "Enabled (cors)"}<br/>
                Ignore HTTPS Errors: {DEBUG_SETTINGS.ignoreHttpsErrors ? "Yes" : "No"}<br/>
                Force XHR: {DEBUG_SETTINGS.forceUseXhr ? "Yes" : "No"}<br/>
                Simulation Mode: {simulationMode ? "Active" : "Inactive"}
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
