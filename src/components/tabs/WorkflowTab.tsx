
import React from "react";
import WorkflowManager from "@/components/workflow/WorkflowManager";
import RCNodeConfig from "@/components/RCNodeConfig";
import FileManager from "@/camera_profiles/FileManager";
import { Session, RCNodeConfig as RCNodeConfigType } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Activity } from "lucide-react";

interface WorkflowTabProps {
  session: Session;
  rcNodeConfig: RCNodeConfigType;
  isSaving: boolean;
  isExporting: boolean;
  rcNodeConnected: boolean;
  onSessionNameChange: (name: string) => void;
  onSessionRefresh: () => void;
  onRCNodeConnectionChange: (isConnected: boolean, config?: RCNodeConfigType) => void;
}

const WorkflowTab: React.FC<WorkflowTabProps> = ({
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
        <WorkflowManager 
          rcNodeConfig={rcNodeConfig} 
          currentSession={session}  
        />
      </div>
      
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <RCNodeConfig onConnectionStatusChange={onRCNodeConnectionChange} />
            
            {rcNodeConnected && (
              <div className="mt-4">
                <Alert variant="default" className="bg-green-500/10 text-green-700 border-green-300 dark:text-green-400">
                  <Activity className="h-4 w-4" />
                  <AlertTitle>Connected to RC Node</AlertTitle>
                  <AlertDescription>
                    Your RC Node connection is active and ready for photogrammetry processing.
                    {rcNodeConfig.nodeUrl && (
                      <span className="block mt-1 text-xs opacity-70">{rcNodeConfig.nodeUrl}</span>
                    )}
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </CardContent>
        </Card>
        
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

export default WorkflowTab;
