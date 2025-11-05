import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface FloatingAICoachProps {
  defaultOpen?: boolean;
}

export function FloatingAICoach({ defaultOpen = false }: FloatingAICoachProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const abortControllerRef = useRef<AbortController | null>(null);
  const [location] = useLocation();

  // Get context-aware greeting based on current page
  const getContextGreeting = () => {
    if (location.includes("/builders/idea-finder")) {
      return "I can help you discover profitable product ideas! What niche are you interested in?";
    } else if (location.includes("/builders/content")) {
      return "Need help with content creation? I can guide you through writing compelling chapters!";
    } else if (location.includes("/builders/offer")) {
      return "Let's optimize your pricing strategy! What's your product about?";
    } else if (location.includes("/builders/funnel")) {
      return "Ready to launch? I can help you plan the perfect funnel!";
    } else if (location.includes("/dashboard")) {
      return "Welcome! I'm your AI Coach. How can I help you build your €100k product today?";
    }
    return "Hi! I'm your AI Coach. Ask me anything about creating and selling digital products!";
  };

  // Show initial greeting when opened
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        id: crypto.randomUUID(),
        role: "assistant",
        content: getContextGreeting()
      }]);
    }
  }, [isOpen]);

  const handleStreamingChat = async (userMessage: string) => {
    setIsLoading(true);
    
    const assistantMessageId = crypto.randomUUID();
    setMessages((prev) => [
      ...prev,
      {
        id: assistantMessageId,
        role: "assistant",
        content: "",
      },
    ]);

    try {
      abortControllerRef.current = new AbortController();
      
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          message: userMessage, 
          stream: true,
          context: `User is on page: ${location}` // Add context
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to get AI response");
      }

      const contentType = response.headers.get('content-type');
      
      if (contentType?.includes('text/event-stream')) {
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          throw new Error("No response stream available");
        }

        let accumulatedContent = "";

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
                
                if (parsed.error) {
                  throw new Error(parsed.error);
                }

                if (parsed.content) {
                  accumulatedContent += parsed.content;
                  
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantMessageId
                        ? { ...msg, content: accumulatedContent }
                        : msg
                    )
                  );
                }
              } catch (parseError) {
                // Ignore parsing errors for incomplete chunks
              }
            }
          }
        }
      } else {
        const data = await response.json();
        const responseMessage = data.message || "";
        
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? { ...msg, content: responseMessage }
              : msg
          )
        );
      }

      setIsLoading(false);
    } catch (error: any) {
      if (error.name === 'AbortError') {
        return;
      }
      
      setMessages((prev) => prev.filter((msg) => msg.id !== assistantMessageId));
      
      if (error.message.includes("Rate limit")) {
        toast({
          title: "Rate Limit Reached",
          description: "Too many requests. Please wait a moment before trying again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Connection Error",
          description: "Unable to reach AI Coach. Please try again in a moment.",
          variant: "destructive",
        });
      }
      
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");

    // Add user message with unique ID
    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        role: "user",
        content: userMessage,
      },
    ]);

    // Start streaming (no setTimeout needed with unique IDs)
    handleStreamingChat(userMessage);
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg hover-elevate active-elevate-2 flex items-center justify-center z-50 transition-all duration-200"
        data-testid="button-open-ai-coach"
        aria-label="Open AI Coach"
      >
        <MessageCircle className="h-6 w-6" />
      </button>
    );
  }

  return (
    <Card className="fixed bottom-6 right-6 w-[400px] h-[600px] shadow-2xl z-50 flex flex-col" data-testid="card-floating-coach">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 border-b">
        <CardTitle className="flex items-center gap-2 text-base">
          <MessageCircle className="h-5 w-5 text-primary" />
          AI Coach
        </CardTitle>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setIsOpen(false)}
            data-testid="button-close-ai-coach"
          >
            <Minimize2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => {
              setIsOpen(false);
              setMessages([]);
            }}
            data-testid="button-close-and-clear-ai-coach"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 space-y-4"
          data-testid="chat-messages-container"
        >
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              data-testid={`message-${message.role}`}
            >
              <div
                className={`max-w-[85%] rounded-lg p-3 ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start" data-testid="loading-indicator">
              <div className="bg-muted rounded-lg p-3">
                <div className="flex gap-1">
                  <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="border-t p-4">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything..."
              className="resize-none min-h-[50px] text-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              data-testid="input-floating-chat-message"
            />
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim() || isLoading}
              className="h-[50px] w-[50px] flex-shrink-0"
              data-testid="button-send-floating-message"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
          <p className="text-xs text-muted-foreground mt-2" data-testid="text-floating-hint">
            Press Enter to send • Powered by GPT-5
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
