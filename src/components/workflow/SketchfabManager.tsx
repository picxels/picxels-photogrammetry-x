
import React, { useState, useEffect } from 'react';
import SketchfabUploader from './SketchfabUploader';
import { SketchfabMetadata } from '@/types/workflow';
import { Workflow, WorkflowProgress } from '@/types/workflow';
import { Session } from '@/types';

interface SketchfabManagerProps {
  progress: WorkflowProgress;
  selectedWorkflow: Workflow | null;
  currentSession?: Session;
  previewImageUrl?: string;
}

const SketchfabManager: React.FC<SketchfabManagerProps> = ({
  progress,
  selectedWorkflow,
  currentSession,
  previewImageUrl
}) => {
  const [showSketchfabUploader, setShowSketchfabUploader] = useState(false);

  // Show Sketchfab uploader when workflow completes and includes upload stage
  useEffect(() => {
    if (
      progress.status === 'completed' && 
      selectedWorkflow?.stages.some(stage => 
        stage.name.includes('Upload') || 
        stage.name.includes('Sketchfab')
      )
    ) {
      setShowSketchfabUploader(true);
    }
  }, [progress.status, selectedWorkflow]);

  const handleSketchfabUpload = (metadata: SketchfabMetadata) => {
    console.log("Uploading to Sketchfab with metadata:", metadata);
    // This would trigger the actual upload process
    setShowSketchfabUploader(false);
    
    // In a real implementation, this would call the RC Node API to upload the model
  };

  return (
    <SketchfabUploader
      open={showSketchfabUploader}
      onClose={() => setShowSketchfabUploader(false)}
      onUpload={handleSketchfabUpload}
      initialMetadata={{
        title: currentSession?.subjectMatter || selectedWorkflow?.workflow_name || "",
        description: `3D scan created with Reality Capture. ${currentSession?.subjectMatter || ""}`,
        tags: [
          "photogrammetry", 
          "3d-scan", 
          ...(currentSession?.subjectMatter ? [currentSession.subjectMatter.toLowerCase()] : [])
        ]
      }}
      modelName={currentSession?.name || "3D Model"}
      previewImageUrl={previewImageUrl}
    />
  );
};

export default SketchfabManager;
