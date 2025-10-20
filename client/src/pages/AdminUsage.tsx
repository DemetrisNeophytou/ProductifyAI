/**
 * Admin AI Usage Analytics
 * Monitor AI token consumption and feature usage
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Activity, Zap, Clock, Database, TrendingUp } from 'lucide-react';

export default function AdminUsage() {
  const [range, setRange] = useState('30d');
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5050';

  // Fetch usage aggregate
  const { data: usageData } = useQuery({
    queryKey: ['/api/admin/usage/aggregate', range],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/api/admin/usage/aggregate?range=${range}`);
      return response.json();
    },
  });

  const usage = usageData?.data || {
    totalRequests: 0,
    totalTokens: 0,
    totalTokensIn: 0,
    totalTokensOut: 0,
    avgLatency: 0,
    byFeature: {},
    topUsers: [],
  };

  const formatNumber = (num: number) => num.toLocaleString();

  const featureList = Object.entries(usage.byFeature || {}).sort(
    (a: any, b: any) => b[1].count - a[1].count
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">AI Usage</h2>
          <p className="text-muted-foreground">Token consumption and feature analytics</p>
        </div>
        <Select value={range} onValueChange={setRange}>
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
      </div>

      {/* Key Metrics */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatNumber(usage.totalRequests)}</div>
            <p className="text-xs text-muted-foreground mt-1">AI API calls</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tokens</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatNumber(usage.totalTokens)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              In: {formatNumber(usage.totalTokensIn)} | Out: {formatNumber(usage.totalTokensOut)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Latency</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{usage.avgLatency}ms</div>
            <p className="text-xs text-muted-foreground mt-1">Response time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cost Estimate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              ${((usage.totalTokens / 1000) * 0.002).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">OpenAI API cost</p>
          </CardContent>
        </Card>
      </div>

      {/* Usage by Feature */}
      <Card>
        <CardHeader>
          <CardTitle>Usage by Feature</CardTitle>
          <CardDescription>Breakdown of AI requests by feature type</CardDescription>
        </CardHeader>
        <CardContent>
          {featureList.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No usage data available</p>
          ) : (
            <div className="space-y-3">
              {featureList.map(([feature, data]: any) => (
                <div key={feature} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Database className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{feature}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-muted-foreground">
                        {formatNumber(data.count)} requests
                      </span>
                      <span className="text-sm font-medium">
                        {formatNumber(data.tokens)} tokens
                      </span>
                    </div>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary"
                      style={{
                        width: `${(data.count / usage.totalRequests) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Users */}
      {usage.topUsers?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top 10 Users by Token Usage</CardTitle>
            <CardDescription>Highest AI consumers in selected period</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User ID</TableHead>
                  <TableHead>Tokens Used</TableHead>
                  <TableHead>Est. Cost</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usage.topUsers.map((user: any, index: number) => (
                  <TableRow key={user.userId}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          #{index + 1}
                        </Badge>
                        <span className="font-mono text-sm">{user.userId.slice(0, 8)}...</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{formatNumber(user.tokens)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      ${((user.tokens / 1000) * 0.002).toFixed(3)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

