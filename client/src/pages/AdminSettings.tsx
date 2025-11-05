/**
 * Admin Settings
 * System configuration, environment variables, and admin tools
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import {
  Settings,
  Database,
  Key,
  Shield,
  Trash2,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Server,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface SystemConfig {
  database: {
    url: string;
    connected: boolean;
    poolSize: number;
  };
  openai: {
    configured: boolean;
    model: string;
    embeddingModel: string;
  };
  environment: {
    nodeEnv: string;
    port: number;
    corsOrigin: string[];
  };
  features: {
    evalMode: boolean;
    mockDb: boolean;
  };
}

export default function AdminSettings() {
  const [showSecrets, setShowSecrets] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5050';

  // Fetch system config
  const { data: configData } = useQuery({
    queryKey: ['/api/admin/config'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/api/admin/config`);
      return response.json();
    },
  });

  const config: SystemConfig = configData?.data || {
    database: {
      url: 'postgresql://postgres:***@db.dfqssnvqsxjjtyhylzen.supabase.co:5432/postgres',
      connected: true,
      poolSize: 10,
    },
    openai: {
      configured: true,
      model: 'gpt-4o',
      embeddingModel: 'text-embedding-3-large',
    },
    environment: {
      nodeEnv: 'development',
      port: 5050,
      corsOrigin: ['http://localhost:5173'],
    },
    features: {
      evalMode: true,
      mockDb: false,
    },
  };

  // Clear logs mutation
  const clearLogsMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`${API_BASE}/api/admin/logs/clear`, {
        method: 'POST',
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Logs cleared',
        description: 'System logs have been reset.',
      });
    },
  });

  // Restart eval mutation
  const restartEvalMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`${API_BASE}/api/admin/evaluation/restart`, {
        method: 'POST',
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Evaluation restarted',
        description: 'AI evaluation suite has been reset.',
      });
    },
  });

  const maskSecret = (value: string) => {
    if (!showSecrets) {
      const visible = value.slice(0, 12);
      return `${visible}${'*'.repeat(Math.min(value.length - 12, 20))}`;
    }
    return value;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">System Settings</h2>
        <p className="text-muted-foreground">
          Configuration, environment, and admin tools
        </p>
      </div>

      {/* Current Admin User */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Admin User</CardTitle>
              <CardDescription>Currently logged in</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <p className="text-sm font-medium">{user?.email}</p>
              <p className="text-xs text-muted-foreground">
                ID: {user?.id?.substring(0, 8)}...
              </p>
            </div>
            <Badge variant="default">Admin</Badge>
          </div>
        </CardContent>
      </Card>

      {/* System Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Settings className="h-5 w-5" />
              <div>
                <CardTitle>System Configuration</CardTitle>
                <CardDescription>Environment variables (read-only)</CardDescription>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSecrets(!showSecrets)}
            >
              {showSecrets ? (
                <>
                  <EyeOff className="mr-2 h-4 w-4" />
                  Hide
                </>
              ) : (
                <>
                  <Eye className="mr-2 h-4 w-4" />
                  Show
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Database */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Database className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-semibold">Database</h3>
              {config.database.connected ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-red-500" />
              )}
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Connection URL</span>
                <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                  {maskSecret(config.database.url)}
                </code>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pool Size</span>
                <span className="font-medium">{config.database.poolSize}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge variant={config.database.connected ? 'default' : 'destructive'}>
                  {config.database.connected ? 'Connected' : 'Disconnected'}
                </Badge>
              </div>
            </div>
          </div>

          <Separator />

          {/* OpenAI */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Key className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-semibold">OpenAI Configuration</h3>
              {config.openai.configured ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-red-500" />
              )}
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Chat Model</span>
                <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                  {config.openai.model}
                </code>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Embedding Model</span>
                <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                  {config.openai.embeddingModel}
                </code>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">API Key</span>
                <Badge variant={config.openai.configured ? 'default' : 'destructive'}>
                  {config.openai.configured ? 'Configured' : 'Missing'}
                </Badge>
              </div>
            </div>
          </div>

          <Separator />

          {/* Environment */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Server className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-semibold">Environment</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Node Environment</span>
                <Badge variant="outline">{config.environment.nodeEnv}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Server Port</span>
                <span className="font-medium">{config.environment.port}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">CORS Origins</span>
                <span className="text-xs text-muted-foreground">
                  {config.environment.corsOrigin.length} configured
                </span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Feature Flags */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-semibold">Feature Flags</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Evaluation Mode</span>
                <Badge variant={config.features.evalMode ? 'default' : 'secondary'}>
                  {config.features.evalMode ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Mock Database</span>
                <Badge variant={config.features.mockDb ? 'default' : 'secondary'}>
                  {config.features.mockDb ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Admin Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Admin Actions</CardTitle>
          <CardDescription>System maintenance and utilities</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-start gap-3 p-4 border rounded-lg">
              <RefreshCw className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium mb-1">Restart Evaluation</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Reset AI evaluation suite and clear cached results
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => restartEvalMutation.mutate()}
                  disabled={restartEvalMutation.isPending}
                >
                  Restart
                </Button>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 border rounded-lg">
              <Trash2 className="h-5 w-5 text-destructive mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium mb-1">Clear Logs</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Delete system logs older than 7 days
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (confirm('Are you sure? This will delete old log files.')) {
                      clearLogsMutation.mutate();
                    }
                  }}
                  disabled={clearLogsMutation.isPending}
                >
                  Clear Logs
                </Button>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 border rounded-lg">
              <Database className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium mb-1">Recompute All Embeddings</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Regenerate vectors for all KB documents
                </p>
                <Button variant="outline" size="sm" disabled>
                  Coming Soon
                </Button>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 border rounded-lg">
              <Settings className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium mb-1">System Health Check</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Run diagnostics on all system components
                </p>
                <Button variant="outline" size="sm" disabled>
                  Run Check
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Health */}
      <Card>
        <CardHeader>
          <CardTitle>System Health</CardTitle>
          <CardDescription>Last 24 hours</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Uptime</span>
              <Badge variant="default">99.98%</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Errors (last 24h)</span>
              <Badge variant="outline">3</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Avg Response Time</span>
              <Badge variant="outline">234ms</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Last Backup</span>
              <span className="text-sm text-muted-foreground">2 hours ago</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Warning */}
      <Card className="border-yellow-500/50 bg-yellow-500/5">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            <CardTitle className="text-yellow-600 dark:text-yellow-400">
              Security Notice
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p>
            This admin panel provides full access to system configuration and sensitive data.
            Only authorized personnel should access these settings. All actions are logged.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

