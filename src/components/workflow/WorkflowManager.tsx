
import React from 'react';
import { useWorkflow } from '@/hooks/useWorkflow';
import WorkflowSelector from './WorkflowSelector';
import WorkflowProgress from './WorkflowProgress';
import { RCNodeConfig } from '@/types';

interface WorkflowManagerProps {
  rcNodeConfig: RCNodeConfig;
  workflowDirectory?: string;
}

const WorkflowManager: React.FC<WorkflowManagerProps> = ({
  rcNodeConfig,
  workflowDirectory = './workflows'
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

  const handleRefreshWorkflows = async () => {
    // Force a refresh by selecting null workflow first
    await selectWorkflow(null);
    
    // Then reselect the workflow directory
    if (selectedWorkflowId) {
      await selectWorkflow(selectedWorkflowId);
    }
  };

  return (
    <div className="space-y-4">
      <WorkflowSelector
        workflowFiles={workflowFiles}
        selectedWorkflowId={selectedWorkflowId}
        selectedWorkflow={selectedWorkflow}
        isLoading={isLoading}
        isExecuting={isExecuting}
        onSelectWorkflow={selectWorkflow}
        onExecuteWorkflow={executeWorkflow}
        onRefreshWorkflows={handleRefreshWorkflows}
      />
      
      <WorkflowProgress progress={progress} />
    </div>
  );
};

export default WorkflowManager;
