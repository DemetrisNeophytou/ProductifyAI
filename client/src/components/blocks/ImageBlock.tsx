import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Image as ImageIcon } from "lucide-react";
import type { ImageContent } from "@shared/schema";

interface ImageBlockProps {
  content: ImageContent;
  onChange: (content: ImageContent) => void;
}

export function ImageBlock({ content, onChange }: ImageBlockProps) {
  const [showUrlInput, setShowUrlInput] = useState(!content.url);

  const handleUrlChange = (url: string) => {
    onChange({ ...content, url });
  };

  const handleAltChange = (alt: string) => {
    onChange({ ...content, alt });
  };

  const handleCaptionChange = (caption: string) => {
    onChange({ ...content, caption });
  };

  return (
    <div className="space-y-2">
      {showUrlInput || !content.url ? (
        <div className="space-y-2">
          <Input
            value={content.url}
            onChange={(e) => handleUrlChange(e.target.value)}
            placeholder="Image URL"
            data-testid="input-image-url"
          />
          <Input
            value={content.alt || ""}
            onChange={(e) => handleAltChange(e.target.value)}
            placeholder="Alt text (for accessibility)"
            data-testid="input-image-alt"
          />
          <Input
            value={content.caption || ""}
            onChange={(e) => handleCaptionChange(e.target.value)}
            placeholder="Caption (optional)"
            data-testid="input-image-caption"
          />
          {content.url && (
            <Button
              variant="outline"
              onClick={() => setShowUrlInput(false)}
              data-testid="button-preview-image"
            >
              Preview Image
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <div className="relative rounded-lg overflow-hidden border bg-muted/20">
            <img
              src={content.url}
              alt={content.alt || "Image"}
              className="w-full h-auto"
              onError={() => setShowUrlInput(true)}
            />
          </div>
          {content.caption && (
            <p className="text-sm text-muted-foreground text-center italic">
              {content.caption}
            </p>
          )}
          <Button
            variant="outline"
            onClick={() => setShowUrlInput(true)}
            className="w-full"
            data-testid="button-edit-image"
          >
            <ImageIcon className="h-4 w-4 mr-2" />
            Edit Image
          </Button>
        </div>
      )}
    </div>
  );
}
