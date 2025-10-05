import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Image as ImageIcon } from "lucide-react";

const sizeOptions = [
  { value: "1024x1024", label: "Square (1024x1024)" },
  { value: "1792x1024", label: "Landscape (1792x1024)" },
  { value: "1024x1792", label: "Portrait (1024x1792)" },
];

interface AIImageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  pageId?: string;
  blockId?: string;
  onSuccess?: (imageUrl: string, assetId: string) => void;
}

export function AIImageModal({ open, onOpenChange, projectId, pageId, blockId, onSuccess }: AIImageModalProps) {
  const { toast } = useToast();
  const [prompt, setPrompt] = useState("");
  const [size, setSize] = useState("1024x1024");
  const [styleHint, setStyleHint] = useState("none");

  const generateMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/ai/image", {
        projectId,
        pageId,
        blockId,
        prompt,
        size,
        styleHint: styleHint === "none" ? undefined : styleHint,
      });
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/assets"] });
      toast({
        title: "Image generated successfully",
        description: "Your AI-generated image is ready to use.",
      });
      onOpenChange(false);
      onSuccess?.(data.url, data.assetId);
      setPrompt("");
      setStyleHint("none");
    },
    onError: (error: any) => {
      const message = error.message || "Failed to generate image. Please try again.";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    },
  });

  const handleGenerate = () => {
    if (!prompt.trim()) {
      toast({
        title: "Enter a prompt",
        description: "Please describe the image you want to generate.",
        variant: "destructive",
      });
      return;
    }
    generateMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]" data-testid="dialog-ai-image">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Generate Image with AI
          </DialogTitle>
          <DialogDescription>
            Use DALL-E to create custom images from text descriptions.
            Perfect for section illustrations, cover images, and visual content.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="prompt">Image Description *</Label>
            <Textarea
              id="prompt"
              placeholder="E.g., A modern minimalist workspace with a laptop, coffee cup, and plants on a wooden desk, natural lighting"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              data-testid="input-image-prompt"
            />
            <p className="text-xs text-muted-foreground">
              Be specific and descriptive. The AI will automatically ensure no text appears in the image.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="size">Image Size</Label>
              <Select value={size} onValueChange={setSize}>
                <SelectTrigger id="size" data-testid="select-image-size">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sizeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="style">Style Hint (Optional)</Label>
              <Select value={styleHint} onValueChange={setStyleHint}>
                <SelectTrigger id="style" data-testid="select-image-style">
                  <SelectValue placeholder="Select style..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="photographic">Photographic</SelectItem>
                  <SelectItem value="illustration">Illustration</SelectItem>
                  <SelectItem value="minimal">Minimal</SelectItem>
                  <SelectItem value="artistic">Artistic</SelectItem>
                  <SelectItem value="modern">Modern</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="bg-muted/50 p-3 rounded-lg text-sm space-y-2">
            <p className="font-medium">Image Generation Details:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground text-xs">
              <li>Powered by OpenAI DALL-E 3 for high-quality results</li>
              <li>Images are 100% free for commercial use</li>
              <li>No text will appear in generated images (brand-safe)</li>
              <li>Saved automatically to your project assets</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={generateMutation.isPending}
            data-testid="button-cancel-generate"
          >
            Cancel
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={generateMutation.isPending}
            data-testid="button-generate-image"
          >
            {generateMutation.isPending ? (
              <>
                <Sparkles className="h-4 w-4 mr-2 animate-pulse" />
                Generating...
              </>
            ) : (
              <>
                <ImageIcon className="h-4 w-4 mr-2" />
                Generate Image
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
