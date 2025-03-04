
import { useState } from "react";
import { RCNodeConfig } from "@/types";
import { toast } from "@/components/ui/use-toast";

export const useRCNodeConnection = () => {
  const [rcNodeConnected, setRcNodeConnected] = useState(false);
  const [rcNodeConfig, setRcNodeConfig] = useState<RCNodeConfig>({
    nodeUrl: '',
    authToken: '',
    isConnected: false
  });

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
    }
  };

  return {
    rcNodeConnected,
    rcNodeConfig,
    handleRCNodeConnectionChange
  };
};
