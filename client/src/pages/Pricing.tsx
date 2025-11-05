/**
 * Pricing Page
 * Display subscription plans and features
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Zap, Crown, Gift } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Link } from 'wouter';

const plans = [
  {
    id: 'free',
    name: 'Free',
    price: '€0',
    period: '/forever',
    description: 'Start building on the marketplace',
    icon: Gift,
    features: [
      'Marketplace access',
      '3 projects',
      '0 AI tokens',
      '7% marketplace commission',
      'Community: Public chat',
      'Basic support',
    ],
    limits: 'Limited features',
    cta: 'Current Plan',
    highlighted: false,
  },
  {
    id: 'plus',
    name: 'Plus',
    price: '€24',
    period: '/month',
    description: 'Full AI features with 3-day trial',
    icon: Zap,
    trial: '3-day free trial',
    features: [
      'Full AI features',
      '10 projects',
      '20,000 AI tokens/month',
      '500 AI credits',
      '4% marketplace commission',
      'Community: Creators Hub',
      'Email support',
      'Priority queue',
    ],
    limits: 'Perfect for creators',
    cta: 'Start Free Trial',
    highlighted: true,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '€49',
    period: '/month',
    description: 'Unlimited access for professionals',
    icon: Crown,
    features: [
      'Unlimited AI access',
      'Unlimited projects',
      'Unlimited AI tokens',
      '2,000 AI credits',
      '1% marketplace commission',
      'Community: Pro Founders Lounge',
      'Priority 24/7 support',
      'White-label options',
      'API access',
      'Custom integrations',
    ],
    limits: 'For power users',
    cta: 'Go Pro',
    highlighted: false,
  },
];

export default function Pricing() {
  const { user } = useAuth();
  const [isAnnual, setIsAnnual] = useState(false);
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5050';

  const handleSubscribe = async (planId: string) => {
    if (!user) {
      window.location.href = '/login?redirect=/pricing';
      return;
    }

    if (planId === 'free') {
      return; // Already on free plan
    }

    try {
      // Create checkout session
      const response = await fetch(`${API_BASE}/api/stripe/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan: planId,
          userId: user.id,
        }),
      });

      const data = await response.json();

      if (data.ok && data.data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.data.url;
      } else {
        console.error('Failed to create checkout session:', data.error);
        alert('Failed to start checkout. Please try again.');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('An error occurred. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      {/* Header */}
      <div className="container mx-auto px-4 py-16 text-center">
        <Badge variant="outline" className="mb-4">
          Pricing Plans
        </Badge>
        <h1 className="text-5xl font-bold mb-4">
          Choose Your Plan
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Start free, upgrade when you need more. All plans include marketplace access.
        </p>

        {/* Annual/Monthly Toggle */}
        <div className="flex items-center justify-center gap-4 mt-8">
          <span className={!isAnnual ? 'font-semibold' : 'text-muted-foreground'}>Monthly</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAnnual(!isAnnual)}
            className="relative"
          >
            <div className={`w-12 h-6 rounded-full transition-colors ${isAnnual ? 'bg-primary' : 'bg-muted'}`}>
              <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${isAnnual ? 'translate-x-6' : ''}`} />
            </div>
          </Button>
          <span className={isAnnual ? 'font-semibold' : 'text-muted-foreground'}>
            Annual <Badge variant="secondary" className="ml-2">Save 20%</Badge>
          </span>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="container mx-auto px-4 pb-16">
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const isCurrentPlan = user?.plan === plan.id;

            return (
              <Card
                key={plan.id}
                className={`relative ${
                  plan.highlighted
                    ? 'border-2 border-primary shadow-xl scale-105'
                    : 'border'
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="px-6 py-1 text-sm">Most Popular</Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-8">
                  <div className="flex justify-center mb-4">
                    <div className={`p-3 rounded-full ${
                      plan.highlighted ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    }`}>
                      <Icon className="h-8 w-8" />
                    </div>
                  </div>
                  
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription className="mt-2">{plan.description}</CardDescription>
                  
                  {plan.trial && (
                    <Badge variant="secondary" className="mt-4">
                      {plan.trial}
                    </Badge>
                  )}
                  
                  <div className="mt-6">
                    <span className="text-5xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                  
                  {isAnnual && plan.id !== 'free' && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Billed annually: {plan.id === 'plus' ? '€230/year' : '€470/year'}
                    </p>
                  )}
                </CardHeader>

                <CardContent className="space-y-4">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </CardContent>

                <CardFooter className="flex flex-col gap-4">
                  <Button
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={isCurrentPlan}
                    className="w-full"
                    variant={plan.highlighted ? 'default' : 'outline'}
                    size="lg"
                  >
                    {isCurrentPlan ? 'Current Plan' : plan.cta}
                  </Button>
                  
                  {!isCurrentPlan && user && user.plan !== plan.id && (
                    <p className="text-xs text-center text-muted-foreground">
                      {plan.id === 'free' ? 'Downgrade anytime' : 'Upgrade instantly'}
                    </p>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>

      {/* FAQ Section */}
      <div className="container mx-auto px-4 pb-16">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What happens after the 3-day trial?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  After 3 days, your Plus subscription starts automatically. If you cancel before the trial ends, you'll be downgraded to the Free plan with no charges.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">How do marketplace commissions work?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  When you sell on the marketplace, ProductifyAI takes a small commission: 7% on Free, 4% on Plus, and just 1% on Pro. The rest goes directly to you via Stripe Connect.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Can I change plans anytime?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Yes! Upgrade instantly or downgrade at the end of your billing period. No long-term contracts or commitments.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What are AI credits used for?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  AI credits power features like content generation, image creation, and the Digital Products Expert assistant. Each action costs 1-5 credits depending on complexity.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-4 pb-16">
        <Card className="max-w-4xl mx-auto bg-primary text-primary-foreground">
          <CardContent className="p-12 text-center">
            <h2 className="text-3xl font-bold mb-4">
              Ready to build your digital empire?
            </h2>
            <p className="text-lg mb-8 opacity-90">
              Join thousands of creators using ProductifyAI to launch and scale their digital products.
            </p>
            <div className="flex gap-4 justify-center">
              <Button
                size="lg"
                variant="secondary"
                onClick={() => handleSubscribe('plus')}
              >
                Start Free Trial
              </Button>
              <Link href="/marketplace">
                <Button size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-white hover:text-primary">
                  Browse Marketplace
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
