
import React from 'react';
import { useWorkflow } from '@/hooks/useWorkflow';
import { useRCPreviewData } from '@/hooks/useRCPreviewData';
import WorkflowSelector from './WorkflowSelector';
import WorkflowProgress from './WorkflowProgress';
import RCPreview from './RCPreview';
import WorkflowCreator from './WorkflowCreator';
import SketchfabManager from './SketchfabManager';
import { RCNodeConfig, Session } from '@/types';

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

  const { previewData } = useRCPreviewData({ 
    isExecuting, 
    progress, 
    rcNodeConfig 
  });

  const handleRefreshWorkflows = async () => {
    // Force a refresh by selecting null workflow first
    await selectWorkflow(null);
    
    // Then reselect the workflow directory
    if (selectedWorkflowId) {
      await selectWorkflow(selectedWorkflowId);
    }
  };

  const handleCreateFromSession = (workflowId: string) => {
    selectWorkflow(workflowId);
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
            <WorkflowCreator
              currentSession={currentSession}
              isExecuting={isExecuting}
              isLoading={isLoading}
              onCreateWorkflow={handleCreateFromSession}
            />
          }
        />
        
        <RCPreview 
          previewData={previewData} 
          currentStage={progress.currentStage}
          isLoading={isExecuting && !previewData}
        />
      </div>
      
      <WorkflowProgress progress={progress} />
      
      <SketchfabManager
        progress={progress}
        selectedWorkflow={selectedWorkflow}
        currentSession={currentSession}
        previewImageUrl={previewData?.renderViews?.[0]}
      />
    </div>
  );
};

export default WorkflowManager;
