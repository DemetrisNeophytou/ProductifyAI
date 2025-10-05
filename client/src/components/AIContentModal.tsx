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
import { useAgentRunner } from "@/hooks/useAgentRunner";
import { useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";

interface AIContentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  blockId: string;
  projectId?: string;
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
  const [operation, setOperation] = useState<"polish" | "improve" | "shorten" | "expand" | "translate">("improve");
  const [tone, setTone] = useState<string>("professional");
  const [targetLang, setTargetLang] = useState<string>("es");

  const { runAgent, jobStatus, isRunning, clearActiveJob } = useAgentRunner();

  useEffect(() => {
    if (jobStatus?.status === "succeeded" && jobStatus.output) {
      const newText = jobStatus.output.newText;
      
      toast({
        title: "Content enhanced successfully",
        description: `Your content has been ${operation}ed.`,
      });

      if (onSuccess && newText) {
        onSuccess(newText);
      }
      
      clearActiveJob();
      onOpenChange(false);
    }

    if (jobStatus?.status === "failed") {
      toast({
        title: "Enhancement failed",
        description: jobStatus.error?.message || "Failed to enhance content",
        variant: "destructive",
      });
      clearActiveJob();
    }
  }, [jobStatus, operation, toast, onSuccess, clearActiveJob, onOpenChange]);

  const handleEnhance = async () => {
    try {
      await runAgent({
        agentName: "content_writer",
        input: {
          blockId,
          operation,
          tone: operation === "translate" ? undefined : tone,
          targetLang: operation === "translate" ? targetLang : undefined,
        },
        projectId,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to start enhancement",
        variant: "destructive",
      });
    }
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
                <RadioGroupItem value="improve" id="improve" data-testid="radio-improve" />
                <Label htmlFor="improve" className="font-normal cursor-pointer">
                  Improve - Enhance clarity and quality
                </Label>
              </div>
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

          {jobStatus?.steps && jobStatus.steps.length > 0 && (
            <div className="bg-muted/50 p-3 rounded-lg text-sm space-y-1">
              <p className="font-medium mb-2">Progress:</p>
              {jobStatus.steps.map((step, index) => (
                <div key={index} className="flex items-start gap-2 text-muted-foreground">
                  <span className="text-xs">{new Date(step.at).toLocaleTimeString()}</span>
                  <span>{step.message}</span>
                </div>
              ))}
            </div>
          )}

          {jobStatus?.estimatedCredits && (
            <div className="bg-primary/10 p-3 rounded-lg text-sm">
              <p className="text-muted-foreground">
                Estimated cost: <span className="font-medium text-foreground">{jobStatus.estimatedCredits} credits</span>
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isRunning}
            data-testid="button-cancel-enhance"
          >
            Cancel
          </Button>
          <Button
            onClick={handleEnhance}
            disabled={isRunning}
            data-testid="button-enhance"
          >
            {isRunning ? (
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
