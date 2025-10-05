import { useState, useCallback } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { AgentRunResponse } from '@shared/agent-types';

export interface AgentJobProgress {
  jobId: string;
  status: 'queued' | 'running' | 'succeeded' | 'failed' | 'cancelled';
  estimatedCredits?: number;
  consumedCredits?: number;
  output?: any;
  error?: { code: string; message: string; hint?: string };
  steps?: Array<{ at: string; message: string }>;
}

export function useAgentRunner() {
  const [activeJobId, setActiveJobId] = useState<string | null>(null);

  const runAgentMutation = useMutation({
    mutationFn: async ({ agentName, input, projectId }: {
      agentName: string;
      input: any;
      projectId?: string;
    }) => {
      const response = await apiRequest('POST', '/api/ai-agents/run', {
        agentName,
        input,
        projectId,
      });
      return await response.json() as AgentRunResponse;
    },
    onSuccess: (data) => {
      if (data.jobId) {
        setActiveJobId(data.jobId);
      }
    },
  });

  const jobStatusQuery = useQuery<AgentJobProgress>({
    queryKey: ['/api/ai-agents/jobs', activeJobId],
    queryFn: async () => {
      if (!activeJobId) throw new Error('No active job');
      const response = await apiRequest('GET', `/api/ai-agents/jobs/${activeJobId}`);
      return await response.json();
    },
    enabled: !!activeJobId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === 'queued' || status === 'running') {
        return 1000;
      }
      return false;
    },
  });

  const cancelJobMutation = useMutation({
    mutationFn: async (jobId: string) => {
      const response = await apiRequest('POST', `/api/ai-agents/jobs/${jobId}/cancel`);
      return await response.json();
    },
    onSuccess: () => {
      jobStatusQuery.refetch();
    },
  });

  const runAgent = useCallback((params: {
    agentName: string;
    input: any;
    projectId?: string;
  }) => {
    return runAgentMutation.mutateAsync(params);
  }, [runAgentMutation]);

  const cancelJob = useCallback((jobId?: string) => {
    const id = jobId || activeJobId;
    if (id) {
      cancelJobMutation.mutate(id);
    }
  }, [activeJobId, cancelJobMutation]);

  const clearActiveJob = useCallback(() => {
    setActiveJobId(null);
  }, []);

  return {
    runAgent,
    cancelJob,
    clearActiveJob,
    isRunning: runAgentMutation.isPending || jobStatusQuery.data?.status === 'running' || jobStatusQuery.data?.status === 'queued',
    jobStatus: jobStatusQuery.data,
    error: runAgentMutation.error || jobStatusQuery.error,
  };
}
