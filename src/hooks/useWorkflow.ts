
import { useState, useEffect } from 'react';
import { 
  Workflow, 
  WorkflowFile, 
  WorkflowProgress,
  RCNodeConfig
} from '@/types';
import { 
  scanWorkflowDirectory, 
  loadWorkflowFile, 
  workflowToRCCommands 
} from '@/utils/workflowUtils';
import { executeRCWorkflow } from '@/utils/rcCommandExecutor';
import { toast } from '@/components/ui/use-toast';
import { v4 as uuidv4 } from 'uuid';

interface UseWorkflowProps {
  rcNodeConfig: RCNodeConfig;
  directoryPath?: string;
}

export function useWorkflow({ rcNodeConfig, directoryPath = './workflows' }: UseWorkflowProps) {
  const [workflowFiles, setWorkflowFiles] = useState<WorkflowFile[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [progress, setProgress] = useState<WorkflowProgress>({
    currentStage: '',
    currentCommand: '',
    percentComplete: 0,
    status: 'idle'
  });

  // Load workflow files on mount
  useEffect(() => {
    const loadWorkflows = async () => {
      setIsLoading(true);
      try {
        const files = await scanWorkflowDirectory(directoryPath);
        setWorkflowFiles(files);
      } catch (error) {
        console.error('Failed to load workflow files:', error);
        toast({
          title: 'Error Loading Workflows',
          description: 'Could not load workflow files',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadWorkflows();
  }, [directoryPath]);

  // Select a workflow by ID
  const selectWorkflow = async (workflowId: string | null) => {
    if (!workflowId) {
      setSelectedWorkflow(null);
      setSelectedWorkflowId(null);
      return;
    }

    setIsLoading(true);
    setSelectedWorkflowId(workflowId);

    try {
      const workflowFile = workflowFiles.find(file => file.id === workflowId);
      
      if (!workflowFile) {
        throw new Error(`Workflow with ID ${workflowId} not found`);
      }

      const workflow = await loadWorkflowFile(workflowFile.path);
      if (workflow) {
        // Ensure the workflow has all required properties before setting state
        const completeWorkflow: Workflow = {
          id: workflow.id || uuidv4(),
          name: workflow.name || workflowFile.name,
          description: workflow.description || '',
          stages: workflow.stages || [],
          createdAt: workflow.createdAt || Date.now(),
          updatedAt: workflow.updatedAt || Date.now(),
          workflow_name: workflow.workflow_name || workflow.name || workflowFile.name
        };
        setSelectedWorkflow(completeWorkflow);
      }
    } catch (error) {
      console.error('Failed to select workflow:', error);
      toast({
        title: 'Error Selecting Workflow',
        description: 'Could not load the selected workflow',
        variant: 'destructive'
      });
      setSelectedWorkflow(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Execute the selected workflow
  const executeWorkflow = async () => {
    if (!selectedWorkflow) {
      toast({
        title: 'No Workflow Selected',
        description: 'Please select a workflow to execute',
        variant: 'destructive'
      });
      return false;
    }

    if (!rcNodeConfig.isConnected) {
      toast({
        title: 'Not Connected to RC Node',
        description: 'Please configure and connect to RC Node first',
        variant: 'destructive'
      });
      return false;
    }

    setIsExecuting(true);
    setProgress({
      currentStage: 'Initializing',
      currentCommand: '',
      percentComplete: 0,
      status: 'running'
    });

    try {
      const commands = workflowToRCCommands(selectedWorkflow);
      const success = await executeRCWorkflow(
        rcNodeConfig, 
        commands, 
        (newProgress) => setProgress(newProgress)
      );
      
      return success;
    } catch (error) {
      console.error('Failed to execute workflow:', error);
      setProgress({
        currentStage: 'Error',
        currentCommand: '',
        percentComplete: 0,
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
      toast({
        title: 'Workflow Execution Failed',
        description: 'An error occurred while executing the workflow',
        variant: 'destructive'
      });
      return false;
    } finally {
      setIsExecuting(false);
    }
  };

  // Reset workflow state
  const resetWorkflow = () => {
    setProgress({
      currentStage: '',
      currentCommand: '',
      percentComplete: 0,
      status: 'idle'
    });
  };

  return {
    workflowFiles,
    selectedWorkflow,
    selectedWorkflowId,
    isLoading,
    isExecuting,
    progress,
    selectWorkflow,
    executeWorkflow,
    resetWorkflow
  };
}
