/**
 * Paywall Modal
 * Shown when Free users try to access Plus/Pro features
 */

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Lock, Sparkles, Crown } from 'lucide-react';
import { Link } from 'wouter';

interface PaywallModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feature?: 'creation' | 'ai' | 'community' | 'analytics';
  title?: string;
  description?: string;
}

const featureConfig = {
  creation: {
    title: 'Creation Tools Locked',
    description: 'Access the Editor, Canvas, and AI Builder with Plus or Pro',
    icon: Sparkles,
    requiredPlan: 'plus',
    benefits: [
      'Visual Editor and Canvas',
      'AI Content Builder',
      'Media Library and Generation',
      '10 projects (Plus) or Unlimited (Pro)',
      'Lower marketplace commissions',
    ],
  },
  ai: {
    title: 'AI Expert Locked',
    description: 'Get personalized advice from our Digital Products Expert',
    icon: Sparkles,
    requiredPlan: 'plus',
    benefits: [
      '50 AI queries/month (Plus)',
      'Unlimited AI queries (Pro)',
      'RAG-powered expert knowledge',
      'Citation-backed answers',
      'Conversation history',
    ],
  },
  community: {
    title: 'Community Posting Locked',
    description: 'Join the conversation in Creators Hub',
    icon: Sparkles,
    requiredPlan: 'plus',
    benefits: [
      'Post messages and replies',
      'Access to Creators Hub',
      'Pro Founders Lounge (Pro only)',
      'Real-time discussions',
      'Network with creators',
    ],
  },
  analytics: {
    title: 'Advanced Analytics Locked',
    description: 'Track your performance and growth',
    icon: Crown,
    requiredPlan: 'pro',
    benefits: [
      'Detailed sales analytics',
      'Traffic sources breakdown',
      'Conversion tracking',
      'Revenue forecasting',
      'Export reports',
    ],
  },
};

export function PaywallModal({
  open,
  onOpenChange,
  feature = 'creation',
  title,
  description,
}: PaywallModalProps) {
  const config = featureConfig[feature];
  const Icon = config.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="p-4 rounded-full bg-primary/10">
              <Lock className="h-8 w-8 text-primary" />
            </div>
          </div>
          <DialogTitle className="text-center text-2xl">
            {title || config.title}
          </DialogTitle>
          <DialogDescription className="text-center">
            {description || config.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-3">
            <p className="text-sm font-medium">What you'll get:</p>
            {config.benefits.map((benefit, index) => (
              <div key={index} className="flex items-start gap-2">
                <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-sm">{benefit}</span>
              </div>
            ))}
          </div>

          <div className="pt-4 space-y-3">
            <Link href="/pricing">
              <Button className="w-full" size="lg">
                <Icon className="mr-2 h-5 w-5" />
                Upgrade to {config.requiredPlan === 'plus' ? 'Plus' : 'Pro'}
              </Button>
            </Link>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => onOpenChange(false)}
            >
              Maybe Later
            </Button>
          </div>

          <div className="text-center">
            <Badge variant="secondary" className="text-xs">
              {config.requiredPlan === 'plus' ? '3-day free trial • Cancel anytime' : 'Upgrade anytime • Cancel anytime'}
            </Badge>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

