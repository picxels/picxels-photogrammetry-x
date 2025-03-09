
import { useState } from "react";
import Layout from "@/camera_profiles/Layout";
import TabSystem from "@/components/TabSystem";
import CaptureTab from "@/components/tabs/CaptureTab";
import WorkflowTab from "@/components/tabs/WorkflowTab";
import SocialTab from "@/components/tabs/SocialTab";
import { useSession } from "@/hooks/useSession";
import { useMotorControlState } from "@/hooks/useMotorControlState";
import { useRCNodeConnection } from "@/hooks/useRCNodeConnection";

const Index = () => {
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [activeTab, setActiveTab] = useState<'capture' | 'workflow' | 'social'>('capture');
  
  const {
    session,
    currentPassId,
    currentPass,
    analyzedImage,
    processingImages,
    handleImageCaptured,
    handleNewPass,
    handleSwitchPass,
    handleSessionNameChange,
    handleNewSession,
    handleDeleteImage,
    handleSessionUpdated
  } = useSession();
  
  const {
    currentPosition,
    handlePositionChanged,
    handleScanStep
  } = useMotorControlState();
  
  const {
    rcNodeConnected,
    rcNodeConfig,
    handleRCNodeConnectionChange
  } = useRCNodeConnection();

  return (
    <Layout>
      <TabSystem activeTab={activeTab} setActiveTab={setActiveTab} />
      
      {activeTab === 'capture' ? (
        <CaptureTab 
          session={session}
          currentPassId={currentPassId}
          currentPosition={currentPosition}
          processingImages={processingImages}
          analyzedImage={analyzedImage}
          isSaving={isSaving}
          isExporting={isExporting}
          rcNodeConnected={rcNodeConnected}
          rcNodeConfig={rcNodeConfig}
          onImageCaptured={handleImageCaptured}
          onPositionChanged={handlePositionChanged}
          onScanStep={handleScanStep}
          onSwitchPass={handleSwitchPass}
          onNewPass={handleNewPass}
          onDeleteImage={handleDeleteImage}
          onSessionUpdated={handleSessionUpdated}
          onSessionNameChange={handleSessionNameChange}
          onSessionRefresh={handleNewSession}
          onRCNodeConnectionChange={handleRCNodeConnectionChange}
        />
      ) : activeTab === 'workflow' ? (
        <WorkflowTab 
          session={session}
          rcNodeConfig={rcNodeConfig}
          isSaving={isSaving}
          isExporting={isExporting}
          rcNodeConnected={rcNodeConnected}
          onSessionNameChange={handleSessionNameChange}
          onSessionRefresh={handleNewSession}
          onRCNodeConnectionChange={handleRCNodeConnectionChange}
        />
      ) : (
        <SocialTab 
          session={session}
          rcNodeConfig={rcNodeConfig}
          isSaving={isSaving}
          isExporting={isExporting}
          rcNodeConnected={rcNodeConnected}
          onSessionNameChange={handleSessionNameChange}
          onSessionRefresh={handleNewSession}
          onRCNodeConnectionChange={handleRCNodeConnectionChange}
        />
      )}
    </Layout>
  );
};

export default Index;
