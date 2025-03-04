
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
import { Badge } from '@/components/ui/badge';

interface WorkflowSelectorProps {
  workflowFiles: WorkflowFile[];
  selectedWorkflowId: string | null;
  selectedWorkflow: Workflow | null;
  isLoading: boolean;
  isExecuting: boolean;
  onSelectWorkflow: (id: string | null) => void;
  onExecuteWorkflow: () => void;
  onRefreshWorkflows: () => void;
  extraActions?: React.ReactNode;
}

const WorkflowSelector: React.FC<WorkflowSelectorProps> = ({
  workflowFiles,
  selectedWorkflowId,
  selectedWorkflow,
  isLoading,
  isExecuting,
  onSelectWorkflow,
  onExecuteWorkflow,
  onRefreshWorkflows,
  extraActions
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
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-medium text-sm">{selectedWorkflow.workflow_name}</h4>
              {selectedWorkflow.metadata?.tags && selectedWorkflow.metadata.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 justify-end">
                  {selectedWorkflow.metadata.tags.slice(0, 2).map((tag, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {selectedWorkflow.metadata?.tags.length > 2 && (
                    <Badge variant="outline" className="text-xs">
                      +{selectedWorkflow.metadata.tags.length - 2}
                    </Badge>
                  )}
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground mb-2">
              {selectedWorkflow.stages.length} stages, {' '}
              {selectedWorkflow.stages.reduce((sum, stage) => sum + stage.commands.length, 0)} commands
            </p>
            <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
              {selectedWorkflow.stages.map((stage, index) => (
                <div key={index} className="text-xs flex justify-between">
                  <span>{index + 1}. {stage.name}</span>
                  <span className="text-muted-foreground">{stage.commands.length} cmd</span>
                </div>
              ))}
            </div>
            
            {selectedWorkflow.metadata?.description && (
              <p className="text-xs mt-2 text-muted-foreground border-t border-primary/10 pt-2">
                {selectedWorkflow.metadata.description}
              </p>
            )}
          </div>
        )}

        <div className="flex items-center gap-2">
          <Button
            className="flex-1"
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
          
          {extraActions}
        </div>
      </CardContent>
    </Card>
  );
};

export default WorkflowSelector;
