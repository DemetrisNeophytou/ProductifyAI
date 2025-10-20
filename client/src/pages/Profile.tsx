import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crown, Zap, Gift, ExternalLink, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5050';

  const { data: subData } = useQuery({
    queryKey: ['/api/subscription/status', user?.id],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/subscription/status?userId=${user?.id}`);
      return res.json();
    },
    enabled: !!user?.id,
  });

  const portalMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${API_BASE}/api/stripe/portal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id }),
      });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.data?.url) window.location.href = data.data.url;
    },
  });

  const plan = subData?.data?.plan || 'free';
  const status = subData?.data?.subscriptionStatus || 'inactive';

  const planIcons = { free: Gift, plus: Zap, pro: Crown };
  const PlanIcon = planIcons[plan as keyof typeof planIcons] || Gift;

  return (
    <div className="container max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Account Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Email</span>
            <span className="font-medium">{user?.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Name</span>
            <span className="font-medium">{user?.firstName} {user?.lastName}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Subscription</CardTitle>
          <CardDescription>Current plan and billing</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PlanIcon className="h-5 w-5" />
              <span className="text-lg font-bold">{plan.toUpperCase()}</span>
            </div>
            <Badge>{status}</Badge>
          </div>

          {subData?.data?.subscriptionPeriodEnd && (
            <p className="text-sm text-muted-foreground">
              Renews: {new Date(subData.data.subscriptionPeriodEnd).toLocaleDateString()}
            </p>
          )}

          <div className="flex gap-3">
            <Button onClick={() => portalMutation.mutate()} variant="outline">
              <ExternalLink className="mr-2 h-4 w-4" />
              Manage Subscription
            </Button>
            {plan === 'free' && (
              <Button asChild>
                <a href="/pricing">Upgrade Plan</a>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" disabled>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Account
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

