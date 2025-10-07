import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const offerBuilderSchema = z.object({
  productName: z.string().min(1, "Please enter product name"),
  productDescription: z.string().min(1, "Please describe your product"),
  targetRevenue: z.string().min(1, "Please enter target revenue"),
  targetAudience: z.string().min(1, "Please describe your audience"),
});

type OfferBuilderForm = z.infer<typeof offerBuilderSchema>;

interface AIResponse {
  ok: boolean;
  error?: string;
  module?: string;
  deliverables?: Array<{
    type: string;
    filename: string;
    content: string;
  }>;
  kpis?: string[];
  nextActions?: string[];
}

export default function OfferBuilder() {
  const { toast } = useToast();
  const [result, setResult] = useState<AIResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { data: subscriptionStatus } = useQuery<{
    tier: 'free' | 'plus' | 'pro' | null;
  }>({
    queryKey: ["/api/subscription/status"],
  });

  const isPro = subscriptionStatus?.tier === 'pro';

  const form = useForm<OfferBuilderForm>({
    resolver: zodResolver(offerBuilderSchema),
    defaultValues: {
      productName: "",
      productDescription: "",
      targetRevenue: "",
      targetAudience: "",
    },
  });

  const onGenerate = async (data: OfferBuilderForm) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module: 'offer',
          inputs: data,
          format: 'markdown'
        })
      });
      
      const result = await response.json();
      
      if (!result.ok) {
        toast({
          title: "Generation Failed",
          description: result.error || "Unable to generate offer. Please try again.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
      
      setResult(result);
      toast({
        title: "Offer Created!",
        description: "Generated complete 3-tier offer stack with revenue math.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <DollarSign className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold" data-testid="heading-offer-builder">
            AI Offer Builder
          </h1>
        </div>
        <p className="text-lg text-muted-foreground" data-testid="text-description">
          Build a complete 3-tier offer stack with revenue projections and conversion strategy
        </p>
        {!isPro && (
          <Badge variant="secondary" className="mt-2" data-testid="badge-tier-limit">
            Plus Plan: 3 pricing tiers • Pro Plan: Advanced upsells & bonuses
          </Badge>
        )}
      </div>

      <Card className="mb-8" data-testid="card-input-form">
        <CardHeader>
          <CardTitle data-testid="heading-form-title">Product Details</CardTitle>
          <CardDescription data-testid="text-form-description">
            Tell us about your product so we can craft the perfect offer stack
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onGenerate)} className="space-y-6">
              <FormField
                control={form.control}
                name="productName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel data-testid="label-product-name">Product Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="E.g., Notion Productivity System"
                        {...field}
                        data-testid="input-product-name"
                      />
                    </FormControl>
                    <FormMessage data-testid="error-product-name" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="productDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel data-testid="label-product-description">Product Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="What does your product do? What transformation does it provide?"
                        className="min-h-[100px]"
                        {...field}
                        data-testid="textarea-product-description"
                      />
                    </FormControl>
                    <FormMessage data-testid="error-product-description" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="targetRevenue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel data-testid="label-target-revenue">Target Revenue (30 Days)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="E.g., €5,000 in first month"
                        {...field}
                        data-testid="input-target-revenue"
                      />
                    </FormControl>
                    <FormMessage data-testid="error-target-revenue" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="targetAudience"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel data-testid="label-target-audience">Target Audience</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Who is this for? What are their pain points?"
                        className="min-h-[80px]"
                        {...field}
                        data-testid="textarea-target-audience"
                      />
                    </FormControl>
                    <FormMessage data-testid="error-target-audience" />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={isLoading}
                data-testid="button-generate-offer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" data-testid="loader-generating" />
                    Creating Offer Stack...
                  </>
                ) : (
                  <>
                    <DollarSign className="mr-2 h-4 w-4" />
                    Generate Offer Stack
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {result?.ok && result.deliverables && result.deliverables.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold" data-testid="heading-results">
              Your Offer Stack
            </h2>
            <Badge variant="secondary" data-testid="badge-generated">
              Generated
            </Badge>
          </div>

          {result.deliverables.map((deliverable, index) => (
            <Card key={index} className="hover-elevate" data-testid={`card-deliverable-${index}`}>
              <CardHeader>
                <CardTitle data-testid={`heading-deliverable-${index}`}>
                  {deliverable.filename}
                </CardTitle>
                <CardDescription data-testid={`text-deliverable-type-${index}`}>
                  {deliverable.type.toUpperCase()} Format
                </CardDescription>
              </CardHeader>
              <CardContent>
                <pre 
                  className="whitespace-pre-wrap font-sans text-sm leading-relaxed" 
                  data-testid={`text-deliverable-content-${index}`}
                >
                  {String(deliverable.content)}
                </pre>
              </CardContent>
            </Card>
          ))}

          {result.nextActions && result.nextActions.length > 0 && (
            <Card data-testid="card-next-actions">
              <CardHeader>
                <CardTitle className="text-lg" data-testid="heading-next-actions">
                  Next Steps
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-2">
                  {result.nextActions.map((action, index) => (
                    <li key={index} className="text-muted-foreground" data-testid={`next-action-${index}`}>
                      {action}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
