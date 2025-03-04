
import React from 'react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { WorkflowFile, Workflow } from '@/types/workflow';
import { Play, RefreshCw, FileDigit } from 'lucide-react';

interface WorkflowSelectorProps {
  workflowFiles: WorkflowFile[];
  selectedWorkflowId: string | null;
  selectedWorkflow: Workflow | null;
  isLoading: boolean;
  isExecuting: boolean;
  onSelectWorkflow: (id: string | null) => void;
  onExecuteWorkflow: () => void;
  onRefreshWorkflows: () => void;
}

const WorkflowSelector: React.FC<WorkflowSelectorProps> = ({
  workflowFiles,
  selectedWorkflowId,
  selectedWorkflow,
  isLoading,
  isExecuting,
  onSelectWorkflow,
  onExecuteWorkflow,
  onRefreshWorkflows
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileDigit className="h-5 w-5 text-primary" />
          <span>RC Workflow Manager</span>
        </CardTitle>
        <CardDescription>
          Select and run predefined Reality Capture workflows
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <label className="text-sm font-medium mb-1 block">
              Select Workflow
            </label>
            <Select
              value={selectedWorkflowId || ''}
              onValueChange={(value) => onSelectWorkflow(value || null)}
              disabled={isLoading || isExecuting}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a workflow" />
              </SelectTrigger>
              <SelectContent>
                {workflowFiles.map((file) => (
                  <SelectItem key={file.id} value={file.id}>
                    {file.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={onRefreshWorkflows}
            disabled={isLoading || isExecuting}
            className="mb-0.5"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {selectedWorkflow && (
          <div className="bg-primary/5 p-3 rounded-md border border-primary/20">
            <h4 className="font-medium text-sm mb-1">{selectedWorkflow.workflow_name}</h4>
            <p className="text-xs text-muted-foreground mb-2">
              {selectedWorkflow.stages.length} stages, {' '}
              {selectedWorkflow.stages.reduce((sum, stage) => sum + stage.commands.length, 0)} commands
            </p>
            <div className="space-y-1">
              {selectedWorkflow.stages.map((stage, index) => (
                <div key={index} className="text-xs">
                  {index + 1}. {stage.name}
                </div>
              ))}
            </div>
          </div>
        )}

        <Button
          className="w-full"
          onClick={onExecuteWorkflow}
          disabled={!selectedWorkflow || isExecuting || isLoading}
        >
          {isExecuting ? (
            <>
              <div className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin mr-2" />
              Executing...
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" />
              Execute Workflow
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default WorkflowSelector;
