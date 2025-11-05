/**
 * Admin Overview Dashboard
 * System health, quick stats, and shortcuts
 */

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Activity,
  Database,
  Zap,
  Users,
  FileText,
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  TestTube,
  BarChart3,
  Settings,
} from 'lucide-react';
import { Link } from 'wouter';

interface SystemStats {
  uptime: string;
  totalUsers: number;
  totalProjects: number;
  totalKBDocs: number;
  aiRequestsToday: number;
  avgLatency: number;
  errorRate: number;
  systemHealth: 'healthy' | 'warning' | 'critical';
}

export default function AdminOverview() {
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5050';

  // Fetch system stats
  const { data: statsData, refetch } = useQuery({
    queryKey: ['/api/admin/stats'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/api/admin/stats`);
      return response.json();
    },
  });

  const stats: SystemStats = statsData?.data || {
    uptime: '2d 14h 32m',
    totalUsers: 1248,
    totalProjects: 3542,
    totalKBDocs: 15,
    aiRequestsToday: 892,
    avgLatency: 234,
    errorRate: 0.02,
    systemHealth: 'healthy',
  };

  const healthColor =
    stats.systemHealth === 'healthy'
      ? 'text-green-500'
      : stats.systemHealth === 'warning'
      ? 'text-yellow-500'
      : 'text-red-500';

  const HealthIcon =
    stats.systemHealth === 'healthy'
      ? CheckCircle
      : stats.systemHealth === 'warning'
      ? AlertTriangle
      : AlertTriangle;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">System Overview</h2>
          <p className="text-muted-foreground">
            Monitor ProductifyAI health and performance
          </p>
        </div>
        <Button onClick={() => refetch()} variant="outline" size="sm">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* System Health Card */}
      <Card className="border-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <HealthIcon className={`h-6 w-6 ${healthColor}`} />
              <div>
                <CardTitle>System Health</CardTitle>
                <CardDescription>All systems operational</CardDescription>
              </div>
            </div>
            <Badge
              variant={stats.systemHealth === 'healthy' ? 'default' : 'destructive'}
              className="text-sm"
            >
              {stats.systemHealth.toUpperCase()}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex flex-col">
              <span className="text-sm text-muted-foreground">Uptime</span>
              <span className="text-2xl font-bold">{stats.uptime}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm text-muted-foreground">Avg Latency</span>
              <span className="text-2xl font-bold">{stats.avgLatency}ms</span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm text-muted-foreground">Error Rate</span>
              <span className="text-2xl font-bold">
                {(stats.errorRate * 100).toFixed(2)}%
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projects</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalProjects.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              +8% from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">KB Documents</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalKBDocs}</div>
            <p className="text-xs text-muted-foreground mt-1">Active knowledge base</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Requests Today</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.aiRequestsToday.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <Activity className="inline h-3 w-3 mr-1" />
              Live tracking
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common admin tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Link href="/admin/evaluation">
              <Button variant="outline" className="w-full justify-start">
                <TestTube className="mr-2 h-4 w-4" />
                Run AI Tests
              </Button>
            </Link>
            <Link href="/admin/kb">
              <Button variant="outline" className="w-full justify-start">
                <Database className="mr-2 h-4 w-4" />
                Manage KB
              </Button>
            </Link>
            <Link href="/admin/analytics">
              <Button variant="outline" className="w-full justify-start">
                <BarChart3 className="mr-2 h-4 w-4" />
                View Analytics
              </Button>
            </Link>
            <Link href="/admin/settings">
              <Button variant="outline" className="w-full justify-start">
                <Settings className="mr-2 h-4 w-4" />
                System Settings
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity (placeholder) */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest system events</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              {
                action: 'KB Document Updated',
                details: 'Pricing Strategies.md',
                time: '5 minutes ago',
              },
              {
                action: 'AI Evaluation Completed',
                details: '30 questions tested, 94% score',
                time: '1 hour ago',
              },
              {
                action: 'New User Registered',
                details: 'user@example.com',
                time: '2 hours ago',
              },
              {
                action: 'Embeddings Recomputed',
                details: '12 documents processed',
                time: '4 hours ago',
              },
            ].map((activity, i) => (
              <div
                key={i}
                className="flex items-start justify-between border-b pb-3 last:border-0 last:pb-0"
              >
                <div>
                  <p className="text-sm font-medium">{activity.action}</p>
                  <p className="text-xs text-muted-foreground">{activity.details}</p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {activity.time}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* External Resources */}
      <Card>
        <CardHeader>
          <CardTitle>External Resources</CardTitle>
          <CardDescription>Quick links to external services</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            <a
              href="https://supabase.com/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm hover:underline"
            >
              <ExternalLink className="h-4 w-4" />
              Supabase Dashboard
            </a>
            <a
              href="https://platform.openai.com/usage"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm hover:underline"
            >
              <ExternalLink className="h-4 w-4" />
              OpenAI Usage
            </a>
            <a
              href="https://vercel.com/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm hover:underline"
            >
              <ExternalLink className="h-4 w-4" />
              Vercel Deployment
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

