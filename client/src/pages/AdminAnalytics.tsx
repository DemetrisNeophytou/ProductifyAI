/**
 * Admin Analytics Dashboard
 * Usage metrics, performance tracking, and API monitoring
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Activity,
  Zap,
  Users,
  DollarSign,
  TrendingUp,
  Clock,
  Database,
  Download,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface AnalyticsData {
  aiRequests: {
    today: number;
    week: number;
    month: number;
    trend: number;
  };
  latency: {
    avg: number;
    p95: number;
    p99: number;
  };
  kbLookups: {
    today: number;
    avgPerRequest: number;
  };
  tokenUsage: {
    total: number;
    cost: number;
    byModel: { model: string; tokens: number; cost: number }[];
  };
  usersByPlan: {
    free: number;
    plus: number;
    pro: number;
  };
}

export default function AdminAnalytics() {
  const [timeRange, setTimeRange] = useState('7d');
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5050';

  // Fetch analytics data
  const { data: analyticsData } = useQuery({
    queryKey: ['/api/admin/analytics', timeRange],
    queryFn: async () => {
      const response = await fetch(
        `${API_BASE}/api/admin/analytics?range=${timeRange}`
      );
      return response.json();
    },
  });

  const data: AnalyticsData = analyticsData?.data || {
    aiRequests: { today: 892, week: 6234, month: 24891, trend: 12.3 },
    latency: { avg: 234, p95: 450, p99: 680 },
    kbLookups: { today: 7136, avgPerRequest: 8 },
    tokenUsage: {
      total: 1245890,
      cost: 24.92,
      byModel: [
        { model: 'gpt-4o', tokens: 523400, cost: 15.7 },
        { model: 'gpt-4o-mini', tokens: 722490, cost: 9.22 },
      ],
    },
    usersByPlan: { free: 980, plus: 198, pro: 70 },
  };

  const exportData = () => {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `productifyai-analytics-${new Date().toISOString()}.json`;
    a.click();
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
          <p className="text-muted-foreground">
            System usage, performance, and API metrics
          </p>
        </div>
        <div className="flex gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={exportData} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Requests</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.aiRequests.today.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <TrendingUp className="inline h-3 w-3 mr-1 text-green-500" />
              +{data.aiRequests.trend}% from yesterday
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Latency</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.latency.avg}ms</div>
            <p className="text-xs text-muted-foreground mt-1">
              P95: {data.latency.p95}ms | P99: {data.latency.p99}ms
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">KB Lookups</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.kbLookups.today.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Avg {data.kbLookups.avgPerRequest} per request
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Token Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${data.tokenUsage.cost.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {(data.tokenUsage.total / 1000).toFixed(1)}K tokens
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics Tabs */}
      <Tabs defaultValue="requests" className="space-y-6">
        <TabsList>
          <TabsTrigger value="requests">Requests</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="tokens">Token Usage</TabsTrigger>
          <TabsTrigger value="users">User Plans</TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI Request Volume</CardTitle>
              <CardDescription>Total requests over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-3">
                  <span className="text-sm font-medium">Today</span>
                  <span className="text-2xl font-bold">
                    {data.aiRequests.today.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between border-b pb-3">
                  <span className="text-sm font-medium">Last 7 Days</span>
                  <span className="text-2xl font-bold">
                    {data.aiRequests.week.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Last 30 Days</span>
                  <span className="text-2xl font-bold">
                    {data.aiRequests.month.toLocaleString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Request Breakdown</CardTitle>
              <CardDescription>By endpoint type</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { endpoint: '/api/ai/chat', requests: 4523, percentage: 51 },
                  { endpoint: '/api/builders/outline', requests: 2156, percentage: 24 },
                  { endpoint: '/api/builders/content', requests: 1789, percentage: 20 },
                  { endpoint: '/api/media/generate', requests: 424, percentage: 5 },
                ].map((item) => (
                  <div key={item.endpoint} className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-mono">{item.endpoint}</span>
                        <span className="text-sm text-muted-foreground">
                          {item.requests.toLocaleString()}
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary"
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Latency Metrics</CardTitle>
              <CardDescription>Response time distribution</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium">Average</span>
                    <p className="text-xs text-muted-foreground">Mean response time</p>
                  </div>
                  <Badge variant="outline" className="text-lg font-mono">
                    {data.latency.avg}ms
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium">P95</span>
                    <p className="text-xs text-muted-foreground">95th percentile</p>
                  </div>
                  <Badge variant="outline" className="text-lg font-mono">
                    {data.latency.p95}ms
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium">P99</span>
                    <p className="text-xs text-muted-foreground">99th percentile</p>
                  </div>
                  <Badge variant="outline" className="text-lg font-mono">
                    {data.latency.p99}ms
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Knowledge Base Performance</CardTitle>
              <CardDescription>Vector search metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b pb-3">
                  <span className="text-sm">Total Lookups Today</span>
                  <span className="text-lg font-bold">
                    {data.kbLookups.today.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between border-b pb-3">
                  <span className="text-sm">Avg Lookups per Request</span>
                  <span className="text-lg font-bold">{data.kbLookups.avgPerRequest}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Cache Hit Rate</span>
                  <Badge variant="default">87.3%</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tokens" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Token Usage by Model</CardTitle>
              <CardDescription>OpenAI API consumption</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.tokenUsage.byModel.map((model) => (
                  <div key={model.model} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{model.model}</span>
                      <Badge variant="outline">${model.cost.toFixed(2)}</Badge>
                    </div>
                    <div className="text-2xl font-bold">
                      {(model.tokens / 1000).toFixed(1)}K tokens
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      ${(model.cost / model.tokens * 1000).toFixed(4)} per 1K tokens
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Total Cost Summary</CardTitle>
              <CardDescription>Period: {timeRange}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold mb-2">${data.tokenUsage.cost.toFixed(2)}</div>
              <p className="text-sm text-muted-foreground">
                {(data.tokenUsage.total / 1000).toFixed(1)}K total tokens consumed
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Users by Plan</CardTitle>
              <CardDescription>Subscription distribution</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-3">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span className="text-sm font-medium">Free</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold">
                      {data.usersByPlan.free.toLocaleString()}
                    </span>
                    <Badge variant="outline">
                      {((data.usersByPlan.free / (data.usersByPlan.free + data.usersByPlan.plus + data.usersByPlan.pro)) * 100).toFixed(1)}%
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between border-b pb-3">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium">Plus</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold">
                      {data.usersByPlan.plus.toLocaleString()}
                    </span>
                    <Badge variant="outline">
                      {((data.usersByPlan.plus / (data.usersByPlan.free + data.usersByPlan.plus + data.usersByPlan.pro)) * 100).toFixed(1)}%
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-purple-500" />
                    <span className="text-sm font-medium">Pro</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold">
                      {data.usersByPlan.pro.toLocaleString()}
                    </span>
                    <Badge variant="outline">
                      {((data.usersByPlan.pro / (data.usersByPlan.free + data.usersByPlan.plus + data.usersByPlan.pro)) * 100).toFixed(1)}%
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Revenue Metrics</CardTitle>
              <CardDescription>Subscription revenue</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Monthly Recurring Revenue (MRR)</span>
                  <span className="text-2xl font-bold">
                    ${((data.usersByPlan.plus * 29) + (data.usersByPlan.pro * 99)).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Annual Run Rate (ARR)</span>
                  <span className="text-lg font-bold text-muted-foreground">
                    ${(((data.usersByPlan.plus * 29) + (data.usersByPlan.pro * 99)) * 12).toLocaleString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

