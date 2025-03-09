
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Check, X } from "lucide-react";

interface RCNodeStatusBadgeProps {
  isConnected: boolean;
  simulationMode?: boolean;
  isServerReachable?: boolean | null;
}

const RCNodeStatusBadge: React.FC<RCNodeStatusBadgeProps> = ({
  isConnected,
  simulationMode = false,
  isServerReachable
}) => {
  return (
    <div className="text-sm">
      <p className="font-medium">Connection Status:</p>
      <div className="mt-1 flex items-center">
        <div className={`h-2 w-2 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
        <span>{isConnected ? 'Connected to RC Node' : 'Not connected'}</span>
        
        {simulationMode && (
          <Badge variant="outline" className="ml-2 bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
            Simulation Mode
          </Badge>
        )}
        
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
  );
};

export default RCNodeStatusBadge;
