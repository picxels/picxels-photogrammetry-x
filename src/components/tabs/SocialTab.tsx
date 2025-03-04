
import React from "react";
import SocialMediaConnections from "@/components/social/SocialMediaConnections";
import RCNodeConfig from "@/components/RCNodeConfig";
import FileManager from "@/camera_profiles/FileManager";
import { Session, RCNodeConfig as RCNodeConfigType } from "@/types";

interface SocialTabProps {
  session: Session;
  rcNodeConfig: RCNodeConfigType;
  isSaving: boolean;
  isExporting: boolean;
  rcNodeConnected: boolean;
  onSessionNameChange: (name: string) => void;
  onSessionRefresh: () => void;
  onRCNodeConnectionChange: (isConnected: boolean, config?: RCNodeConfigType) => void;
}

const SocialTab: React.FC<SocialTabProps> = ({
  session,
  rcNodeConfig,
  isSaving,
  isExporting,
  rcNodeConnected,
  onSessionNameChange,
  onSessionRefresh,
  onRCNodeConnectionChange
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <SocialMediaConnections />
      </div>
      
      <div className="space-y-6">
        <RCNodeConfig onConnectionStatusChange={onRCNodeConnectionChange} />
        
        <FileManager 
          session={session}
          onSessionNameChange={onSessionNameChange}
          onSessionRefresh={onSessionRefresh}
          isSaving={isSaving}
          isExporting={isExporting}
          rcNodeConnected={rcNodeConnected}
          rcNodeConfig={rcNodeConfig}
        />
      </div>
    </div>
  );
};

export default SocialTab;
