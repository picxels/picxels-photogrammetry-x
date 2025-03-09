
import React from "react";
import CameraControl from "@/camera_profiles/CameraControl";
import MotorControl from "@/camera_profiles/MotorControl";
import ImagePreview from "@/camera_profiles/ImagePreview";
import FileManager from "@/camera_profiles/FileManager";
import SubjectAnalysis from "@/camera_profiles/SubjectAnalysis";
import PassControls from "@/components/PassControls";
import { Session, MotorPosition, CapturedImage, RCNodeConfig as RCNodeConfigType } from "@/types";

interface CaptureTabProps {
  session: Session;
  currentPassId: string;
  currentPosition: MotorPosition;
  processingImages: string[];
  analyzedImage: CapturedImage | null;
  isSaving: boolean;
  isExporting: boolean;
  rcNodeConnected: boolean;
  rcNodeConfig: RCNodeConfigType;
  onImageCaptured: (image: CapturedImage) => void;
  onPositionChanged: (position: MotorPosition) => void;
  onScanStep: (position: MotorPosition) => Promise<void>;
  onSwitchPass: (passId: string) => void;
  onNewPass: () => void;
  onDeleteImage: (imageId: string) => void;
  onSessionUpdated: (session: Session) => void;
  onSessionNameChange: (name: string) => void;
  onSessionRefresh: () => void;
  onRCNodeConnectionChange: (isConnected: boolean, config?: RCNodeConfigType) => void;
}

const CaptureTab: React.FC<CaptureTabProps> = ({
  session,
  currentPassId,
  currentPosition,
  processingImages,
  analyzedImage,
  isSaving,
  isExporting,
  rcNodeConnected,
  rcNodeConfig,
  onImageCaptured,
  onPositionChanged,
  onScanStep,
  onSwitchPass,
  onNewPass,
  onDeleteImage,
  onSessionUpdated,
  onSessionNameChange,
  onSessionRefresh,
  onRCNodeConnectionChange
}) => {
  // Early return with loading state if session isn't loaded yet
  if (!session || !session.passes) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg">Loading session data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="space-y-6 md:col-span-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <CameraControl 
            currentSession={session}
            onImageCaptured={onImageCaptured}
            currentAngle={currentPosition.angle}
          />
          
          <MotorControl 
            onPositionChanged={onPositionChanged}
            onScanStep={onScanStep}
          />
        </div>
        
        <PassControls 
          passes={session.passes}
          currentPassId={currentPassId}
          onSwitchPass={onSwitchPass}
          onNewPass={onNewPass}
        />
        
        <ImagePreview 
          session={session}
          onDeleteImage={onDeleteImage}
          processingImages={processingImages}
        />
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
        
        <SubjectAnalysis 
          image={analyzedImage}
          session={session}
          onSessionUpdated={onSessionUpdated}
          disabled={!!session.subjectMatter}
        />
      </div>
    </div>
  );
};

export default CaptureTab;
