
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Check, X, Upload, PencilIcon, TagIcon } from 'lucide-react';
import { SketchfabMetadata } from '@/types/workflow';

interface SketchfabUploaderProps {
  open: boolean;
  onClose: () => void;
  onUpload: (metadata: SketchfabMetadata) => void;
  initialMetadata: Partial<SketchfabMetadata>;
  modelName: string;
  previewImageUrl?: string;
}

const SketchfabUploader: React.FC<SketchfabUploaderProps> = ({
  open,
  onClose,
  onUpload,
  initialMetadata,
  modelName,
  previewImageUrl
}) => {
  const [metadata, setMetadata] = useState<SketchfabMetadata>({
    title: initialMetadata.title || modelName,
    description: initialMetadata.description || `3D model of ${modelName}`,
    tags: initialMetadata.tags || ['photogrammetry', '3d-scan'],
    isPrivate: initialMetadata.isPrivate !== undefined ? initialMetadata.isPrivate : true,
    isPublished: initialMetadata.isPublished !== undefined ? initialMetadata.isPublished : false,
    password: initialMetadata.password || ''
  });

  const [newTag, setNewTag] = useState('');

  const handleAddTag = () => {
    if (newTag.trim() && !metadata.tags.includes(newTag.trim())) {
      setMetadata({
        ...metadata,
        tags: [...metadata.tags, newTag.trim()]
      });
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setMetadata({
      ...metadata,
      tags: metadata.tags.filter(tag => tag !== tagToRemove)
    });
  };

  const handleUpload = () => {
    onUpload(metadata);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Upload to Sketchfab</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={metadata.title}
                onChange={(e) => setMetadata({ ...metadata, title: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                rows={4}
                value={metadata.description}
                onChange={(e) => setMetadata({ ...metadata, description: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label className="block mb-1">Tags</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  placeholder="Add tag..."
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                />
                <Button type="button" size="sm" onClick={handleAddTag}>
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-1">
                {metadata.tags.map((tag) => (
                  <Badge key={tag} className="flex items-center gap-1 pr-1">
                    <span>{tag}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 rounded-full"
                      onClick={() => handleRemoveTag(tag)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {previewImageUrl ? (
              <div className="rounded-md overflow-hidden border border-border">
                <img
                  src={previewImageUrl}
                  alt="Model preview"
                  className="w-full h-40 object-cover"
                />
              </div>
            ) : (
              <div className="rounded-md overflow-hidden border border-border bg-muted/30 flex items-center justify-center h-40">
                <PencilIcon className="h-8 w-8 text-muted-foreground" />
              </div>
            )}

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="is-private" className="cursor-pointer">Private model</Label>
                <Switch
                  id="is-private"
                  checked={metadata.isPrivate}
                  onCheckedChange={(checked) => setMetadata({ ...metadata, isPrivate: checked })}
                />
              </div>

              {metadata.isPrivate && (
                <div className="space-y-2">
                  <Label htmlFor="password">Password (optional)</Label>
                  <Input
                    id="password"
                    type="password"
                    value={metadata.password || ''}
                    onChange={(e) => setMetadata({ ...metadata, password: e.target.value })}
                    placeholder="Set password for access"
                  />
                </div>
              )}

              <div className="flex items-center justify-between">
                <Label htmlFor="is-published" className="cursor-pointer">Publish immediately</Label>
                <Switch
                  id="is-published"
                  checked={metadata.isPublished}
                  onCheckedChange={(checked) => setMetadata({ ...metadata, isPublished: checked })}
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleUpload} className="gap-2">
            <Upload className="h-4 w-4" />
            Upload to Sketchfab
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SketchfabUploader;
