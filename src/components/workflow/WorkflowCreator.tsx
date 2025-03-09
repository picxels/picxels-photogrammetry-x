
import React from 'react';
import { Button } from '@/components/ui/button';
import { Session } from '@/types';
import { getWorkflowTemplateFromSession } from '@/utils/rcNodeCommands';
import { FilePlus } from 'lucide-react';

interface WorkflowCreatorProps {
  currentSession?: Session;
  isExecuting: boolean;
  isLoading: boolean;
  onCreateWorkflow: (workflowId: string) => void;
}

const WorkflowCreator: React.FC<WorkflowCreatorProps> = ({
  currentSession,
  isExecuting,
  isLoading,
  onCreateWorkflow
}) => {
  const handleCreateFromSession = () => {
    if (!currentSession) return;
    
    // Create a new workflow based on the current session
    const sessionWorkflow = getWorkflowTemplateFromSession(
      currentSession,
      currentSession.subjectMatter ? [currentSession.subjectMatter] : []
    );
    
    // In a real implementation, this would save the workflow to disk
    // and then refresh the workflow list
    
    // Mock implementation: add the workflow to the list
    const mockWorkflowId = sessionWorkflow.id;
    
    // This is a mock - in a real implementation, you'd save the file and refresh
    onCreateWorkflow(mockWorkflowId);
  };

  return (
    currentSession ? (
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
    ) : null
  );
};

export default WorkflowCreator;
