import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Paintbrush, FileText, Send, Trash2, Plus, Coins } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface AgentSession {
  id: string;
  agentType: string;
  title: string;
  messages: Message[];
  status: string;
  creditsUsed: number;
  createdAt: string;
  updatedAt: string;
}

interface CreditInfo {
  credits: number;
  history: any[];
}

const AGENT_CONFIG = {
  builder: {
    name: 'Builder Agent',
    icon: Sparkles,
    description: 'Structure ebooks, courses, and digital products',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    cost: 5,
  },
  design: {
    name: 'Design Agent',
    icon: Paintbrush,
    description: 'Visual design and branding guidance',
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    cost: 3,
  },
  content: {
    name: 'Content Agent',
    icon: FileText,
    description: 'Write and improve content',
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    cost: 4,
  },
};

export default function AiAgents() {
  const [selectedAgent, setSelectedAgent] = useState<keyof typeof AGENT_CONFIG>('builder');
  const [currentSession, setCurrentSession] = useState<AgentSession | null>(null);
  const [inputMessage, setInputMessage] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Fetch credits
  const { data: creditInfo } = useQuery<CreditInfo>({
    queryKey: ['/api/ai-agents/credits'],
  });

  // Fetch sessions for selected agent
  const { data: sessions = [] } = useQuery<AgentSession[]>({
    queryKey: ['/api/ai-agents/sessions', selectedAgent],
    queryFn: async () => {
      const response = await fetch(`/api/ai-agents/sessions?agentType=${selectedAgent}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to load sessions');
      return response.json();
    },
  });

  // Create session mutation
  const createSessionMutation = useMutation({
    mutationFn: async (agentType: string): Promise<AgentSession> => {
      const response = await fetch('/api/ai-agents/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ agentType }),
      });
      if (!response.ok) throw new Error('Failed to create session');
      return response.json();
    },
    onSuccess: (newSession: AgentSession) => {
      queryClient.invalidateQueries({ queryKey: ['/api/ai-agents/sessions'] });
      setCurrentSession(newSession);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create session',
        variant: 'destructive',
      });
    },
  });

  // Delete session mutation
  const deleteSessionMutation = useMutation({
    mutationFn: async (sessionId: string): Promise<void> => {
      const response = await fetch(`/api/ai-agents/sessions/${sessionId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to delete session');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ai-agents/sessions'] });
      setCurrentSession(null);
    },
  });

  // Send message and stream response
  const sendMessage = async () => {
    if (!inputMessage.trim() || !currentSession || isStreaming) return;

    const userMessage = inputMessage;
    setInputMessage('');
    setIsStreaming(true);
    setStreamingMessage('');

    // Check credits before sending
    const agentConfig = AGENT_CONFIG[selectedAgent];
    if (creditInfo && creditInfo.credits < agentConfig.cost) {
      toast({
        title: 'Insufficient Credits',
        description: `You need ${agentConfig.cost} credits to use this agent. Current balance: ${creditInfo.credits}`,
        variant: 'destructive',
      });
      setIsStreaming(false);
      return;
    }

    // Add user message to UI immediately
    const tempMessages: Message[] = [
      ...(currentSession.messages || []),
      { role: 'user', content: userMessage, timestamp: Date.now() },
    ];

    try {
      const response = await fetch('/api/ai-agents/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          sessionId: currentSession.id,
          message: userMessage,
          agentType: selectedAgent,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Chat failed');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error('No response stream');

      let fullResponse = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              break;
            }

            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                fullResponse += parsed.content;
                setStreamingMessage(fullResponse);
              }
            } catch (e) {
              console.error('Error parsing chunk:', e);
            }
          }
        }
      }

      // Update session with complete messages
      const updatedMessages: Message[] = [
        ...tempMessages,
        { role: 'assistant', content: fullResponse, timestamp: Date.now() },
      ];

      setCurrentSession({
        ...currentSession,
        messages: updatedMessages,
        creditsUsed: (currentSession.creditsUsed || 0) + agentConfig.cost,
      });

      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/ai-agents/sessions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/ai-agents/credits'] });

    } catch (error: any) {
      toast({
        title: 'Chat Error',
        description: error.message || 'Failed to send message',
        variant: 'destructive',
      });
    } finally {
      setIsStreaming(false);
      setStreamingMessage('');
    }
  };

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [currentSession?.messages, streamingMessage]);

  // Select most recent session when agent changes
  useEffect(() => {
    if (sessions.length > 0 && !currentSession) {
      setCurrentSession(sessions[0]);
    }
  }, [sessions, currentSession]);

  const currentAgentConfig = AGENT_CONFIG[selectedAgent];
  const AgentIcon = currentAgentConfig.icon;

  return (
    <div className="h-full flex flex-col p-6 gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">AI Agents</h1>
          <p className="text-muted-foreground">Get help from specialized AI agents</p>
        </div>
        <div className="flex items-center gap-2">
          <Coins className="w-5 h-5 text-yellow-500" />
          <span className="text-lg font-semibold" data-testid="text-credits-balance">
            {creditInfo?.credits || 0} credits
          </span>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-0">
        {/* Agent Selection Sidebar */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Select Agent</CardTitle>
            <CardDescription>Choose your AI assistant</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {(Object.keys(AGENT_CONFIG) as Array<keyof typeof AGENT_CONFIG>).map((type) => {
              const config = AGENT_CONFIG[type];
              const Icon = config.icon;
              return (
                <Button
                  key={type}
                  variant={selectedAgent === type ? 'default' : 'outline'}
                  className="w-full justify-start gap-3 h-auto p-3"
                  onClick={() => {
                    setSelectedAgent(type);
                    setCurrentSession(null);
                  }}
                  data-testid={`button-select-${type}-agent`}
                >
                  <Icon className={`w-5 h-5 ${selectedAgent === type ? '' : config.color}`} />
                  <div className="text-left flex-1">
                    <div className="font-semibold">{config.name}</div>
                    <div className="text-xs text-muted-foreground">{config.cost} credits</div>
                  </div>
                </Button>
              );
            })}
          </CardContent>
        </Card>

        {/* Chat Area */}
        <div className="lg:col-span-3 flex flex-col gap-4 min-h-0">
          {/* Session Management */}
          <div className="flex items-center gap-3">
            <Select
              value={currentSession?.id || ''}
              onValueChange={(id) => {
                const session = sessions.find((s) => s.id === id);
                if (session) setCurrentSession(session);
              }}
            >
              <SelectTrigger className="flex-1" data-testid="select-session">
                <SelectValue placeholder="Select or create a session" />
              </SelectTrigger>
              <SelectContent>
                {sessions.map((session) => (
                  <SelectItem key={session.id} value={session.id}>
                    {session.title} ({session.messages?.length || 0} messages)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={() => createSessionMutation.mutate(selectedAgent)}
              disabled={createSessionMutation.isPending}
              data-testid="button-new-session"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Chat
            </Button>
            {currentSession && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => deleteSessionMutation.mutate(currentSession.id)}
                disabled={deleteSessionMutation.isPending}
                data-testid="button-delete-session"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Chat Messages */}
          <Card className="flex-1 flex flex-col min-h-0">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${currentAgentConfig.bgColor}`}>
                  <AgentIcon className={`w-5 h-5 ${currentAgentConfig.color}`} />
                </div>
                <div>
                  <CardTitle>{currentAgentConfig.name}</CardTitle>
                  <CardDescription>{currentAgentConfig.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-4 min-h-0">
              <ScrollArea className="flex-1 pr-4" ref={scrollRef}>
                {!currentSession && (
                  <div className="text-center text-muted-foreground py-12">
                    Create or select a chat session to start
                  </div>
                )}
                <div className="space-y-4">
                  {currentSession?.messages?.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      data-testid={`message-${msg.role}-${idx}`}
                    >
                      <div
                        className={`rounded-lg p-3 max-w-[80%] ${
                          msg.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {isStreaming && streamingMessage && (
                    <div className="flex gap-3 justify-start" data-testid="message-streaming">
                      <div className="rounded-lg p-3 max-w-[80%] bg-muted">
                        {streamingMessage}
                        <span className="inline-block w-2 h-4 ml-1 bg-current animate-pulse" />
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Input Area */}
              <div className="flex gap-2">
                <Textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder={`Ask ${currentAgentConfig.name.toLowerCase()} anything...`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  className="resize-none"
                  rows={2}
                  disabled={!currentSession || isStreaming}
                  data-testid="input-message"
                />
                <Button
                  onClick={sendMessage}
                  disabled={!currentSession || !inputMessage.trim() || isStreaming}
                  size="icon"
                  className="h-full"
                  data-testid="button-send-message"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>

              {currentSession && (
                <div className="text-xs text-muted-foreground text-center">
                  Session credits used: {currentSession.creditsUsed || 0} • Cost per message: {currentAgentConfig.cost} credits
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
