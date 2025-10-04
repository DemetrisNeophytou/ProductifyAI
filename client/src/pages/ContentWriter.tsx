import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { FileText, Loader2, Download, Copy, Crown, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

const contentWriterSchema = z.object({
  chapterTitle: z.string().min(1, "Please enter a chapter title"),
  mainPoints: z.string().min(1, "Please describe the main points"),
  targetLength: z.string().min(1, "Please select target length"),
  tone: z.string().min(1, "Please select tone"),
  format: z.string().min(1, "Please select format"),
});

type ContentWriterForm = z.infer<typeof contentWriterSchema>;

interface ContentResult {
  content: string;
  wordCount: number;
  exportFormats: string[];
  additionalFormats?: {
    emailSequence?: string;
    socialPosts?: string[];
    salesCopy?: string;
  };
}

export default function ContentWriter() {
  const { toast } = useToast();
  const [results, setResults] = useState<ContentResult | null>(null);
  const [copied, setCopied] = useState(false);

  const { data: subscriptionStatus } = useQuery<{
    tier: 'free' | 'plus' | 'pro' | null;
  }>({
    queryKey: ["/api/subscription/status"],
  });

  const isPro = subscriptionStatus?.tier === 'pro';

  const form = useForm<ContentWriterForm>({
    resolver: zodResolver(contentWriterSchema),
    defaultValues: {
      chapterTitle: "",
      mainPoints: "",
      targetLength: "",
      tone: "",
      format: "",
    },
  });

  const generateMutation = useMutation({
    mutationFn: async (data: ContentWriterForm) => {
      const response = await apiRequest<ContentResult>('/api/builders/content', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return response;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/builders/content'] });
      setResults(data);
      toast({
        title: "Content Generated!",
        description: `Created ${data.wordCount} words of professional content.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Generation Failed",
        description: error.message || "Unable to generate content. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ContentWriterForm) => {
    generateMutation.mutate(data);
  };

  const copyToClipboard = () => {
    if (results?.content) {
      navigator.clipboard.writeText(results.content);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Content copied to clipboard.",
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="container max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <FileText className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold" data-testid="heading-content-writer">
            AI Content Writer
          </h1>
          {isPro && (
            <Badge variant="default" data-testid="badge-pro-active">
              <Crown className="h-3 w-3 mr-1" />
              Pro
            </Badge>
          )}
        </div>
        <p className="text-lg text-muted-foreground" data-testid="text-description">
          Generate professional content for your digital products with AI
        </p>
        {isPro && (
          <p className="text-sm text-primary mt-2" data-testid="text-pro-features">
            ✨ Pro features: Multi-format export, email sequences, social posts, and sales copy
          </p>
        )}
      </div>

      <Card className="mb-8" data-testid="card-input-form">
        <CardHeader>
          <CardTitle data-testid="heading-form-title">Content Details</CardTitle>
          <CardDescription data-testid="text-form-description">
            Describe what you want to write and AI will create professional content
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="chapterTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel data-testid="label-title">Chapter/Section Title</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., How to Find Your First Freelance Client"
                        {...field}
                        data-testid="input-title"
                      />
                    </FormControl>
                    <FormMessage data-testid="error-title" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="mainPoints"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel data-testid="label-points">Main Points to Cover</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g., Where to find clients, how to reach out, what to say in your pitch, common mistakes to avoid"
                        className="resize-none"
                        rows={4}
                        {...field}
                        data-testid="input-points"
                      />
                    </FormControl>
                    <FormMessage data-testid="error-points" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="targetLength"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel data-testid="label-length">Target Length</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-length">
                          <SelectValue placeholder="Select length" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="500" data-testid="option-length-500">Short (500 words)</SelectItem>
                        <SelectItem value="1000" data-testid="option-length-1000">Medium (1000 words)</SelectItem>
                        <SelectItem value="2000" data-testid="option-length-2000">Long (2000 words)</SelectItem>
                        <SelectItem value="3000" data-testid="option-length-3000">Very Long (3000+ words)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage data-testid="error-length" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel data-testid="label-tone">Tone & Style</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-tone">
                          <SelectValue placeholder="Select tone" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Professional" data-testid="option-tone-professional">Professional & Authoritative</SelectItem>
                        <SelectItem value="Conversational" data-testid="option-tone-conversational">Conversational & Friendly</SelectItem>
                        <SelectItem value="Educational" data-testid="option-tone-educational">Educational & Instructive</SelectItem>
                        <SelectItem value="Motivational" data-testid="option-tone-motivational">Motivational & Inspiring</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage data-testid="error-tone" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="format"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel data-testid="label-format">Content Format</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-format">
                          <SelectValue placeholder="Select format" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Article" data-testid="option-format-article">Article/Chapter</SelectItem>
                        <SelectItem value="Step-by-Step Guide" data-testid="option-format-guide">Step-by-Step Guide</SelectItem>
                        <SelectItem value="Case Study" data-testid="option-format-case">Case Study</SelectItem>
                        <SelectItem value="Q&A" data-testid="option-format-qa">Q&A Format</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage data-testid="error-format" />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={generateMutation.isPending}
                data-testid="button-generate-content"
              >
                {generateMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" data-testid="loader-generating" />
                    Writing Content...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    {isPro ? 'Generate Pro Content' : 'Generate Content'}
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {results && (
        <div className="space-y-6">
          <Card data-testid="card-generated-content">
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <CardTitle data-testid="heading-content">Generated Content</CardTitle>
                  <CardDescription data-testid="text-word-count">
                    {results.wordCount} words • {results.exportFormats.join(', ')} available
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={copyToClipboard}
                    data-testid="button-copy"
                  >
                    {copied ? (
                      <><Check className="mr-2 h-4 w-4" /> Copied!</>
                    ) : (
                      <><Copy className="mr-2 h-4 w-4" /> Copy</>
                    )}
                  </Button>
                  <Button variant="outline" data-testid="button-download">
                    <Download className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div 
                className="prose dark:prose-invert max-w-none"
                data-testid="content-display"
              >
                {results.content.split('\n').map((paragraph, index) => (
                  <p key={index} className="mb-4">{paragraph}</p>
                ))}
              </div>
            </CardContent>
          </Card>

          {isPro && results.additionalFormats && (
            <>
              {results.additionalFormats.emailSequence && (
                <Card className="border-primary" data-testid="card-email">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Crown className="h-5 w-5 text-primary" />
                      Email Sequence (Pro)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose dark:prose-invert max-w-none text-sm" data-testid="email-content">
                      {results.additionalFormats.emailSequence}
                    </div>
                  </CardContent>
                </Card>
              )}

              {results.additionalFormats.socialPosts && (
                <Card className="border-primary" data-testid="card-social">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Crown className="h-5 w-5 text-primary" />
                      Social Media Posts (Pro)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4" data-testid="social-posts">
                      {results.additionalFormats.socialPosts.map((post, index) => (
                        <div key={index} className="p-4 bg-muted rounded-lg" data-testid={`social-post-${index}`}>
                          <p className="text-sm">{post}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
