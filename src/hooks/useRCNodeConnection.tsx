
import { useState, useEffect } from "react";
import { RCNodeConfig } from "@/types";
import { toast } from "@/components/ui/use-toast";
import { loadRCNodeConfig } from "@/utils/rcNodeService";

export const useRCNodeConnection = () => {
  const [rcNodeConnected, setRcNodeConnected] = useState(false);
  const [rcNodeConfig, setRcNodeConfig] = useState<RCNodeConfig>(() => {
    // Try to load saved configuration on initial render
    return loadRCNodeConfig();
  });

  // Initialize connection status based on saved config
  useEffect(() => {
    const savedConfig = loadRCNodeConfig();
    if (savedConfig.nodeUrl && savedConfig.authToken) {
      setRcNodeConfig(savedConfig);
    }
  }, []);

  const handleRCNodeConnectionChange = (isConnected: boolean, config?: RCNodeConfig) => {
    setRcNodeConnected(isConnected);
    if (config) {
      setRcNodeConfig({
        ...config,
        isConnected
      });
    } else {
      setRcNodeConfig(prev => ({
        ...prev,
        isConnected
      }));
    }
    
    if (isConnected) {
      toast({
        title: "RC Node Connected",
        description: "Ready to process photogrammetry data",
      });
    } else if (isConnected === false) { // Explicit check for false (not just falsy)
      toast({
        title: "RC Node Disconnected",
        description: "Connection to RC Node has been lost or closed",
        variant: "destructive"
      });
    }
  };

  return {
    rcNodeConnected,
    rcNodeConfig,
    handleRCNodeConnectionChange
  };
};
