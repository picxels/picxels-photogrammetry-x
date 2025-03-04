
import { useState, useEffect } from 'react';
import { RCPreviewData } from '@/types/workflow';
import { WorkflowProgress } from '@/types/workflow';
import { RCNodeConfig } from '@/types';

interface UseRCPreviewDataProps {
  isExecuting: boolean;
  progress: WorkflowProgress;
  rcNodeConfig: RCNodeConfig;
}

export const useRCPreviewData = ({ 
  isExecuting, 
  progress, 
  rcNodeConfig 
}: UseRCPreviewDataProps) => {
  const [previewData, setPreviewData] = useState<RCPreviewData | undefined>();

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

  return { previewData };
};
