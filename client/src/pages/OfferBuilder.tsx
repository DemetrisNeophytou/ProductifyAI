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
import { Badge } from "@/components/ui/badge";
import { DollarSign, Loader2, TrendingUp, Gift, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

const offerBuilderSchema = z.object({
  productName: z.string().min(1, "Please enter product name"),
  productDescription: z.string().min(1, "Please describe your product"),
  targetRevenue: z.string().min(1, "Please enter target revenue"),
  targetAudience: z.string().min(1, "Please describe your audience"),
});

type OfferBuilderForm = z.infer<typeof offerBuilderSchema>;

interface PricingTier {
  name: string;
  price: string;
  includes: string[];
  reasoning: string;
}

interface OfferResult {
  coreOffer: {
    price: string;
    positioning: string;
    valueProposition: string;
  };
  pricingTiers: PricingTier[];
  bonuses: {
    title: string;
    value: string;
    description: string;
  }[];
  upsells: {
    product: string;
    price: string;
    why: string;
  }[];
  nextSteps: string[];
}

export default function OfferBuilder() {
  const { toast } = useToast();
  const [results, setResults] = useState<OfferResult | null>(null);

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

  const generateMutation = useMutation({
    mutationFn: async (data: OfferBuilderForm) => {
      const response = await apiRequest<OfferResult>('/api/builders/offer', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return response;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/builders/offer'] });
      setResults(data);
      toast({
        title: "Offer Created!",
        description: `Generated complete monetization strategy with ${data.bonuses.length} bonuses and ${data.upsells.length} upsells.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Generation Failed",
        description: error.message || "Unable to generate offer. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: OfferBuilderForm) => {
    generateMutation.mutate(data);
  };

  return (
    <div className="container max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <DollarSign className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold" data-testid="heading-offer-builder">
            Offer Builder
          </h1>
        </div>
        <p className="text-lg text-muted-foreground" data-testid="text-description">
          Design your pricing strategy, bonuses, and upsells to maximize revenue
        </p>
      </div>

      <Card className="mb-8" data-testid="card-input-form">
        <CardHeader>
          <CardTitle data-testid="heading-form-title">Product & Audience</CardTitle>
          <CardDescription data-testid="text-form-description">
            Tell us about your product so we can create an irresistible offer
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="productName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel data-testid="label-name">Product Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Complete Freelance Writing System"
                        {...field}
                        data-testid="input-name"
                      />
                    </FormControl>
                    <FormMessage data-testid="error-name" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="productDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel data-testid="label-description">Product Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g., A comprehensive eBook that teaches complete beginners how to start and scale a freelance writing business to $5k+/month"
                        className="resize-none"
                        rows={4}
                        {...field}
                        data-testid="input-description"
                      />
                    </FormControl>
                    <FormMessage data-testid="error-description" />
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
                        placeholder="e.g., Aspiring writers who want location freedom and higher income"
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
                name="targetRevenue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel data-testid="label-revenue">Target Monthly Revenue</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., €10,000 per month"
                        {...field}
                        data-testid="input-revenue"
                      />
                    </FormControl>
                    <FormMessage data-testid="error-revenue" />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={generateMutation.isPending}
                data-testid="button-generate-offer"
              >
                {generateMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" data-testid="loader-generating" />
                    Creating Your Offer...
                  </>
                ) : (
                  <>
                    <DollarSign className="mr-2 h-4 w-4" />
                    Generate Monetization Strategy
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {results && (
        <div className="space-y-6">
          <Card className="border-primary/20 bg-primary/5" data-testid="card-core-offer">
            <CardHeader>
              <CardTitle className="text-2xl" data-testid="heading-core-offer">
                Core Offer: {results.coreOffer.price}
              </CardTitle>
              <CardDescription className="text-base" data-testid="text-positioning">
                {results.coreOffer.positioning}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground" data-testid="text-value-prop">
                {results.coreOffer.valueProposition}
              </p>
            </CardContent>
          </Card>

          <div>
            <h2 className="text-2xl font-bold mb-4" data-testid="heading-pricing-tiers">
              Pricing Tiers
            </h2>
            <div className="grid md:grid-cols-3 gap-4">
              {results.pricingTiers.map((tier, index) => (
                <Card key={index} className="hover-elevate" data-testid={`card-tier-${index}`}>
                  <CardHeader>
                    <CardTitle data-testid={`title-tier-${index}`}>{tier.name}</CardTitle>
                    <div className="text-3xl font-bold text-primary" data-testid={`price-tier-${index}`}>
                      {tier.price}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <ul className="space-y-2" data-testid={`includes-tier-${index}`}>
                      {tier.includes.map((item, idx) => (
                        <li key={idx} className="text-sm flex items-start gap-2">
                          <TrendingUp className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="text-xs text-muted-foreground pt-3 border-t" data-testid={`reasoning-tier-${index}`}>
                      {tier.reasoning}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-4" data-testid="heading-bonuses">
              Irresistible Bonuses
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {results.bonuses.map((bonus, index) => (
                <Card key={index} className="hover-elevate" data-testid={`card-bonus-${index}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg" data-testid={`title-bonus-${index}`}>
                        {bonus.title}
                      </CardTitle>
                      <Badge variant="secondary" data-testid={`value-bonus-${index}`}>
                        <Gift className="h-3 w-3 mr-1" />
                        {bonus.value}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground" data-testid={`description-bonus-${index}`}>
                      {bonus.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-4" data-testid="heading-upsells">
              Strategic Upsells
            </h2>
            <div className="space-y-4">
              {results.upsells.map((upsell, index) => (
                <Card key={index} className="hover-elevate" data-testid={`card-upsell-${index}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <CardTitle className="text-lg" data-testid={`product-upsell-${index}`}>
                          {upsell.product}
                        </CardTitle>
                        <Badge className="mt-2" data-testid={`price-upsell-${index}`}>
                          <Zap className="h-3 w-3 mr-1" />
                          {upsell.price}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground" data-testid={`why-upsell-${index}`}>
                      <strong>Why this works:</strong> {upsell.why}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <Card data-testid="card-next-steps">
            <CardHeader>
              <CardTitle data-testid="heading-next-steps">Implementation Steps</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2" data-testid="list-next-steps">
                {results.nextSteps.map((step, index) => (
                  <li key={index} className="flex items-start gap-2" data-testid={`next-step-${index}`}>
                    <TrendingUp className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
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
