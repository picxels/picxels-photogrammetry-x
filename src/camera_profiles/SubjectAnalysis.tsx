
import { useState } from "react";
import { ScanSearch, Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CapturedImage, AnalysisResult, Session } from "@/types";
import { analyzeImageSubject, analyzeAndRenameSession } from "@/utils/imageAnalysis";

interface SubjectAnalysisProps {
  image: CapturedImage | null;
  session: Session;
  onSessionUpdated: (session: Session) => void;
  disabled?: boolean;
}

const SubjectAnalysis: React.FC<SubjectAnalysisProps> = ({
  image,
  session,
  onSessionUpdated,
  disabled = false
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  
  const handleAnalyze = async () => {
    if (!image || isAnalyzing) return;
    
    try {
      setIsAnalyzing(true);
      
      // Perform the analysis and update the session
      const updatedSession = await analyzeAndRenameSession(image, session);
      
      // If the session was updated with a subject, set the result
      if (updatedSession.subjectMatter) {
        setResult({
          subjectMatter: updatedSession.subjectMatter,
          description: updatedSession.description || "",
          tags: updatedSession.tags || [],
          confidence: 0.95,
          subject: updatedSession.subjectMatter // Add subject for compatibility
        });
      }
      
      // Notify parent component
      onSessionUpdated(updatedSession);
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
          Analyze the first image to identify the subject and set up session metadata
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!image ? (
          <div className="py-6 flex flex-col items-center justify-center text-muted-foreground text-center">
            <p>No images available for analysis</p>
            <p className="text-sm mt-1">Capture at least one image first</p>
          </div>
        ) : result || session.subjectMatter ? (
          <div className="space-y-3">
            <div className="p-3 rounded-md bg-primary/5 border border-primary/20">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Detected Subject</h3>
                <Badge variant="outline" className="text-xs">
                  {Math.round((result?.confidence || 0.9) * 100)}% confidence
                </Badge>
              </div>
              <p className="text-lg font-semibold mt-1">{result?.subjectMatter || session.subjectMatter}</p>
            </div>
            
            {(result?.description || session.description) && (
              <div className="space-y-1 text-sm">
                <h4 className="font-medium">Description</h4>
                <p className="text-muted-foreground">
                  {result?.description || session.description}
                </p>
              </div>
            )}
            
            {(result?.tags || session.tags) && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Related Tags</h4>
                <div className="flex flex-wrap gap-1">
                  {(result?.tags || session.tags || []).map((tag, index) => (
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
          disabled={disabled || !image || isAnalyzing || !!result || !!session.subjectMatter}
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
