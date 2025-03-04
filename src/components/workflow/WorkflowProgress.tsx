
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { WorkflowProgress as WorkflowProgressType } from '@/types/workflow';
import { CheckCircle, AlertCircle, Loader2, Image, Clock } from 'lucide-react';

interface WorkflowProgressProps {
  progress: WorkflowProgressType;
}

const WorkflowProgress: React.FC<WorkflowProgressProps> = ({ progress }) => {
  const getStatusIcon = () => {
    switch (progress.status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'running':
        return <Loader2 className="h-5 w-5 text-primary animate-spin" />;
      default:
        return <Clock className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = () => {
    switch (progress.status) {
      case 'completed':
        return <Badge className="bg-green-500">Completed</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      case 'running':
        return <Badge className="bg-blue-500">Running</Badge>;
      case 'idle':
        return <Badge variant="outline">Ready</Badge>;
      default:
        return null;
    }
  };

  if (progress.status === 'idle') {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <p>Select a workflow and click Execute to start processing</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex flex-col">
            <span className="text-sm font-medium">Current Stage</span>
            <span className="text-lg">{progress.currentStage}</span>
            {progress.currentCommand && (
              <span className="text-sm text-muted-foreground">
                Command: {progress.currentCommand}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            {getStatusBadge()}
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span>{progress.percentComplete}%</span>
          </div>
          <Progress value={progress.percentComplete} className="h-2" />
        </div>

        {progress.message && (
          <div className="text-sm p-2 bg-primary/5 rounded-md border border-primary/10">
            {progress.message}
          </div>
        )}

        {progress.previewUrl && (
          <div className="flex items-center gap-2 text-sm text-primary">
            <Image className="h-4 w-4" />
            <span>Preview available in visualization panel</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WorkflowProgress;
