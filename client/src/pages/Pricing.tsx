import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Zap, Crown, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { loadStripe } from '@stripe/stripe-js';
import { apiRequest } from "@/lib/queryClient";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

interface SubscriptionStatus {
  hasAccess: boolean;
  canCreateProject: boolean;
  canUseAI: boolean;
  projectsUsed: number;
  projectsLimit: number;
  aiTokensUsed: number;
  aiTokensLimit: number;
  tier: string;
}

export default function Pricing() {
  const { toast } = useToast();

  const { data: subscriptionStatus, isLoading } = useQuery<SubscriptionStatus>({
    queryKey: ['/api/subscription/status'],
  });

  const checkoutMutation = useMutation({
    mutationFn: async ({ priceId, tier }: { priceId: string; tier: string }) => {
      const response = await fetch('/api/subscription/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ priceId, tier }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create checkout session');
      }

      return response.json();
    },
    onSuccess: async (data: any) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error: any) => {
      toast({
        title: "Checkout Failed",
        description: error.message || "Failed to start checkout",
        variant: "destructive",
      });
    },
  });

  const handleSubscribe = (priceId: string, tier: 'plus' | 'pro') => {
    checkoutMutation.mutate({ priceId, tier });
  };

  const formatLimit = (limit: number) => {
    return limit === -1 ? 'Unlimited' : limit.toString();
  };

  const getDaysRemaining = () => {
    return 3;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" data-testid="loading-spinner" />
      </div>
    );
  }

  const isOnTrial = subscriptionStatus?.tier === 'trial';

  return (
    <div className="container max-w-6xl mx-auto px-4 py-12">
      {isOnTrial && (
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4" data-testid="badge-trial">
            {getDaysRemaining()}-Day Free Trial Active
          </Badge>
          <h1 className="text-4xl font-bold mb-4" data-testid="heading-trial">
            Build Your €100k+ Digital Product Business
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-4" data-testid="text-trial-message">
            You're on a 3-day trial with full access. No credit card required.
          </p>
          <p className="text-base text-muted-foreground max-w-2xl mx-auto" data-testid="text-trial-subtitle">
            <strong className="text-foreground">You don't need to be an expert.</strong> Our AI Monetization Coach guides you step-by-step to create and sell digital products that generate €100,000+ per year.
          </p>
        </div>
      )}

      {!isOnTrial && subscriptionStatus?.tier && (
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4" data-testid="heading-pricing">
            Choose Your Plan
          </h1>
          <p className="text-lg text-muted-foreground" data-testid="text-current-plan">
            Current plan: <strong className="text-foreground capitalize">{subscriptionStatus.tier}</strong>
          </p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-8 mb-12">
        <Card className="relative" data-testid="card-plan-plus">
          <CardHeader>
            <div className="flex items-center justify-between mb-2">
              <Zap className="h-8 w-8 text-primary" />
              <Badge variant="secondary" data-testid="badge-popular">Popular</Badge>
            </div>
            <CardTitle className="text-3xl" data-testid="heading-plus-title">Plus</CardTitle>
            <CardDescription data-testid="text-plus-description">
              Essential tools to create & sell your first products
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="text-4xl font-bold mb-2" data-testid="text-plus-price">
                €24.99<span className="text-lg font-normal text-muted-foreground">/month</span>
              </div>
              <p className="text-sm text-muted-foreground" data-testid="text-plus-billing">
                Everything you need to launch products that sell
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3" data-testid="feature-plus-outlines">
                <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span>AI-powered product outlines</span>
              </div>
              <div className="flex items-start gap-3" data-testid="feature-plus-chapters">
                <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span>Full chapter & lesson writing</span>
              </div>
              <div className="flex items-start gap-3" data-testid="feature-plus-export">
                <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span>Professional PDF/DOCX exports</span>
              </div>
              <div className="flex items-start gap-3" data-testid="feature-plus-strategies">
                <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span>Basic monetization strategies</span>
              </div>
              <div className="flex items-start gap-3" data-testid="feature-plus-projects">
                <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span>Up to {formatLimit(10)} products</span>
              </div>
              <div className="flex items-start gap-3" data-testid="feature-plus-tokens">
                <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span>{formatLimit(20000)} AI tokens/month</span>
              </div>
            </div>

            <div className="space-y-3 pt-4">
              <Button 
                className="w-full" 
                size="lg"
                disabled={checkoutMutation.isPending}
                onClick={() => handleSubscribe('price_1SEEtkgAgnQzW8UqGtur2sN4', 'plus')}
                data-testid="button-plus-monthly"
              >
                {checkoutMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Get Started - €24.99/month'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="relative border-primary" data-testid="card-plan-pro">
          <div className="absolute -top-4 left-1/2 -translate-x-1/2">
            <Badge className="bg-primary text-primary-foreground" data-testid="badge-best-value">
              <Crown className="h-3 w-3 mr-1" />
              Best Value
            </Badge>
          </div>
          <CardHeader>
            <div className="flex items-center justify-between mb-2">
              <Crown className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-3xl" data-testid="heading-pro-title">Pro</CardTitle>
            <CardDescription data-testid="text-pro-description">
              Scale to €100k+ with advanced strategies
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="text-4xl font-bold mb-2" data-testid="text-pro-price">
                €59.99<span className="text-lg font-normal text-muted-foreground">/3 months</span>
              </div>
              <p className="text-sm text-muted-foreground" data-testid="text-plus-billing">
                Save 20% • Only €19.99/month
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3" data-testid="feature-pro-everything">
                <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="font-semibold">Everything in Plus, plus:</span>
              </div>
              <div className="flex items-start gap-3" data-testid="feature-pro-pricing">
                <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span>Advanced pricing strategies (€47-€497 products)</span>
              </div>
              <div className="flex items-start gap-3" data-testid="feature-pro-funnels">
                <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span>Sales funnel templates & automation</span>
              </div>
              <div className="flex items-start gap-3" data-testid="feature-pro-launch">
                <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span>30-day launch plans (€10k-50k+ goals)</span>
              </div>
              <div className="flex items-start gap-3" data-testid="feature-pro-templates">
                <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span>Premium revenue-optimized templates</span>
              </div>
              <div className="flex items-start gap-3" data-testid="feature-pro-projects">
                <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span>Unlimited products</span>
              </div>
              <div className="flex items-start gap-3" data-testid="feature-pro-tokens">
                <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span>Unlimited AI content generation</span>
              </div>
              <div className="flex items-start gap-3" data-testid="feature-pro-support">
                <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span>Priority support & €100k+ coaching</span>
              </div>
            </div>

            <div className="space-y-3 pt-4">
              <Button 
                className="w-full" 
                size="lg"
                disabled={checkoutMutation.isPending}
                onClick={() => handleSubscribe('price_1SEF9zAggnQzW8Uq7LcOJB8Q', 'pro')}
                data-testid="button-pro-quarterly"
              >
                {checkoutMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Get Started - €59.99/3 months'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="text-center text-sm text-muted-foreground" data-testid="text-cancel-anytime">
        <p>Cancel anytime. No questions asked.</p>
        <p className="mt-2">All plans include a 30-day money-back guarantee.</p>
      </div>
    </div>
  );
}
