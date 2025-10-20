/**
 * Admin Community Insights
 * Monitor community engagement and activity
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
import { MessageCircle, Users, Bot, TrendingUp } from 'lucide-react';

export default function AdminCommunity() {
  const [range, setRange] = useState('30d');
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5050';

  // Fetch community insights
  const { data: insightsData } = useQuery({
    queryKey: ['/api/admin/community/insights', range],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/api/admin/community/insights?range=${range}`);
      return response.json();
    },
  });

  const insights = insightsData?.data || {
    totalMessages: 0,
    byChannel: {},
    topContributors: [],
    botMessages: 0,
  };

  const channelNames: Record<string, string> = {
    marketplace_public: 'Marketplace Public',
    creators_hub: 'Creators Hub',
    pro_founders_lounge: 'Pro Founders Lounge',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Community Insights</h2>
          <p className="text-muted-foreground">Channel activity and engagement metrics</p>
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
            <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{insights.totalMessages.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">All channels combined</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{insights.topContributors?.length || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Unique contributors</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bot Responses</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{insights.botMessages || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {insights.totalMessages > 0
                ? `${((insights.botMessages / insights.totalMessages) * 100).toFixed(1)}% of total`
                : '0% of total'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Channel</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">
              {Object.keys(insights.byChannel || {}).length > 0
                ? channelNames[
                    Object.entries(insights.byChannel).sort((a: any, b: any) => b[1] - a[1])[0][0]
                  ] || 'N/A'
                : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Most active</p>
          </CardContent>
        </Card>
      </div>

      {/* Messages by Channel */}
      <Card>
        <CardHeader>
          <CardTitle>Messages by Channel</CardTitle>
          <CardDescription>Distribution across community channels</CardDescription>
        </CardHeader>
        <CardContent>
          {Object.keys(insights.byChannel || {}).length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No messages yet</p>
          ) : (
            <div className="space-y-4">
              {Object.entries(insights.byChannel || {})
                .sort((a: any, b: any) => b[1] - a[1])
                .map(([channelId, count]: any) => {
                  const percentage = insights.totalMessages > 0
                    ? (count / insights.totalMessages) * 100
                    : 0;

                  return (
                    <div key={channelId} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <MessageCircle className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">
                            {channelNames[channelId] || channelId}
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-muted-foreground">
                            {count.toLocaleString()} messages
                          </span>
                          <Badge variant="outline">{percentage.toFixed(1)}%</Badge>
                        </div>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Contributors */}
      {insights.topContributors?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Contributors</CardTitle>
            <CardDescription>Most active community members</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rank</TableHead>
                  <TableHead>User ID</TableHead>
                  <TableHead>Message Count</TableHead>
                  <TableHead>Percentage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {insights.topContributors.map((contributor: any, index: number) => (
                  <TableRow key={contributor.userId}>
                    <TableCell>
                      <Badge variant="outline">#{index + 1}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {contributor.userId.slice(0, 8)}...
                    </TableCell>
                    <TableCell className="font-medium">
                      {contributor.messageCount.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {((contributor.messageCount / insights.totalMessages) * 100).toFixed(1)}%
                      </Badge>
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

