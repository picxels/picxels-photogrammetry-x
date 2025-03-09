
import { useState, useEffect } from "react";
import { RCNodeConfig } from "@/types";
import { 
  loadRCNodeConfig, 
  saveRCNodeConfig, 
  testRCNodeConnection, 
  testServerReachable,
  testRCNodeConnectionAdvanced 
} from "@/utils/rcNodeService";
import { toast } from "@/components/ui/use-toast";
import { DEBUG_SETTINGS } from "@/config/jetson.config";

interface UseRCNodeConfigProps {
  onConnectionStatusChange?: (isConnected: boolean) => void;
}

export const useRCNodeConfig = ({ onConnectionStatusChange }: UseRCNodeConfigProps) => {
  const [config, setConfig] = useState<RCNodeConfig>(loadRCNodeConfig);
  const [isTesting, setIsTesting] = useState(false);
  const [isServerReachable, setIsServerReachable] = useState<boolean | null>(null);
  const [showDebugInfo, setShowDebugInfo] = useState(DEBUG_SETTINGS.rcNodeDebugMode);
  const [debugLog, setDebugLog] = useState<string[]>([]);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [advancedResults, setAdvancedResults] = useState<any>(null);
  const [simulationMode, setSimulationMode] = useState(false);

  useEffect(() => {
    const checkApiAvailability = async () => {
      try {
        const response = await fetch('/api/health', { method: 'HEAD' });
        const apiAvailable = response.ok;
        
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
      await new Promise(resolve => setTimeout(resolve, 800));
      
      addLogEntry(`Testing connection to ${config.nodeUrl} (SIMULATION)`);
      
      setConfig(prev => ({ ...prev, isConnected: true }));
      
      if (onConnectionStatusChange) {
        onConnectionStatusChange(true);
      }
      
      addLogEntry(`Connection test SIMULATED - pretending connection is successful`);
    } else {
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

  return {
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
  };
};
