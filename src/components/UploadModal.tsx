import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Camera, Film, Upload, X, Music, Hash } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState("");
  const { toast } = useToast();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreview(url);
    }
  };

  const handleUpload = () => {
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select a video to upload",
        variant: "destructive",
      });
      return;
    }

    // Simulate upload
    toast({
      title: "Upload started",
      description: "Your video is being uploaded...",
    });

    setTimeout(() => {
      toast({
        title: "Upload successful!",
        description: "Your video has been posted",
      });
      handleClose();
    }, 2000);
  };

  const handleClose = () => {
    setSelectedFile(null);
    setPreview("");
    setCaption("");
    setHashtags("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px] bg-background border border-border">
        <DialogHeader>
          <DialogTitle className="gradient-text text-xl">
            Create New Post
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!selectedFile ? (
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Film className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <p className="font-semibold mb-1">Upload video</p>
                  <p className="text-sm text-muted-foreground">
                    MP4, MOV or WebM (Max 100MB)
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="gradient" asChild>
                    <label htmlFor="video-upload" className="cursor-pointer">
                      <Upload className="h-4 w-4 mr-2" />
                      Select File
                      <input
                        id="video-upload"
                        type="file"
                        accept="video/*"
                        className="hidden"
                        onChange={handleFileSelect}
                      />
                    </label>
                  </Button>
                  <Button variant="outline">
                    <Camera className="h-4 w-4 mr-2" />
                    Record
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="relative rounded-lg overflow-hidden bg-black">
              <video
                src={preview}
                className="w-full max-h-[300px] object-contain"
                controls
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 bg-background/80 hover:bg-background"
                onClick={() => {
                  setSelectedFile(null);
                  setPreview("");
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <Label htmlFor="caption">Caption</Label>
              <Textarea
                id="caption"
                placeholder="Write a caption..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="mt-1"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="hashtags">Hashtags</Label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="hashtags"
                  placeholder="dance, viral, trending"
                  value={hashtags}
                  onChange={(e) => setHashtags(e.target.value)}
                  className="pl-9 mt-1"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 rounded-lg bg-secondary/50">
              <Music className="h-4 w-4 text-primary" />
              <span className="text-sm">Add music to your video</span>
              <Button size="sm" variant="ghost" className="ml-auto">
                Select
              </Button>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleClose}
            >
              Cancel
            </Button>
            <Button
              variant="gradient"
              className="flex-1"
              onClick={handleUpload}
              disabled={!selectedFile}
            >
              Post Video
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};