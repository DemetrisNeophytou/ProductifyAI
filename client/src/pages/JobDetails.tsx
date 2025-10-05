import { useParams, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Loader2, 
  Ban,
  Coins,
  Calendar,
  FileText
} from 'lucide-react';
import { format } from 'date-fns';

interface JobDetails {
  id: string;
  userId: string;
  projectId?: string | null;
  agentName: string;
  status: 'queued' | 'running' | 'succeeded' | 'failed' | 'cancelled';
  input: any;
  output?: any;
  estimatedCredits?: number;
  consumedCredits?: number;
  error?: { code: string; message: string; hint?: string };
  steps?: Array<{ at: string; message: string }>;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

const statusConfig = {
  queued: {
    icon: Clock,
    label: 'Queued',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    variant: 'secondary' as const,
  },
  running: {
    icon: Loader2,
    label: 'Running',
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10',
    variant: 'secondary' as const,
  },
  succeeded: {
    icon: CheckCircle2,
    label: 'Succeeded',
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    variant: 'default' as const,
  },
  failed: {
    icon: XCircle,
    label: 'Failed',
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
    variant: 'destructive' as const,
  },
  cancelled: {
    icon: Ban,
    label: 'Cancelled',
    color: 'text-gray-500',
    bgColor: 'bg-gray-500/10',
    variant: 'outline' as const,
  },
};

export default function JobDetails() {
  const { jobId } = useParams<{ jobId: string }>();
  const [, setLocation] = useLocation();

  const { data: job, isLoading } = useQuery<JobDetails>({
    queryKey: ['/api/ai-agents/jobs', jobId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/ai-agents/jobs/${jobId}`);
      return await response.json();
    },
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === 'queued' || status === 'running') {
        return 2000;
      }
      return false;
    },
  });

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading job details...</p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />
          <h2 className="text-xl font-semibold mb-2">Job Not Found</h2>
          <p className="text-muted-foreground mb-4">The job you're looking for doesn't exist.</p>
          <Button onClick={() => setLocation('/ai-agents')} data-testid="button-back-to-agents">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to AI Agents
          </Button>
        </div>
      </div>
    );
  }

  const config = statusConfig[job.status];
  const StatusIcon = config.icon;

  return (
    <div className="h-full flex flex-col p-6 gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation('/ai-agents')}
            data-testid="button-back"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold" data-testid="text-page-title">Job Details</h1>
            <p className="text-muted-foreground">Agent: {job.agentName.replace(/_/g, ' ')}</p>
          </div>
        </div>
        <Badge variant={config.variant} className="gap-2" data-testid={`badge-status-${job.status}`}>
          <StatusIcon className={`w-4 h-4 ${job.status === 'running' ? 'animate-spin' : ''}`} />
          {config.label}
        </Badge>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Job Info */}
          <Card>
            <CardHeader>
              <CardTitle>Job Information</CardTitle>
              <CardDescription>Basic details about this agent job</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Job ID</p>
                  <p className="font-mono text-sm" data-testid="text-job-id">{job.id}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Agent Type</p>
                  <p className="font-semibold" data-testid="text-agent-name">{job.agentName.replace(/_/g, ' ')}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Created</p>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <p className="text-sm" data-testid="text-created-at">
                      {format(new Date(job.createdAt), 'MMM d, yyyy HH:mm')}
                    </p>
                  </div>
                </div>
                {job.completedAt && (
                  <div>
                    <p className="text-sm text-muted-foreground">Completed</p>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <p className="text-sm" data-testid="text-completed-at">
                        {format(new Date(job.completedAt), 'MMM d, yyyy HH:mm')}
                      </p>
                    </div>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Estimated Credits</p>
                  <div className="flex items-center gap-2">
                    <Coins className="w-4 h-4 text-yellow-500" />
                    <p className="font-semibold" data-testid="text-estimated-credits">
                      {job.estimatedCredits || 0}
                    </p>
                  </div>
                </div>
                {job.consumedCredits !== null && job.consumedCredits !== undefined && (
                  <div>
                    <p className="text-sm text-muted-foreground">Consumed Credits</p>
                    <div className="flex items-center gap-2">
                      <Coins className="w-4 h-4 text-yellow-500" />
                      <p className="font-semibold" data-testid="text-consumed-credits">
                        {job.consumedCredits}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Input */}
          <Card>
            <CardHeader>
              <CardTitle>Input</CardTitle>
              <CardDescription>Parameters provided to the agent</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[200px]">
                <pre className="text-sm bg-muted p-4 rounded-lg overflow-auto" data-testid="text-input">
                  {JSON.stringify(job.input, null, 2)}
                </pre>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Output */}
          {job.output && (
            <Card>
              <CardHeader>
                <CardTitle>Output</CardTitle>
                <CardDescription>Result from the agent</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <pre className="text-sm bg-muted p-4 rounded-lg overflow-auto" data-testid="text-output">
                    {JSON.stringify(job.output, null, 2)}
                  </pre>
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          {/* Error */}
          {job.error && (
            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="text-destructive">Error Details</CardTitle>
                <CardDescription>Information about the failure</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-sm font-semibold">Error Code</p>
                  <p className="text-sm text-muted-foreground" data-testid="text-error-code">{job.error.code}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold">Error Message</p>
                  <p className="text-sm text-muted-foreground" data-testid="text-error-message">{job.error.message}</p>
                </div>
                {job.error.hint && (
                  <div>
                    <p className="text-sm font-semibold">Hint</p>
                    <p className="text-sm text-muted-foreground" data-testid="text-error-hint">{job.error.hint}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar - Steps */}
        <div className="lg:col-span-1">
          <Card className="h-full flex flex-col">
            <CardHeader>
              <CardTitle>Execution Steps</CardTitle>
              <CardDescription>Progress tracking</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden">
              <ScrollArea className="h-full">
                {job.steps && job.steps.length > 0 ? (
                  <div className="space-y-3">
                    {job.steps.map((step, idx) => (
                      <div key={idx} className="flex gap-3" data-testid={`step-${idx}`}>
                        <div className="flex-shrink-0">
                          <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm">{step.message}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(step.at), 'HH:mm:ss')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">No steps recorded yet</p>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
