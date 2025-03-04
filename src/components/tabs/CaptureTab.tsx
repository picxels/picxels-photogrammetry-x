
import React from "react";
import CameraControl from "@/camera_profiles/CameraControl";
import MotorControl from "@/camera_profiles/MotorControl";
import ImagePreview from "@/camera_profiles/ImagePreview";
import RCNodeConfig from "@/components/RCNodeConfig";
import FileManager from "@/camera_profiles/FileManager";
import SubjectAnalysis from "@/camera_profiles/SubjectAnalysis";
import PassControls from "@/components/PassControls";
import { Session, MotorPosition, CapturedImage, AnalysisResult, RCNodeConfig as RCNodeConfigType } from "@/types";

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
  onAnalysisComplete: (result: AnalysisResult, suggestedName: string) => void;
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
  onAnalysisComplete,
  onSessionNameChange,
  onSessionRefresh,
  onRCNodeConnectionChange
}) => {
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
        
        <SubjectAnalysis 
          image={analyzedImage}
          onAnalysisComplete={onAnalysisComplete}
          disabled={session.subjectMatter !== undefined}
        />
      </div>
    </div>
  );
};

export default CaptureTab;
