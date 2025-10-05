import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Palette } from "lucide-react";

const moodOptions = [
  { value: "minimal", label: "Minimal", description: "Clean, simple, lots of white space" },
  { value: "bold", label: "Bold", description: "Strong colors, high contrast, energetic" },
  { value: "elegant", label: "Elegant", description: "Sophisticated, refined, timeless" },
  { value: "playful", label: "Playful", description: "Fun, vibrant, friendly" },
  { value: "editorial", label: "Editorial", description: "Magazine-style, structured, professional" },
];

interface AIRestyleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  onSuccess?: () => void;
}

export function AIRestyleModal({ open, onOpenChange, projectId, onSuccess }: AIRestyleModalProps) {
  const { toast } = useToast();
  const [selectedMood, setSelectedMood] = useState<string>("minimal");
  const [prompt, setPrompt] = useState("");

  const restyleMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/ai/restyle", {
        projectId,
        mood: selectedMood,
        prompt: prompt || undefined,
      });
      return await response.json();
    },
    onSuccess: (theme) => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId] });
      queryClient.invalidateQueries({ queryKey: ["/api/brand-kit"] });
      toast({
        title: "Theme generated successfully",
        description: "Your project has been re-styled with a new AI-generated theme.",
      });
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error: any) => {
      const message = error.message || "Failed to generate theme. Please try again.";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    },
  });

  const handleRestyle = () => {
    if (!selectedMood) {
      toast({
        title: "Select a mood",
        description: "Please select a mood preset before generating.",
        variant: "destructive",
      });
      return;
    }
    restyleMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]" data-testid="dialog-ai-restyle">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            AI Re-Style
          </DialogTitle>
          <DialogDescription>
            Transform your project's visual style with AI-powered theme generation.
            Choose a mood and let AI create a cohesive design system.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-3">
            <Label>Select Mood Preset</Label>
            <div className="grid grid-cols-2 gap-3">
              {moodOptions.map((mood) => (
                <button
                  key={mood.value}
                  onClick={() => setSelectedMood(mood.value)}
                  className={`
                    flex flex-col items-start p-4 rounded-lg border-2 transition-all hover-elevate
                    ${selectedMood === mood.value 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border bg-card'
                    }
                  `}
                  data-testid={`button-mood-${mood.value}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Palette className="h-4 w-4" />
                    <span className="font-medium">{mood.label}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">{mood.description}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="prompt">Additional Instructions (Optional)</Label>
            <Textarea
              id="prompt"
              placeholder="E.g., Use warm earth tones, prefer serif fonts, modern and professional..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              data-testid="input-restyle-prompt"
            />
            <p className="text-xs text-muted-foreground">
              Add specific preferences to customize the AI-generated theme.
            </p>
          </div>

          <div className="bg-muted/50 p-3 rounded-lg text-sm">
            <p className="font-medium mb-1">What will be generated:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>4-color palette (primary, secondary, accent, neutral)</li>
              <li>Font pairings (heading, body, accent)</li>
              <li>Spacing scale and layout guidelines</li>
              <li>Image style recommendations</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={restyleMutation.isPending}
            data-testid="button-cancel-restyle"
          >
            Cancel
          </Button>
          <Button
            onClick={handleRestyle}
            disabled={restyleMutation.isPending}
            data-testid="button-generate-theme"
          >
            {restyleMutation.isPending ? (
              <>
                <Sparkles className="h-4 w-4 mr-2 animate-pulse" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Theme
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
