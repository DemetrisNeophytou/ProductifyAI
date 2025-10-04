import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, Zap, DollarSign, Loader2 } from "lucide-react";

interface AnalyticsSummary {
  totalProjects: number;
  totalAiUsage: number;
  totalRevenue: number;
  conversionRate: number;
}

export default function Analytics() {
  const { data: summary, isLoading } = useQuery<AnalyticsSummary>({
    queryKey: ['/api/analytics/summary'],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" data-testid="loading-spinner" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold mb-8" data-testid="heading-analytics">Your Analytics</h1>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card data-testid="card-projects">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <BarChart3 className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-projects">
              {summary?.totalProjects || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Products created
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-ai-usage">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Usage</CardTitle>
            <Zap className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-ai-usage">
              {summary?.totalAiUsage || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              AI generations
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-revenue">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-revenue">
              €{((summary?.totalRevenue || 0) / 100).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              From subscriptions
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-conversion">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-conversion-rate">
              {(summary?.conversionRate || 0).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Checkout to subscription
            </p>
          </CardContent>
        </Card>
      </div>

      <Card data-testid="card-insights">
        <CardHeader>
          <CardTitle>Growth Insights</CardTitle>
          <CardDescription>Your business metrics at a glance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b">
              <span className="text-sm font-medium">Projects Created</span>
              <span className="text-sm text-muted-foreground" data-testid="text-projects-detail">
                {summary?.totalProjects || 0} total
              </span>
            </div>
            <div className="flex items-center justify-between py-3 border-b">
              <span className="text-sm font-medium">AI Generations</span>
              <span className="text-sm text-muted-foreground" data-testid="text-ai-detail">
                {summary?.totalAiUsage || 0} generations
              </span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-sm font-medium">Average Revenue per User</span>
              <span className="text-sm text-muted-foreground" data-testid="text-arpu">
                €{((summary?.totalRevenue || 0) / 100).toFixed(2)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
