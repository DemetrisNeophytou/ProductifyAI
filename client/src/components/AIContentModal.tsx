import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Loader2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";

interface AIContentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  blockId: string;
  projectId: string;
  onSuccess?: (newText: string) => void;
}

export function AIContentModal({
  open,
  onOpenChange,
  blockId,
  projectId,
  onSuccess,
}: AIContentModalProps) {
  const { toast } = useToast();
  const [operation, setOperation] = useState<"polish" | "shorten" | "expand" | "translate">("polish");
  const [tone, setTone] = useState<string>("professional");
  const [targetLang, setTargetLang] = useState<string>("es");

  const enhanceMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/ai/content", {
        projectId,
        blockId,
        op: operation,
        tone: operation !== "translate" ? tone : undefined,
        targetLang: operation === "translate" ? targetLang : undefined,
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Failed to enhance content");
      }
      
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "Content enhanced!",
        description: `Your content has been ${operation}ed successfully.`,
      });

      if (onSuccess && data.newText) {
        onSuccess(data.newText);
      }

      // Invalidate section queries to refresh the content
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "sections"] });
      
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Enhancement failed",
        description: error.message || "Failed to enhance content. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleEnhance = () => {
    enhanceMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]" data-testid="dialog-ai-content">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            AI Content Enhancement
          </DialogTitle>
          <DialogDescription>
            Use AI to improve, polish, shorten, expand, or translate your content.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-3">
            <Label>Enhancement Type</Label>
            <RadioGroup value={operation} onValueChange={(v) => setOperation(v as any)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="polish" id="polish" data-testid="radio-polish" />
                <Label htmlFor="polish" className="font-normal cursor-pointer">
                  Polish - Refine and perfect the content
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="shorten" id="shorten" data-testid="radio-shorten" />
                <Label htmlFor="shorten" className="font-normal cursor-pointer">
                  Shorten - Make it more concise
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="expand" id="expand" data-testid="radio-expand" />
                <Label htmlFor="expand" className="font-normal cursor-pointer">
                  Expand - Add more detail and examples
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="translate" id="translate" data-testid="radio-translate" />
                <Label htmlFor="translate" className="font-normal cursor-pointer">
                  Translate - Convert to another language
                </Label>
              </div>
            </RadioGroup>
          </div>

          {operation !== "translate" && (
            <div className="space-y-2">
              <Label htmlFor="tone">Tone</Label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger id="tone" data-testid="select-tone">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="casual">Casual</SelectItem>
                  <SelectItem value="inspirational">Inspirational</SelectItem>
                  <SelectItem value="educational">Educational</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {operation === "translate" && (
            <div className="space-y-2">
              <Label htmlFor="targetLang">Target Language</Label>
              <Select value={targetLang} onValueChange={setTargetLang}>
                <SelectTrigger id="targetLang" data-testid="select-language">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="es">Spanish</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                  <SelectItem value="de">German</SelectItem>
                  <SelectItem value="it">Italian</SelectItem>
                  <SelectItem value="pt">Portuguese</SelectItem>
                  <SelectItem value="zh">Chinese</SelectItem>
                  <SelectItem value="ja">Japanese</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={enhanceMutation.isPending}
            data-testid="button-cancel-enhance"
          >
            Cancel
          </Button>
          <Button
            onClick={handleEnhance}
            disabled={enhanceMutation.isPending}
            data-testid="button-enhance"
          >
            {enhanceMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Enhance Content
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
