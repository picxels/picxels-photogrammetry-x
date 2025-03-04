
import { useState } from "react";
import { ScanSearch, Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CapturedImage, AnalysisResult } from "@/types";
import { analyzeImageSubject, generateSessionName } from "@/utils/imageAnalysis";

interface SubjectAnalysisProps {
  image: CapturedImage | null;
  onAnalysisComplete: (result: AnalysisResult, suggestedName: string) => void;
  disabled?: boolean;
}

const SubjectAnalysis: React.FC<SubjectAnalysisProps> = ({
  image,
  onAnalysisComplete,
  disabled = false
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  
  const handleAnalyze = async () => {
    if (!image || isAnalyzing) return;
    
    try {
      setIsAnalyzing(true);
      
      // Perform the analysis
      const analysisResult = await analyzeImageSubject(image);
      setResult(analysisResult);
      
      // Generate a suggested name
      const suggestedName = generateSessionName(analysisResult);
      
      // Notify parent component
      onAnalysisComplete(analysisResult, suggestedName);
    } catch (error) {
      console.error("Analysis failed:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  return (
    <Card className="glass animate-scale-in">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ScanSearch className="h-5 w-5 text-primary" />
          <span>Subject Analysis</span>
        </CardTitle>
        <CardDescription>
          Analyze the first image to identify the subject
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!image ? (
          <div className="py-6 flex flex-col items-center justify-center text-muted-foreground text-center">
            <p>No images available for analysis</p>
            <p className="text-sm mt-1">Capture at least one image first</p>
          </div>
        ) : result ? (
          <div className="space-y-3">
            <div className="p-3 rounded-md bg-primary/5 border border-primary/20">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Detected Subject</h3>
                <Badge variant="outline" className="text-xs">
                  {Math.round(result.confidence * 100)}% confidence
                </Badge>
              </div>
              <p className="text-lg font-semibold mt-1">{result.subject}</p>
            </div>
            
            {result.tags && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Related Tags</h4>
                <div className="flex flex-wrap gap-1">
                  {result.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            <div className="mt-4 text-center">
              <p className="text-sm text-muted-foreground">
                Suggested session name has been applied
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <div className="h-16 w-16 rounded-full mx-auto bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <p className="mt-4 text-sm">
              Analyze the captured image to detect the subject matter and automatically name this session.
            </p>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button
          onClick={handleAnalyze}
          disabled={disabled || !image || isAnalyzing || !!result}
          className="hover-scale"
        >
          {isAnalyzing ? (
            <>
              <div className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin mr-2" />
              Analyzing...
            </>
          ) : (
            <>Analyze Image</>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default SubjectAnalysis;
