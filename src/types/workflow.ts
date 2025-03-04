
export interface RCCommand {
  command: string;
  params?: string[];
}

export interface WorkflowStage {
  name: string;
  commands: RCCommand[];
}

export interface Workflow {
  workflow_name: string;
  stages: WorkflowStage[];
}

export interface WorkflowFile {
  id: string;
  name: string;
  path: string;
}

export interface WorkflowProgress {
  currentStage: string;
  currentCommand: string;
  percentComplete: number;
  status: 'idle' | 'running' | 'completed' | 'error';
  message?: string;
}
