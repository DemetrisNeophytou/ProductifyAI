import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Sparkles, User, DollarSign, Target, Rocket, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export default function AICoach() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleStreamingChat = async (userMessage: string) => {
    setIsLoading(true);
    
    const assistantMessageId = Date.now().toString();
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
        body: JSON.stringify({ message: userMessage, stream: true }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to get AI response");
      }

      // Check if response is streaming (SSE) or regular JSON
      const contentType = response.headers.get('content-type');
      
      if (contentType?.includes('text/event-stream')) {
        // Handle streaming response
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
              }
            }
          }
        }
      } else {
        // Handle regular JSON response (fallback when streaming not available)
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
      console.error("Chat error:", error);
      
      setMessages((prev) => prev.filter((msg) => msg.id !== assistantMessageId));
      
      if (error.name !== 'AbortError') {
        const isConfigError = error.message?.includes("temporarily unavailable") || error.message?.includes("API");
        toast({
          title: isConfigError ? "Service Unavailable" : "Connection Error",
          description: error.message || "Unable to reach Productify Coach. Please try again in a moment.",
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

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        role: "user",
        content: userMessage,
      },
    ]);

    handleStreamingChat(userMessage);
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-4 border-b">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" data-testid="heading-coach-title">Productify Coach</h1>
            <p className="text-sm text-muted-foreground" data-testid="text-coach-subtitle">
              Specialized AI for Digital Products • Powered by GPT-5
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div ref={scrollRef} className="p-6 space-y-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center" data-testid="welcome-screen">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-xl font-semibold mb-2" data-testid="text-welcome-title">Welcome to Productify Coach</h2>
                <p className="text-muted-foreground max-w-md mb-2" data-testid="text-welcome-description">
                  Not generic ChatGPT. A specialized AI built exclusively for digital product creators.
                </p>
                <p className="text-xs text-muted-foreground max-w-md mb-6 font-semibold" data-testid="text-powered-by">
                  Powered by GPT-5
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl w-full">
                  <Card 
                    className="p-4 text-left hover-elevate cursor-pointer" 
                    onClick={() => setInput("What should I consider when pricing my first digital product?")}
                    data-testid="card-suggestion-pricing"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <DollarSign className="h-4 w-4 text-primary" />
                      <p className="text-sm font-medium">Pricing Strategy</p>
                    </div>
                    <p className="text-xs text-muted-foreground">How to price for profit</p>
                  </Card>
                  <Card 
                    className="p-4 text-left hover-elevate cursor-pointer" 
                    onClick={() => setInput("How do I identify my target audience for a course?")}
                    data-testid="card-suggestion-audience"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Target className="h-4 w-4 text-primary" />
                      <p className="text-sm font-medium">Target Audience</p>
                    </div>
                    <p className="text-xs text-muted-foreground">Find your ideal customers</p>
                  </Card>
                  <Card 
                    className="p-4 text-left hover-elevate cursor-pointer" 
                    onClick={() => setInput("What's the best way to launch a new digital product?")}
                    data-testid="card-suggestion-launch"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Rocket className="h-4 w-4 text-primary" />
                      <p className="text-sm font-medium">Launch Strategy</p>
                    </div>
                    <p className="text-xs text-muted-foreground">Plan your product launch</p>
                  </Card>
                  <Card 
                    className="p-4 text-left hover-elevate cursor-pointer" 
                    onClick={() => setInput("How can I create upsell opportunities?")}
                    data-testid="card-suggestion-upsell"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      <p className="text-sm font-medium">Upsell Funnels</p>
                    </div>
                    <p className="text-xs text-muted-foreground">Maximize revenue per customer</p>
                  </Card>
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                  data-testid={`message-${message.role}-${message.id}`}
                >
                  {message.role === "assistant" && (
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  <Card
                    className={`p-4 max-w-[80%] ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : ""
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap" data-testid={`text-message-content-${message.id}`}>
                      {message.content}
                      {message.role === "assistant" && !message.content && isLoading && (
                        <span className="inline-block w-2 h-4 bg-primary/50 animate-pulse ml-1" />
                      )}
                    </p>
                  </Card>
                  {message.role === "user" && (
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                </div>
              ))
            )}
            {isLoading && messages.length > 0 && messages[messages.length - 1].role === "user" && (
              <div className="flex gap-3 justify-start" data-testid="indicator-thinking">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                </div>
                <Card className="p-4">
                  <p className="text-sm text-muted-foreground" data-testid="text-thinking">
                    Thinking<span className="animate-pulse">...</span>
                  </p>
                </Card>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      <div className="p-6 border-t">
        <form onSubmit={handleSubmit} className="flex gap-3">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Productify Coach anything about creating and selling digital products..."
            className="resize-none min-h-[60px]"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            data-testid="input-chat-message"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || isLoading}
            className="h-[60px] w-[60px]"
            data-testid="button-send-message"
          >
            <Send className="h-5 w-5" />
          </Button>
        </form>
        <p className="text-xs text-muted-foreground mt-2" data-testid="text-input-hint">
          Press Enter to send • Powered by GPT-5 for ultra-fast, specialized guidance
        </p>
      </div>
    </div>
  );
}
