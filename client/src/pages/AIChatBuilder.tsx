import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Send, Loader2, Plus, Trash2 } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
}

interface Session {
  id: string;
  builderType: string;
  title: string;
  status: string;
  messages?: Message[];
  createdAt: string;
  updatedAt: string;
}

export default function AIChatBuilder() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [input, setInput] = useState("");
  const [streamingMessage, setStreamingMessage] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  // Get URL params
  const params = new URLSearchParams(window.location.search);
  const builderType = params.get("type") || "product_idea";
  const isNew = params.get("new") === "true";
  const sessionIdParam = params.get("session");
  const titleParam = params.get("title") || "New Session";

  // Fetch sessions for this builder type
  const { data: sessions = [] } = useQuery<Session[]>({
    queryKey: ["/api/ai/sessions", { builderType }],
    queryFn: async () => {
      const response = await fetch(`/api/ai/sessions?builderType=${builderType}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch sessions");
      return response.json();
    },
  });

  // Fetch current session details
  const { data: session, isLoading: sessionLoading } = useQuery<Session>({
    queryKey: ["/api/ai/sessions", currentSessionId],
    enabled: !!currentSessionId,
    queryFn: async () => {
      const response = await fetch(`/api/ai/sessions/${currentSessionId}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch session");
      return response.json();
    },
  });

  // Create new session mutation
  const createSessionMutation = useMutation({
    mutationFn: async (title: string): Promise<Session> => {
      return await apiRequest("POST", "/api/ai/sessions", {
        builderType,
        title,
      }) as Promise<Session>;
    },
    onSuccess: (newSession: Session) => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai/sessions"] });
      setCurrentSessionId(newSession.id);
      toast({
        title: "New session started",
        description: "Start chatting with the AI builder",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create session",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete session mutation
  const deleteSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      return await apiRequest("DELETE", `/api/ai/sessions/${sessionId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai/sessions"] });
      setCurrentSessionId(null);
      toast({
        title: "Session deleted",
      });
    },
  });

  // Initialize or select session
  useEffect(() => {
    if (sessionIdParam) {
      setCurrentSessionId(sessionIdParam);
    } else if (isNew) {
      createSessionMutation.mutate(titleParam);
    } else if (sessions.length > 0 && !currentSessionId) {
      setCurrentSessionId(sessions[0].id);
    }
  }, [sessionIdParam, isNew, sessions]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [session?.messages, streamingMessage]);

  const handleSendMessage = async () => {
    if (!input.trim() || !currentSessionId || isStreaming) return;

    const userMessage = input;
    setInput("");
    setIsStreaming(true);
    setStreamingMessage("");

    try {
      const response = await fetch(`/api/ai/sessions/${currentSessionId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ content: userMessage }),
      });

      if (!response.ok) throw new Error("Failed to send message");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error("No response body");

      let buffer = ''; // Buffer for incomplete SSE events

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Append new chunk to buffer
        buffer += decoder.decode(value, { stream: true });
        
        // Split on double newline (SSE event delimiter)
        const events = buffer.split('\n\n');
        
        // Keep the last incomplete event in buffer
        buffer = events.pop() || '';

        // Process complete events
        for (const event of events) {
          if (event.startsWith('data: ')) {
            try {
              const data = JSON.parse(event.slice(6));
              
              if (data.type === 'chunk') {
                setStreamingMessage((prev) => prev + data.content);
              } else if (data.type === 'done') {
                setIsStreaming(false);
                setStreamingMessage('');
                queryClient.invalidateQueries({ queryKey: ["/api/ai/sessions", currentSessionId] });
              } else if (data.type === 'error') {
                throw new Error(data.message);
              }
            } catch (parseError) {
              console.error('Failed to parse SSE event:', event, parseError);
            }
          }
        }
      }
    } catch (error: any) {
      toast({
        title: "Error sending message",
        description: error.message,
        variant: "destructive",
      });
      setIsStreaming(false);
      setStreamingMessage("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getBuilderInfo = () => {
    const builders: Record<string, { title: string; description: string }> = {
      product_idea: {
        title: "Product Idea Validator",
        description: "Validate €100k+ digital product ideas using proven frameworks",
      },
      market_research: {
        title: "Market Research Pro",
        description: "Deep market analysis with customer avatars",
      },
      content_plan: {
        title: "Content Planner",
        description: "Design comprehensive content strategies",
      },
      launch_strategy: {
        title: "Launch Strategist",
        description: "Create €100k+ product launches",
      },
      scale_blueprint: {
        title: "Scale Blueprint",
        description: "Build growth systems and automation",
      },
    };
    return builders[builderType] || builders.product_idea;
  };

  const builderInfo = getBuilderInfo();

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar - Sessions list */}
      <div className="w-80 border-r flex flex-col">
        <div className="p-4 border-b">
          <Button
            variant="ghost"
            size="sm"
            className="mb-4"
            onClick={() => setLocation("/ai-builders")}
            data-testid="button-back-to-builders"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Mission Control
          </Button>
          <h2 className="font-semibold mb-1">{builderInfo.title}</h2>
          <p className="text-sm text-muted-foreground">{builderInfo.description}</p>
        </div>
        
        <div className="p-4">
          <Button
            className="w-full"
            onClick={() => createSessionMutation.mutate("New Session")}
            disabled={createSessionMutation.isPending}
            data-testid="button-new-session"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Session
          </Button>
        </div>

        <div className="flex-1 overflow-auto p-4 space-y-2">
          {sessions.map((s) => (
            <Card
              key={s.id}
              className={`p-3 cursor-pointer hover-elevate ${
                s.id === currentSessionId ? "ring-2 ring-primary" : ""
              }`}
              onClick={() => setCurrentSessionId(s.id)}
              data-testid={`session-card-${s.id}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{s.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(s.updatedAt).toLocaleDateString()}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteSessionMutation.mutate(s.id);
                  }}
                  data-testid={`button-delete-session-${s.id}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col">
        {sessionLoading || !session ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-auto p-6 space-y-6">
              {session.messages?.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-4 ${message.role === "user" ? "justify-end" : ""}`}
                  data-testid={`message-${message.id}`}
                >
                  {message.role === "assistant" && (
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        AI
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={`max-w-[70%] rounded-lg p-4 ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                  </div>
                  {message.role === "user" && (
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-muted">
                        U
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}

              {/* Streaming message */}
              {streamingMessage && (
                <div className="flex gap-4">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      AI
                    </AvatarFallback>
                  </Avatar>
                  <div className="max-w-[70%] rounded-lg p-4 bg-muted">
                    <div className="whitespace-pre-wrap text-sm">{streamingMessage}</div>
                    <Loader2 className="h-4 w-4 animate-spin mt-2" />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            <div className="border-t p-6">
              <div className="flex gap-3">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Type your message... (Shift+Enter for new line)"
                  className="resize-none min-h-[80px]"
                  disabled={isStreaming}
                  data-testid="input-message"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!input.trim() || isStreaming}
                  size="lg"
                  data-testid="button-send-message"
                >
                  {isStreaming ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
