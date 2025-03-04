import { useState, useEffect } from "react";
import Layout from "@/camera_profiles/Layout";
import CameraControl from "@/camera_profiles/CameraControl";
import ImagePreview from "@/camera_profiles/ImagePreview";
import MotorControl from "@/camera_profiles/MotorControl";
import FileManager from "@/camera_profiles/FileManager";
import SubjectAnalysis from "@/camera_profiles/SubjectAnalysis";
import RCNodeConfig from "@/components/RCNodeConfig";
import { toast } from "@/components/ui/use-toast";
import { CapturedImage, MotorPosition, Session, AnalysisResult, Pass } from "@/types";
import { createSession, addImageToPass, renameSession, generateImageMask, createNewPass } from "@/utils/cameraUtils";

const Index = () => {
  const [session, setSession] = useState<Session>(createSession());
  const [currentPosition, setCurrentPosition] = useState<MotorPosition>({ angle: 0, step: 0 });
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [analyzedImage, setAnalyzedImage] = useState<CapturedImage | null>(null);
  const [processingImages, setProcessingImages] = useState<string[]>([]);
  const [rcNodeConnected, setRcNodeConnected] = useState(false);
  const [currentPassId, setCurrentPassId] = useState<string>("");

  useEffect(() => {
    if (session.passes && session.passes.length > 0 && !currentPassId) {
      setCurrentPassId(session.passes[0].id);
    }
  }, [session, currentPassId]);

  const handleImageCaptured = async (image: CapturedImage) => {
    if (!currentPassId && session.passes.length > 0) {
      setCurrentPassId(session.passes[0].id);
    }
    
    const passId = currentPassId || (session.passes.length > 0 ? session.passes[0].id : "");
    
    if (!passId) {
      console.error("No pass available to add the image to");
      toast({
        title: "Capture Error",
        description: "No active pass available. Please create a new session.",
        variant: "destructive"
      });
      return;
    }
    
    const updatedSession = addImageToPass(session, passId, image);
    setSession(updatedSession);
    
    if (session.images.length === 0 && !analyzedImage) {
      setAnalyzedImage(image);
    }
    
    if (image.sharpness && image.sharpness >= 80) {
      setProcessingImages((prev) => [...prev, image.id]);
      
      try {
        const maskedImage = await generateImageMask(image);
        
        setSession((prevSession) => {
          const updatedImages = prevSession.images.map((img) => 
            img.id === maskedImage.id ? maskedImage : img
          );
          
          const updatedPasses = prevSession.passes.map(pass => {
            if (pass.id === passId) {
              return {
                ...pass,
                images: pass.images.map(img => 
                  img.id === maskedImage.id ? maskedImage : img
                )
              };
            }
            return pass;
          });
          
          return {
            ...prevSession,
            images: updatedImages,
            passes: updatedPasses
          };
        });
        
        console.log(`Background mask generated for image: ${image.id}`);
      } catch (error) {
        console.error("Error generating mask:", error);
        toast({
          title: "Mask Generation Failed",
          description: "Failed to generate background mask.",
          variant: "destructive"
        });
      } finally {
        setProcessingImages((prev) => prev.filter((id) => id !== image.id));
      }
    }
  };

  const handleNewPass = () => {
    const passName = `Pass ${session.passes.length + 1}`;
    const newPass = createNewPass(passName);
    
    setSession(prev => ({
      ...prev,
      passes: [...prev.passes, newPass],
      updatedAt: new Date()
    }));
    
    setCurrentPassId(newPass.id);
    
    toast({
      title: "New Pass Added",
      description: `${passName} has been added to the session.`
    });
  };
  
  const handleSwitchPass = (passId: string) => {
    setCurrentPassId(passId);
    
    const passName = session.passes.find(p => p.id === passId)?.name || "Unknown";
    
    toast({
      title: "Pass Switched",
      description: `Now working with ${passName}.`
    });
  };

  const handlePositionChanged = (position: MotorPosition) => {
    setCurrentPosition(position);
  };

  const handleScanStep = async (position: MotorPosition) => {
    return new Promise<void>((resolve) => {
      setTimeout(resolve, 300);
    });
  };

  const handleSessionNameChange = (name: string) => {
    setSession(renameSession(session, name));
  };

  const handleNewSession = () => {
    const newSession = createSession();
    setSession(newSession);
    setAnalyzedImage(null);
    setCurrentPassId(newSession.passes[0].id);
    
    toast({
      title: "New Session Started",
      description: "All previous session data has been cleared."
    });
  };

  const handleDeleteImage = (imageId: string) => {
    setSession(prev => {
      const updatedImages = prev.images.filter(img => img.id !== imageId);
      
      const updatedPasses = prev.passes.map(pass => ({
        ...pass,
        images: pass.images.filter(img => img.id !== imageId)
      }));
      
      return {
        ...prev,
        images: updatedImages,
        passes: updatedPasses,
        updatedAt: new Date()
      };
    });
    
    if (analyzedImage && analyzedImage.id === imageId) {
      setAnalyzedImage(null);
    }
    
    toast({
      title: "Image Deleted",
      description: "Image has been removed from the session."
    });
  };

  const handleAnalysisComplete = (result: AnalysisResult, suggestedName: string) => {
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

  const handleRCNodeConnectionChange = (isConnected: boolean) => {
    setRcNodeConnected(isConnected);
    if (isConnected) {
      toast({
        title: "RC Node Connected",
        description: "Ready to process photogrammetry data",
      });
    }
  };

  const currentPass = session.passes.find(p => p.id === currentPassId) || null;

  return (
    <Layout>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-6 md:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <CameraControl 
              currentSession={session}
              onImageCaptured={handleImageCaptured}
              currentAngle={currentPosition.angle}
              currentPass={currentPass}
            />
            
            <MotorControl 
              onPositionChanged={handlePositionChanged}
              onScanStep={handleScanStep}
            />
          </div>
          
          <div className="flex justify-between items-center mb-2">
            <div className="flex gap-2">
              {session.passes.map(pass => (
                <Button
                  key={pass.id}
                  variant={currentPassId === pass.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleSwitchPass(pass.id)}
                >
                  {pass.name}
                </Button>
              ))}
            </div>
            <Button size="sm" onClick={handleNewPass}>Add Pass</Button>
          </div>
          
          <ImagePreview 
            session={session}
            onDeleteImage={handleDeleteImage}
            processingImages={processingImages}
            currentPass={currentPass}
          />
        </div>
        
        <div className="space-y-6">
          <RCNodeConfig onConnectionStatusChange={handleRCNodeConnectionChange} />
          
          <FileManager 
            session={session}
            onSessionNameChange={handleSessionNameChange}
            onSessionRefresh={handleNewSession}
            isSaving={isSaving}
            isExporting={isExporting}
            rcNodeConnected={rcNodeConnected}
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
