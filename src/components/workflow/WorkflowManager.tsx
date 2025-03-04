
import React, { useState, useEffect } from 'react';
import { useWorkflow } from '@/hooks/useWorkflow';
import WorkflowSelector from './WorkflowSelector';
import WorkflowProgress from './WorkflowProgress';
import RCPreview from './RCPreview';
import SketchfabUploader from './SketchfabUploader';
import { Button } from '@/components/ui/button';
import { RCNodeConfig, Session } from '@/types';
import { RCPreviewData, SketchfabMetadata } from '@/types/workflow';
import { getWorkflowTemplateFromSession } from '@/utils/workflowTemplates';
import { FilePlus, Upload } from 'lucide-react';

interface WorkflowManagerProps {
  rcNodeConfig: RCNodeConfig;
  workflowDirectory?: string;
  currentSession?: Session;
}

const WorkflowManager: React.FC<WorkflowManagerProps> = ({
  rcNodeConfig,
  workflowDirectory = './workflows',
  currentSession
}) => {
  const {
    workflowFiles,
    selectedWorkflow,
    selectedWorkflowId,
    isLoading,
    isExecuting,
    progress,
    selectWorkflow,
    executeWorkflow,
    resetWorkflow
  } = useWorkflow({
    rcNodeConfig,
    directoryPath: workflowDirectory
  });

  const [previewData, setPreviewData] = useState<RCPreviewData | undefined>();
  const [showSketchfabUploader, setShowSketchfabUploader] = useState(false);

  // Listen for preview updates from RC Node
  useEffect(() => {
    if (isExecuting && rcNodeConfig.isConnected) {
      // This would be implemented to fetch preview data from RC Node
      // during execution
      const intervalId = setInterval(() => {
        // Mock implementation - in a real scenario, this would 
        // call an API to get the current preview data
        if (progress.percentComplete > 50) {
          setPreviewData({
            previewUrl: "https://example.com/rc-preview/embed",
            modelStats: {
              vertices: 25000,
              triangles: 50000,
              textureSize: "4096x4096"
            }
          });
        }
        
        if (progress.percentComplete > 80) {
          // Add render views once they're available
          setPreviewData(prev => ({
            ...prev!,
            renderViews: [
              "/render_view_1.jpg",
              "/render_view_2.jpg",
              "/render_view_3.jpg",
              "/render_view_4.jpg",
              "/render_view_5.jpg",
              "/render_view_6.jpg"
            ]
          }));
        }
      }, 2000);
      
      return () => clearInterval(intervalId);
    }
  }, [isExecuting, progress.percentComplete, rcNodeConfig.isConnected]);

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

  const handleRefreshWorkflows = async () => {
    // Force a refresh by selecting null workflow first
    await selectWorkflow(null);
    
    // Then reselect the workflow directory
    if (selectedWorkflowId) {
      await selectWorkflow(selectedWorkflowId);
    }
  };

  const handleCreateFromSession = () => {
    if (!currentSession) return;
    
    // Create a new workflow based on the current session
    const sessionWorkflow = getWorkflowTemplateFromSession(
      currentSession,
      currentSession.subjectMatter ? [currentSession.subjectMatter] : []
    );
    
    // Now we would save this as a YAML file and add it to workflow files
    console.log("Created workflow from session:", sessionWorkflow);
    
    // In a real implementation, this would save the workflow to disk
    // and then refresh the workflow list
    
    // For now, let's just set it as the selected workflow
    // (In a real implementation, we'd save it to disk first)
    
    // Mock implementation: add the workflow to the list
    const mockWorkflowId = `session-${Date.now()}`;
    const mockWorkflowFile = {
      id: mockWorkflowId,
      name: sessionWorkflow.workflow_name,
      path: `${workflowDirectory}/${currentSession.name.replace(/\s+/g, '_')}.yaml`
    };
    
    // This is a mock - in a real implementation, you'd save the file and refresh
    selectWorkflow(mockWorkflowId);
  };

  const handleSketchfabUpload = (metadata: SketchfabMetadata) => {
    console.log("Uploading to Sketchfab with metadata:", metadata);
    // This would trigger the actual upload process
    setShowSketchfabUploader(false);
    
    // In a real implementation, this would call the RC Node API to upload the model
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <WorkflowSelector
          workflowFiles={workflowFiles}
          selectedWorkflowId={selectedWorkflowId}
          selectedWorkflow={selectedWorkflow}
          isLoading={isLoading}
          isExecuting={isExecuting}
          onSelectWorkflow={selectWorkflow}
          onExecuteWorkflow={executeWorkflow}
          onRefreshWorkflows={handleRefreshWorkflows}
          extraActions={
            currentSession && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleCreateFromSession}
                disabled={isExecuting || isLoading}
                className="gap-1"
              >
                <FilePlus className="h-3.5 w-3.5" />
                Create from Session
              </Button>
            )
          }
        />
        
        <RCPreview 
          previewData={previewData} 
          currentStage={progress.currentStage}
          isLoading={isExecuting && !previewData}
        />
      </div>
      
      <WorkflowProgress progress={progress} />
      
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
        previewImageUrl={previewData?.renderViews?.[0]}
      />
    </div>
  );
};

export default WorkflowManager;
