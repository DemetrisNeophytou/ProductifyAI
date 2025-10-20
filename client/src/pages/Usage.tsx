import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Zap, Database, MessageCircle, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Usage() {
  const { user } = useAuth();
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5050';

  const { data: usageData } = useQuery({
    queryKey: ['/api/ai/expert/usage', user?.id],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/ai/expert/usage?userId=${user?.id}`);
      return res.json();
    },
    enabled: !!user?.id,
  });

  const plan = user?.plan || 'free';
  const queriesUsed = usageData?.data?.queriesUsed || 0;
  const queriesLimit = usageData?.data?.queriesLimit || 0;
  const tokensUsed = usageData?.data?.tokensUsed || 0;

  const percentage = queriesLimit > 0 ? (queriesUsed / queriesLimit) * 100 : 0;

  return (
    <div className="container max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Usage & Limits</h1>
        <Badge>{plan.toUpperCase()}</Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              AI Expert Queries
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>Used this month</span>
              <span className="font-bold">{queriesUsed} / {queriesLimit === -1 ? '∞' : queriesLimit}</span>
            </div>
            {queriesLimit > 0 && (
              <Progress value={percentage} className="h-2" />
            )}
            {plan === 'free' && (
              <Button asChild size="sm" className="w-full">
                <a href="/pricing">Upgrade to Access AI</a>
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              AI Tokens
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>Consumed</span>
              <span className="font-bold">{tokensUsed.toLocaleString()}</span>
            </div>
            <div className="text-xs text-muted-foreground">
              {plan === 'plus' && '20,000/month limit'}
              {plan === 'pro' && 'Unlimited'}
              {plan === 'free' && 'No AI access'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Community
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              {plan === 'free' && 'Read-only access'}
              {plan === 'plus' && 'Public + Creators Hub'}
              {plan === 'pro' && 'All channels'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Commission Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{user?.commissionRate || 7}%</div>
            <p className="text-xs text-muted-foreground mt-1">On marketplace sales</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

