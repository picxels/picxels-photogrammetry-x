
import React, { useState } from "react";
import { Image as ImageIcon, Eye, Download, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CapturedImage, Session } from "@/types";
import { cn } from "@/lib/utils";

interface ImagePreviewProps {
  session: Session;
  onDeleteImage?: (imageId: string) => void;
}

const ImagePreview: React.FC<ImagePreviewProps> = ({ session, onDeleteImage }) => {
  const [selectedImage, setSelectedImage] = useState<CapturedImage | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [imageLoaded, setImageLoaded] = useState<Record<string, boolean>>({});

  const handleImageLoad = (imageId: string) => {
    setImageLoaded(prev => ({ ...prev, [imageId]: true }));
  };

  const getGroupedImages = () => {
    // Group by camera type
    const grouped = session.images.reduce<Record<string, CapturedImage[]>>((acc, image) => {
      const camera = image.camera;
      if (!acc[camera]) {
        acc[camera] = [];
      }
      acc[camera].push(image);
      return acc;
    }, {});
    
    return grouped;
  };

  const groupedImages = getGroupedImages();
  const cameraTabs = Object.keys(groupedImages);

  return (
    <>
      <Card className="glass animate-scale-in h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-primary" />
            <span>Captured Images</span>
          </CardTitle>
          <CardDescription>
            Images captured in this session: {session.images.length}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {session.images.length === 0 ? (
            <div className="py-8 flex flex-col items-center justify-center text-muted-foreground">
              <p>No images captured yet</p>
              <p className="text-sm mt-2">Use the camera controls to capture images</p>
            </div>
          ) : cameraTabs.length > 0 ? (
            <Tabs defaultValue={cameraTabs[0]} className="w-full">
              <TabsList className="w-full grid grid-cols-2 mb-4">
                {cameraTabs.map(camera => (
                  <TabsTrigger key={camera} value={camera} className="text-sm">
                    {camera.toUpperCase()}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              {cameraTabs.map(camera => (
                <TabsContent key={camera} value={camera} className="mt-0">
                  <ScrollArea className="h-[400px] pr-4">
                    <div className="grid grid-cols-2 gap-3">
                      {groupedImages[camera].map(image => (
                        <div 
                          key={image.id} 
                          className="relative group rounded-md overflow-hidden border border-border/40"
                        >
                          <div className={cn(
                            "aspect-video bg-muted flex items-center justify-center",
                            !imageLoaded[image.id] && "image-loading",
                            imageLoaded[image.id] && "image-loaded"
                          )}>
                            {image.previewUrl ? (
                              <img 
                                src={image.previewUrl} 
                                alt={`Capture ${image.id}`}
                                className="w-full h-full object-cover"
                                onLoad={() => handleImageLoad(image.id)}
                              />
                            ) : (
                              <ImageIcon className="h-8 w-8 text-muted-foreground/40" />
                            )}
                          </div>
                          
                          <div className="absolute inset-0 bg-foreground/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity duration-200">
                            <Button 
                              size="icon" 
                              variant="secondary"
                              onClick={() => {
                                setSelectedImage(image);
                                setIsDialogOpen(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {onDeleteImage && (
                              <Button 
                                size="icon" 
                                variant="destructive"
                                onClick={() => onDeleteImage(image.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                          
                          {image.angle !== undefined && (
                            <div className="absolute bottom-1 right-1 bg-background/80 text-xs px-1.5 py-0.5 rounded">
                              {image.angle.toFixed(0)}°
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>
              ))}
            </Tabs>
          ) : null}
        </CardContent>
      </Card>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        {selectedImage && (
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Image Preview</DialogTitle>
            </DialogHeader>
            <div className="mt-4">
              <div className="rounded-md overflow-hidden border border-border">
                <img 
                  src={selectedImage.previewUrl} 
                  alt={`Capture ${selectedImage.id}`}
                  className="w-full object-contain max-h-[60vh]"
                />
              </div>
              
              <div className="mt-4 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="font-medium">Camera:</p>
                    <p className="text-muted-foreground">{selectedImage.camera}</p>
                  </div>
                  <div>
                    <p className="font-medium">Angle:</p>
                    <p className="text-muted-foreground">
                      {selectedImage.angle !== undefined ? `${selectedImage.angle.toFixed(1)}°` : 'Not specified'}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">Time:</p>
                    <p className="text-muted-foreground">
                      {new Date(selectedImage.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">File:</p>
                    <p className="text-muted-foreground truncate">
                      {selectedImage.path.split('/').pop()}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 flex justify-end">
                <Button variant="outline" className="gap-2">
                  <Download className="h-4 w-4" />
                  Download
                </Button>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </>
  );
};

export default ImagePreview;
