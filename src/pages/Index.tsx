
import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import CameraControl from "@/components/CameraControl";
import ImagePreview from "@/components/ImagePreview";
import MotorControl from "@/components/MotorControl";
import FileManager from "@/components/FileManager";
import SubjectAnalysis from "@/components/SubjectAnalysis";
import { toast } from "@/components/ui/use-toast";
import { CapturedImage, MotorPosition, Session, AnalysisResult } from "@/types";
import { createSession, addImageToSession, renameSession } from "@/utils/cameraUtils";

const Index = () => {
  const [session, setSession] = useState<Session>(createSession());
  const [currentPosition, setCurrentPosition] = useState<MotorPosition>({ angle: 0, step: 0 });
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [analyzedImage, setAnalyzedImage] = useState<CapturedImage | null>(null);

  const handleImageCaptured = (image: CapturedImage) => {
    const updatedSession = addImageToSession(session, image);
    setSession(updatedSession);
    
    // If this is the first image and we don't have an image for analysis yet
    if (session.images.length === 0 && !analyzedImage) {
      setAnalyzedImage(image);
    }
  };

  const handlePositionChanged = (position: MotorPosition) => {
    setCurrentPosition(position);
  };

  const handleScanStep = async (position: MotorPosition) => {
    // This is called during an automated scan at each step
    // We don't need to update the position as it's already done in MotorControl
    return new Promise<void>((resolve) => {
      // Small delay to ensure stability before capture
      setTimeout(resolve, 300);
    });
  };

  const handleSessionNameChange = (name: string) => {
    setSession(renameSession(session, name));
  };

  const handleNewSession = () => {
    setSession(createSession());
    setAnalyzedImage(null);
    toast({
      title: "New Session Started",
      description: "All previous session data has been cleared."
    });
  };

  const handleDeleteImage = (imageId: string) => {
    setSession({
      ...session,
      images: session.images.filter(img => img.id !== imageId)
    });
    
    // If we deleted the analyzed image, reset it
    if (analyzedImage && analyzedImage.id === imageId) {
      setAnalyzedImage(null);
    }
    
    toast({
      title: "Image Deleted",
      description: "Image has been removed from the session."
    });
  };

  const handleAnalysisComplete = (result: AnalysisResult, suggestedName: string) => {
    // Update the session with the subject matter and suggested name
    setSession({
      ...session,
      name: suggestedName,
      subjectMatter: result.subject
    });
    
    toast({
      title: "Analysis Complete",
      description: `Subject identified: ${result.subject}`
    });
  };

  return (
    <Layout>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-6 md:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <CameraControl 
              currentSession={session}
              onImageCaptured={handleImageCaptured}
              currentAngle={currentPosition.angle}
            />
            
            <MotorControl 
              onPositionChanged={handlePositionChanged}
              onScanStep={handleScanStep}
            />
          </div>
          
          <ImagePreview 
            session={session}
            onDeleteImage={handleDeleteImage}
          />
        </div>
        
        <div className="space-y-6">
          <FileManager 
            session={session}
            onSessionNameChange={handleSessionNameChange}
            onSessionRefresh={handleNewSession}
            isSaving={isSaving}
            isExporting={isExporting}
          />
          
          <SubjectAnalysis 
            image={analyzedImage}
            onAnalysisComplete={handleAnalysisComplete}
            disabled={session.subjectMatter !== undefined}
          />
        </div>
      </div>
    </Layout>
  );
};

export default Index;
