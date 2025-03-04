
import { RCCommand, WorkflowProgress, RCNodeConfig } from '@/types';
import { sendRCNodeCommand } from '@/utils/rcNodeService';
import { formatRCCommand } from '@/utils/workflowUtils';
import { toast } from '@/components/ui/use-toast';

/**
 * Execute a sequence of RC commands and track progress
 */
export const executeRCWorkflow = async (
  rcNodeConfig: RCNodeConfig,
  commands: { stageName: string, commands: RCCommand[] }[],
  onProgressUpdate: (progress: WorkflowProgress) => void
): Promise<boolean> => {
  if (!rcNodeConfig.isConnected) {
    toast({
      title: 'Connection Error',
      description: 'Not connected to RC Node. Please configure connection settings first.',
      variant: 'destructive'
    });
    
    onProgressUpdate({
      currentStage: 'Connection Error',
      currentCommand: '',
      percentComplete: 0,
      status: 'error',
      message: 'Not connected to RC Node'
    });
    
    return false;
  }
  
  // Total commands to execute for progress calculation
  const totalCommands = commands.reduce((sum, stage) => sum + stage.commands.length, 0);
  let completedCommands = 0;
  
  try {
    // Process each stage
    for (const stage of commands) {
      console.log(`Starting stage: ${stage.stageName}`);
      
      onProgressUpdate({
        currentStage: stage.stageName,
        currentCommand: '',
        percentComplete: Math.round((completedCommands / totalCommands) * 100),
        status: 'running'
      });
      
      // Process each command in the stage
      for (const command of stage.commands) {
        const formattedCommand = formatRCCommand(command);
        console.log(`Executing command: ${formattedCommand}`);
        
        onProgressUpdate({
          currentStage: stage.stageName,
          currentCommand: command.command,
          percentComplete: Math.round((completedCommands / totalCommands) * 100),
          status: 'running'
        });
        
        try {
          // Execute the command
          await sendRCNodeCommand(
            rcNodeConfig,
            command.command,
            command.params ? Object.fromEntries(command.params.map((param, i) => [`param${i + 1}`, param])) : {}
          );
          
          // Check progress after command
          const progressInfo = await sendRCNodeCommand(rcNodeConfig, 'getprogress');
          
          if (progressInfo && typeof progressInfo.progress === 'number') {
            // Update UI with more accurate progress from RC
            onProgressUpdate({
              currentStage: stage.stageName,
              currentCommand: command.command,
              percentComplete: Math.min(
                Math.round((completedCommands / totalCommands) * 100) + 
                Math.round(progressInfo.progress / totalCommands),
                100
              ),
              status: 'running',
              message: progressInfo.message || ''
            });
          }
          
          completedCommands++;
        } catch (error) {
          console.error(`Command execution error (${command.command}):`, error);
          
          onProgressUpdate({
            currentStage: stage.stageName,
            currentCommand: command.command,
            percentComplete: Math.round((completedCommands / totalCommands) * 100),
            status: 'error',
            message: `Error executing command: ${command.command}`
          });
          
          toast({
            title: 'Command Execution Error',
            description: `Failed to execute command: ${command.command}`,
            variant: 'destructive'
          });
          
          // Continue to next command despite error
        }
      }
    }
    
    onProgressUpdate({
      currentStage: 'Completed',
      currentCommand: '',
      percentComplete: 100,
      status: 'completed'
    });
    
    toast({
      title: 'Workflow Completed',
      description: 'The workflow has been successfully executed'
    });
    
    return true;
  } catch (error) {
    console.error('Workflow execution error:', error);
    
    onProgressUpdate({
      currentStage: 'Error',
      currentCommand: '',
      percentComplete: Math.round((completedCommands / totalCommands) * 100),
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
    
    toast({
      title: 'Workflow Execution Failed',
      description: 'An error occurred during workflow execution',
      variant: 'destructive'
    });
    
    return false;
  }
};
