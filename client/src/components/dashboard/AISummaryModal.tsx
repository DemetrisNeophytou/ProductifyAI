/**
 * AI Summary Modal
 * Generates intelligent summary of dashboard data
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sparkles, Loader2, Download, Copy } from 'lucide-react';
import { generateAISummary } from '@/utils/aiInsightsGenerator';
import { getMockStats } from '@/utils/mockStats';
import { useToast } from '@/hooks/use-toast';

export function AISummaryModal() {
  const [open, setOpen] = useState(false);
  const [summary, setSummary] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleGenerate = async () => {
    setIsGenerating(true);
    setSummary('');
    
    try {
      const stats = getMockStats();
      const generatedSummary = await generateAISummary(stats);
      setSummary(generatedSummary);
    } catch (error) {
      toast({
        title: 'Generation failed',
        description: 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(summary);
    toast({
      title: 'Copied to clipboard',
      description: 'Summary copied successfully.',
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button onClick={handleGenerate}>
          <Sparkles className="mr-2 h-4 w-4" />
          Generate AI Summary
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-primary to-secondary rounded-lg">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            AI Performance Summary
          </DialogTitle>
          <DialogDescription>
            Intelligent analysis of your activity and performance
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {isGenerating ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-primary/20 rounded-full" />
                <div className="absolute inset-0 w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
              <div className="text-center space-y-2">
                <p className="text-sm font-medium">Analyzing your data...</p>
                <p className="text-xs text-muted-foreground">
                  Processing {getMockStats().aiGenerations.value} AI generations and more
                </p>
              </div>
            </div>
          ) : summary ? (
            <>
              <ScrollArea className="h-[400px] border rounded-lg p-6 bg-muted/20">
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  {summary.split('\n').map((line, index) => {
                    if (line.startsWith('**')) {
                      const text = line.replace(/\*\*/g, '');
                      return (
                        <h3 key={index} className="text-lg font-semibold mt-4 mb-2">
                          {text}
                        </h3>
                      );
                    }
                    if (line.startsWith('-')) {
                      return (
                        <li key={index} className="ml-4 text-sm text-muted-foreground">
                          {line.substring(1).trim()}
                        </li>
                      );
                    }
                    if (line.trim()) {
                      return (
                        <p key={index} className="text-sm mb-2">
                          {line}
                        </p>
                      );
                    }
                    return null;
                  })}
                </div>
              </ScrollArea>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={handleCopy}
                  className="flex-1"
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Summary
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export PDF
                </Button>
                <Button
                  onClick={handleGenerate}
                  className="flex-1"
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Regenerate
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Sparkles className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">Click "Generate AI Summary" to create your report</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

