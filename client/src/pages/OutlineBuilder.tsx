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
import { ListChecks, Loader2, BookOpen, Target, Clock, Sparkles, Crown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

const outlineBuilderSchema = z.object({
  productType: z.string().min(1, "Please select a product type"),
  topic: z.string().min(1, "Please describe your topic"),
  targetAudience: z.string().min(1, "Please describe your target audience"),
  mainGoal: z.string().min(1, "Please describe the main goal"),
  experienceLevel: z.string().min(1, "Please select experience level"),
});

type OutlineBuilderForm = z.infer<typeof outlineBuilderSchema>;

interface Chapter {
  number: number;
  title: string;
  description: string;
  keyPoints: string[];
  estimatedLength: string;
  monetizationTip?: string;
}

interface OutlineResult {
  productTitle: string;
  subtitle: string;
  chapters: Chapter[];
  totalEstimatedPages: string;
  recommendedPrice: string;
  nextSteps: string[];
  proTips?: string[];
}

export default function OutlineBuilder() {
  const { toast } = useToast();
  const [results, setResults] = useState<OutlineResult | null>(null);

  const { data: subscriptionStatus } = useQuery<{
    tier: 'free' | 'plus' | 'pro' | null;
    status: 'active' | 'canceled' | 'expired' | null;
  }>({
    queryKey: ["/api/subscription/status"],
  });

  const isPro = subscriptionStatus?.tier === 'pro';

  const form = useForm<OutlineBuilderForm>({
    resolver: zodResolver(outlineBuilderSchema),
    defaultValues: {
      productType: "",
      topic: "",
      targetAudience: "",
      mainGoal: "",
      experienceLevel: "",
    },
  });

  const generateMutation = useMutation({
    mutationFn: async (data: OutlineBuilderForm) => {
      const response = await apiRequest<OutlineResult>('/api/builders/outline', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return response;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/builders/outline'] });
      setResults(data);
      toast({
        title: "Outline Generated!",
        description: `Created ${data.chapters.length} chapters for your ${form.getValues('productType')}.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Generation Failed",
        description: error.message || "Unable to generate outline. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: OutlineBuilderForm) => {
    generateMutation.mutate(data);
  };

  return (
    <div className="container max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <ListChecks className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold" data-testid="heading-outline-builder">
            Product Outline Builder
          </h1>
          {isPro && (
            <Badge variant="default" data-testid="badge-pro-active">
              <Crown className="h-3 w-3 mr-1" />
              Pro
            </Badge>
          )}
        </div>
        <p className="text-lg text-muted-foreground" data-testid="text-description">
          AI creates a complete, step-by-step outline for your eBook, course, or template
        </p>
        {isPro && (
          <p className="text-sm text-primary mt-2" data-testid="text-pro-features">
            ✨ Pro features: Deep research, monetization strategies, and advanced structuring
          </p>
        )}
      </div>

      <Card className="mb-8" data-testid="card-input-form">
        <CardHeader>
          <CardTitle data-testid="heading-form-title">Product Details</CardTitle>
          <CardDescription data-testid="text-form-description">
            Tell us about your digital product so we can create the perfect outline
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="productType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel data-testid="label-product-type">Product Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-product-type">
                          <SelectValue placeholder="What are you creating?" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="eBook" data-testid="option-type-ebook">eBook (PDF/EPUB)</SelectItem>
                        <SelectItem value="Online Course" data-testid="option-type-course">Online Course (Video/Text)</SelectItem>
                        <SelectItem value="Template Pack" data-testid="option-type-template">Template Pack</SelectItem>
                        <SelectItem value="Workbook" data-testid="option-type-workbook">Workbook/Guide</SelectItem>
                        <SelectItem value="Checklist Series" data-testid="option-type-checklist">Checklist Series</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage data-testid="error-product-type" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="topic"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel data-testid="label-topic">Topic/Title</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Complete Guide to Freelance Writing"
                        {...field}
                        data-testid="input-topic"
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">
                      What will your product teach or help people do?
                    </p>
                    <FormMessage data-testid="error-topic" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="targetAudience"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel data-testid="label-audience">Target Audience</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g., Aspiring freelance writers who want to earn $5k+/month but don't know where to start"
                        className="resize-none"
                        rows={3}
                        {...field}
                        data-testid="input-audience"
                      />
                    </FormControl>
                    <FormMessage data-testid="error-audience" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="mainGoal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel data-testid="label-goal">Main Goal/Outcome</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g., Help readers go from zero to landing their first 3 clients in 30 days"
                        className="resize-none"
                        rows={3}
                        {...field}
                        data-testid="input-goal"
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">
                      What transformation or result will your audience achieve?
                    </p>
                    <FormMessage data-testid="error-goal" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="experienceLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel data-testid="label-experience">Audience Experience Level</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-experience">
                          <SelectValue placeholder="Select experience level" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Complete Beginner" data-testid="option-exp-beginner">Complete Beginner (No prior knowledge)</SelectItem>
                        <SelectItem value="Some Knowledge" data-testid="option-exp-some">Some Knowledge (Basic understanding)</SelectItem>
                        <SelectItem value="Intermediate" data-testid="option-exp-intermediate">Intermediate (Some experience)</SelectItem>
                        <SelectItem value="Advanced" data-testid="option-exp-advanced">Advanced (Looking to master)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage data-testid="error-experience" />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={generateMutation.isPending}
                data-testid="button-generate-outline"
              >
                {generateMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" data-testid="loader-generating" />
                    Creating Your Outline...
                  </>
                ) : (
                  <>
                    <ListChecks className="mr-2 h-4 w-4" />
                    {isPro ? 'Generate Pro Outline' : 'Generate Outline'}
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {results && (
        <div className="space-y-6">
          <Card className="border-primary/20 bg-primary/5" data-testid="card-product-overview">
            <CardHeader>
              <CardTitle className="text-2xl" data-testid="heading-product-title">
                {results.productTitle}
              </CardTitle>
              <CardDescription className="text-base" data-testid="text-subtitle">
                {results.subtitle}
              </CardDescription>
              <div className="flex flex-wrap gap-2 pt-2">
                <Badge variant="outline" data-testid="badge-pages">
                  <BookOpen className="h-3 w-3 mr-1" />
                  {results.totalEstimatedPages}
                </Badge>
                <Badge variant="outline" data-testid="badge-price">
                  <Target className="h-3 w-3 mr-1" />
                  Recommended: {results.recommendedPrice}
                </Badge>
                <Badge variant="outline" data-testid="badge-chapters">
                  <ListChecks className="h-3 w-3 mr-1" />
                  {results.chapters.length} Chapters
                </Badge>
              </div>
            </CardHeader>
          </Card>

          <div>
            <h2 className="text-2xl font-bold mb-4" data-testid="heading-chapters">
              Chapter Outline
            </h2>
            <div className="space-y-4">
              {results.chapters.map((chapter, index) => (
                <Card key={index} className="hover-elevate" data-testid={`card-chapter-${index}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge variant="secondary" data-testid={`badge-chapter-num-${index}`}>
                            Chapter {chapter.number}
                          </Badge>
                          <CardTitle className="text-lg" data-testid={`title-chapter-${index}`}>
                            {chapter.title}
                          </CardTitle>
                        </div>
                        <CardDescription data-testid={`description-chapter-${index}`}>
                          {chapter.description}
                        </CardDescription>
                        <div className="mt-2">
                          <Badge variant="outline" className="text-xs" data-testid={`badge-length-${index}`}>
                            <Clock className="h-3 w-3 mr-1" />
                            {chapter.estimatedLength}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <h4 className="font-semibold text-sm mb-2" data-testid={`heading-keypoints-${index}`}>
                        Key Points to Cover:
                      </h4>
                      <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground" data-testid={`list-keypoints-${index}`}>
                        {chapter.keyPoints.map((point, pIndex) => (
                          <li key={pIndex} data-testid={`point-${index}-${pIndex}`}>{point}</li>
                        ))}
                      </ul>
                    </div>
                    {isPro && chapter.monetizationTip && (
                      <div className="pt-3 border-t">
                        <div className="flex items-start gap-2 bg-primary/5 p-3 rounded-lg">
                          <Sparkles className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                          <div>
                            <h4 className="font-semibold text-sm mb-1" data-testid={`heading-monetization-${index}`}>
                              Pro Monetization Tip:
                            </h4>
                            <p className="text-sm text-muted-foreground" data-testid={`tip-monetization-${index}`}>
                              {chapter.monetizationTip}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {results.proTips && results.proTips.length > 0 && (
            <Card className="border-primary bg-gradient-to-br from-primary/5 to-primary/10" data-testid="card-pro-tips">
              <CardHeader>
                <CardTitle className="flex items-center gap-2" data-testid="heading-pro-tips">
                  <Crown className="h-5 w-5 text-primary" />
                  Pro Tips for Maximum Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2" data-testid="list-pro-tips">
                  {results.proTips.map((tip, index) => (
                    <li key={index} className="flex items-start gap-2" data-testid={`pro-tip-${index}`}>
                      <Sparkles className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{tip}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          <Card data-testid="card-next-steps">
            <CardHeader>
              <CardTitle data-testid="heading-next-steps">Next Steps</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2" data-testid="list-next-steps">
                {results.nextSteps.map((step, index) => (
                  <li key={index} className="flex items-start gap-2" data-testid={`next-step-${index}`}>
                    <Target className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{step}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
