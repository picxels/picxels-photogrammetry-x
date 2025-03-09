
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
    isLoading,
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

  // Show loading state if session data is still loading
  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-lg">Loading session data...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <TabSystem activeTab={activeTab} setActiveTab={setActiveTab} />
      
      {activeTab === 'capture' && session ? (
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
      ) : activeTab === 'workflow' && session ? (
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
      ) : activeTab === 'social' && session ? (
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
      ) : (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-lg">Session data unavailable. Please try refreshing.</p>
            <button 
              onClick={handleNewSession}
              className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
            >
              Create New Session
            </button>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Index;
