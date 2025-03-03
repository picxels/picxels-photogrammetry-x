import React from "react";
import { FolderOpen, Save, FileText, RefreshCw, Settings2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Session } from "@/types";
import { exportSession, saveSession } from "@/utils/fileSystem";

interface FileManagerProps {
  session: Session;
  onSessionNameChange: (name: string) => void;
  onSessionRefresh: () => void;
  isSaving?: boolean;
  isExporting?: boolean;
  rcNodeConnected?: boolean;
}

const FileManager: React.FC<FileManagerProps> = ({
  session,
  onSessionNameChange,
  onSessionRefresh,
  isSaving = false,
  isExporting = false,
  rcNodeConnected = false
}) => {
  const [exportSettings, setExportSettings] = React.useState({
    exportPng: true,
    exportTiff: true,
    exportMasks: true,
    sendToRealityCapture: false
  });

  const handleSaveSession = async () => {
    await saveSession(session);
  };

  const handleExportSession = async () => {
    await exportSession(session, exportSettings);
  };

  const getSessionStats = () => {
    const cameras = new Set(session.images.map(img => img.camera)).size;
    const uniqueAngles = new Set(session.images.map(img => img.angle)).size;
    
    return {
      imageCount: session.images.length,
      cameraCount: cameras,
      angleCount: uniqueAngles
    };
  };

  const stats = getSessionStats();

  React.useEffect(() => {
    if (rcNodeConnected) {
      setExportSettings(prev => ({
        ...prev,
        sendToRealityCapture: true
      }));
    }
  }, [rcNodeConnected]);

  return (
    <Card className="glass animate-scale-in">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FolderOpen className="h-5 w-5 text-primary" />
          <span>Session Manager</span>
        </CardTitle>
        <CardDescription>
          Manage and export your photogrammetry session
        </CardDescription>
      </CardHeader>
      
      <Tabs defaultValue="info">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="info">Session Info</TabsTrigger>
          <TabsTrigger value="export">Export Options</TabsTrigger>
        </TabsList>
        
        <TabsContent value="info" className="space-y-4">
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="session-name" className="text-sm font-medium">
                Session Name
              </label>
              <Input
                id="session-name"
                value={session.name}
                onChange={(e) => onSessionNameChange(e.target.value)}
                className="bg-background/50"
              />
            </div>

            <div className="pt-2">
              <h3 className="text-sm font-medium mb-2">Session Information</h3>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-background/30 p-2 rounded-md border border-border/40">
                  <p className="text-xs text-muted-foreground">Images</p>
                  <p className="text-xl font-semibold">{stats.imageCount}</p>
                </div>
                <div className="bg-background/30 p-2 rounded-md border border-border/40">
                  <p className="text-xs text-muted-foreground">Cameras</p>
                  <p className="text-xl font-semibold">{stats.cameraCount}</p>
                </div>
                <div className="bg-background/30 p-2 rounded-md border border-border/40">
                  <p className="text-xs text-muted-foreground">Angles</p>
                  <p className="text-xl font-semibold">{stats.angleCount}</p>
                </div>
              </div>
            </div>

            {session.subjectMatter && (
              <div className="bg-primary/5 p-3 rounded-md border border-primary/20">
                <p className="text-xs font-medium text-primary">Subject Analysis</p>
                <p className="text-sm">{session.subjectMatter}</p>
              </div>
            )}
            
            {session.imageQuality && (
              <div className="flex items-center">
                <Badge 
                  variant={session.imageQuality >= 80 ? "default" : "outline"} 
                  className="mr-2"
                >
                  Quality: {session.imageQuality}%
                </Badge>
                <p className="text-xs text-muted-foreground">
                  {session.imageQuality >= 80 ? "Good quality images" : "Quality needs improvement"}
                </p>
              </div>
            )}
          </CardContent>
        </TabsContent>
        
        <TabsContent value="export">
          <CardContent className="space-y-4">
            <h3 className="text-sm font-medium mb-2">Export Options</h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="export-png" className="text-sm">8-bit PNG (Construction)</Label>
                  <p className="text-xs text-muted-foreground">For model construction</p>
                </div>
                <Switch 
                  id="export-png"
                  checked={exportSettings.exportPng}
                  onCheckedChange={(checked) => setExportSettings({...exportSettings, exportPng: checked})}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="export-tiff" className="text-sm">16-bit TIFF (Texturing)</Label>
                  <p className="text-xs text-muted-foreground">For texture detail</p>
                </div>
                <Switch 
                  id="export-tiff"
                  checked={exportSettings.exportTiff}
                  onCheckedChange={(checked) => setExportSettings({...exportSettings, exportTiff: checked})}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="export-masks" className="text-sm">B&W Masks</Label>
                  <p className="text-xs text-muted-foreground">Background removal</p>
                </div>
                <Switch 
                  id="export-masks"
                  checked={exportSettings.exportMasks}
                  onCheckedChange={(checked) => setExportSettings({...exportSettings, exportMasks: checked})}
                />
              </div>
              
              <div className="pt-2 border-t border-border/40 mt-2">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="reality-capture" className="text-sm">Send to Reality Capture</Label>
                    <p className="text-xs text-muted-foreground">
                      {rcNodeConnected 
                        ? "RC Node connected and ready" 
                        : "Configure RC Node connection first"}
                    </p>
                  </div>
                  <Switch 
                    id="reality-capture"
                    checked={exportSettings.sendToRealityCapture}
                    onCheckedChange={(checked) => setExportSettings({...exportSettings, sendToRealityCapture: checked})}
                    disabled={!rcNodeConnected}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </TabsContent>
      </Tabs>
      
      <CardFooter className="flex justify-between">
        <Button 
          variant="outline"
          size="sm"
          onClick={onSessionRefresh}
          className="gap-1"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          New
        </Button>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSaveSession}
            disabled={isSaving}
            className="gap-1"
          >
            <Save className="h-3.5 w-3.5" />
            Save
          </Button>
          
          <Button
            size="sm"
            onClick={handleExportSession}
            disabled={isExporting || session.images.length === 0}
            className="gap-1 hover-scale"
          >
            <FileText className="h-3.5 w-3.5" />
            Export
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default FileManager;
