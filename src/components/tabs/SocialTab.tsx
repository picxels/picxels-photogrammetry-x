
import React, { useEffect, useState } from "react";
import SocialMediaConnections from "@/components/social/SocialMediaConnections";
import FileManager from "@/camera_profiles/FileManager";
import { Session, RCNodeConfig as RCNodeConfigType } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Workflow, WorkflowProgress } from "@/types/workflow";
import SketchfabUploader from "@/components/workflow/SketchfabUploader";
import { Share2, ExternalLink } from "lucide-react";
import SocialMediaSharing from "@/components/workflow/SocialMediaShare";

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
  const [showSketchfabUploader, setShowSketchfabUploader] = useState(false);
  const [completedWorkflows, setCompletedWorkflows] = useState<Workflow[]>([]);
  const [socialSharing, setSocialSharing] = useState([
    { platform: 'instagram', enabled: false, customText: '' },
    { platform: 'twitter', enabled: false, customText: '' },
    { platform: 'facebook', enabled: false, customText: '' },
    { platform: 'reddit', enabled: false, customText: '' },
    { platform: 'tiktok', enabled: false, customText: '' }
  ]);
  const [storeLink, setStoreLink] = useState('');
  
  // In a real implementation, this would fetch completed workflows from storage or API
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5 text-primary" />
              <span>Processed Models</span>
            </CardTitle>
            <CardDescription>
              Share your processed 3D models on various platforms
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {session.processedModels && session.processedModels.length > 0 ? (
              <div className="space-y-4">
                {session.processedModels.map((model, index) => (
                  <div key={index} className="p-4 border rounded-md hover:border-primary/50 transition-colors">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{model.name || `Model ${index + 1}`}</h3>
                        <p className="text-sm text-muted-foreground">
                          Processed on {new Date(model.processedAt || Date.now()).toLocaleDateString()}
                        </p>
                      </div>
                      <button 
                        className="text-primary hover:text-primary/80"
                        onClick={() => setShowSketchfabUploader(true)}
                      >
                        <ExternalLink className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No processed models available yet.</p>
                <p className="text-sm mt-2">
                  Process your datasets in the RC Workflow tab first.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
        
        <SocialMediaSharing 
          socialSharing={socialSharing}
          onSocialSharingChange={setSocialSharing}
          storeLink={storeLink}
          onStoreLinkChange={setStoreLink}
        />
        
        <SketchfabUploader
          open={showSketchfabUploader}
          onClose={() => setShowSketchfabUploader(false)}
          onUpload={(metadata) => {
            console.log("Upload with metadata:", metadata);
            setShowSketchfabUploader(false);
          }}
          initialMetadata={{
            title: session.subjectMatter || "3D Model",
            description: `3D scan created with Reality Capture. ${session.subjectMatter || ""}`,
            tags: [
              "photogrammetry", 
              "3d-scan", 
              ...(session.subjectMatter ? [session.subjectMatter.toLowerCase()] : [])
            ],
            socialSharing
          }}
          modelName={session.name || "3D Model"}
          previewImageUrl={session.previewImage}
        />
        
        <SocialMediaConnections />
      </div>
      
      <div className="space-y-6">
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
