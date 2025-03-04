
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RCPreviewData } from '@/types/workflow';
import { AlertCircle, Package, Image } from 'lucide-react';

interface RCPreviewProps {
  previewData?: RCPreviewData;
  currentStage: string;
  isLoading?: boolean;
}

const RCPreview: React.FC<RCPreviewProps> = ({ 
  previewData, 
  currentStage,
  isLoading = false 
}) => {
  const [currentViewIndex, setCurrentViewIndex] = useState(0);

  useEffect(() => {
    if (previewData?.renderViews && previewData.renderViews.length > 0) {
      const interval = setInterval(() => {
        setCurrentViewIndex(prev => 
          (prev + 1) % previewData.renderViews!.length
        );
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [previewData?.renderViews]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            <span>RC Visualization</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-60">
          <div className="flex flex-col items-center space-y-2">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            <p className="text-sm text-muted-foreground">Loading preview...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!previewData || (!previewData.previewUrl && !previewData.renderViews?.length)) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            <span>RC Visualization</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-60 bg-muted/30">
          <div className="flex flex-col items-center space-y-2 max-w-sm text-center p-4">
            <AlertCircle className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Preview will appear here during model processing.
              Currently on stage: <span className="font-medium">{currentStage}</span>
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasPreview = previewData.previewUrl;
  const hasRenderViews = previewData.renderViews && previewData.renderViews.length > 0;
  const currentView = hasRenderViews ? previewData.renderViews[currentViewIndex] : undefined;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Package className="h-5 w-5 text-primary" />
          <span>RC Visualization</span>
          {previewData.modelStats && (
            <Badge variant="outline" className="ml-auto text-xs font-normal">
              {previewData.modelStats.triangles.toLocaleString()} triangles
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 relative">
        {hasPreview ? (
          <iframe 
            src={previewData.previewUrl} 
            className="w-full h-60 border-0"
            title="Reality Capture Preview"
          />
        ) : hasRenderViews && currentView ? (
          <div className="relative w-full h-60 bg-black">
            <img 
              src={currentView} 
              alt={`View ${currentViewIndex + 1}`}
              className="absolute top-0 left-0 w-full h-full object-contain"
            />
            <div className="absolute bottom-2 right-2 bg-black/70 rounded px-2 py-1 text-xs text-white">
              View {currentViewIndex + 1} of {previewData.renderViews.length}
            </div>
          </div>
        ) : (
          <div className="w-full h-60 bg-muted/30 flex items-center justify-center">
            <Image className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
        
        {previewData.modelStats && (
          <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white p-2 flex justify-between text-xs">
            <span>Vertices: {previewData.modelStats.vertices.toLocaleString()}</span>
            <span>Texture: {previewData.modelStats.textureSize}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RCPreview;
