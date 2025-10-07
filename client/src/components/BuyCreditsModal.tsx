import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Coins, Check, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BuyCreditsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CREDIT_PACKAGES = [
  {
    id: 'starter',
    name: '100 Credits',
    credits: 100,
    price: 9.99,
    features: ['Perfect for trying out', 'AI agent interactions', 'Content generation'],
  },
  {
    id: 'pro',
    name: '500 Credits',
    credits: 500,
    price: 39.99,
    popular: true,
    features: ['Best value', 'Extended usage', 'All AI features'],
  },
  {
    id: 'business',
    name: '1000 Credits',
    credits: 1000,
    price: 69.99,
    features: ['For power users', 'Maximum savings', 'All AI features'],
  },
];

export function BuyCreditsModal({ open, onOpenChange }: BuyCreditsModalProps) {
  const [selectedPackage, setSelectedPackage] = useState<string>('pro');
  const { toast } = useToast();

  const checkoutMutation = useMutation({
    mutationFn: async (packageType: string) => {
      const response = await apiRequest('POST', '/api/stripe/create-credits-checkout', {
        packageType,
      });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create checkout session');
      }
      
      return data;
    },
    onSuccess: (data) => {
      if (data.url) {
        // Invalidate credits query before redirecting
        queryClient.invalidateQueries({ queryKey: ['/api/ai-agents/credits'] });
        window.location.href = data.url;
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Checkout Error',
        description: error.message || 'Failed to create checkout session',
        variant: 'destructive',
      });
    },
  });

  const handlePurchase = () => {
    checkoutMutation.mutate(selectedPackage);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coins className="w-6 h-6 text-yellow-500" />
            Buy AI Credits
          </DialogTitle>
          <DialogDescription>
            Choose a credit package to power your AI agents and features
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          {CREDIT_PACKAGES.map((pkg) => (
            <Card
              key={pkg.id}
              className={`cursor-pointer transition-all relative ${
                selectedPackage === pkg.id
                  ? 'ring-2 ring-primary shadow-lg'
                  : 'hover-elevate'
              }`}
              onClick={() => setSelectedPackage(pkg.id)}
              data-testid={`card-package-${pkg.id}`}
            >
              {pkg.popular && (
                <Badge
                  className="absolute -top-2 -right-2 z-10"
                  variant="default"
                  data-testid="badge-popular"
                >
                  Most Popular
                </Badge>
              )}
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{pkg.name}</span>
                  {selectedPackage === pkg.id && (
                    <Check className="w-5 h-5 text-primary" data-testid="icon-selected" />
                  )}
                </CardTitle>
                <CardDescription>
                  <span className="text-3xl font-bold text-foreground">${pkg.price}</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 p-2 rounded-lg bg-yellow-500/10">
                  <Coins className="w-5 h-5 text-yellow-500" />
                  <span className="font-semibold">{pkg.credits} Credits</span>
                </div>
                <ul className="space-y-2">
                  {pkg.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            Credits never expire and can be used for all AI features
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={checkoutMutation.isPending}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button
              onClick={handlePurchase}
              disabled={checkoutMutation.isPending}
              data-testid="button-purchase"
            >
              {checkoutMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Purchase {CREDIT_PACKAGES.find(p => p.id === selectedPackage)?.credits} Credits
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
