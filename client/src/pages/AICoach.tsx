import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
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
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to get AI response");
      }
      
      const data = await response.json();
      return data.message;
    },
    onSuccess: (response, userMessage) => {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: response,
        },
      ]);
    },
    onError: (error: any) => {
      console.error("Chat error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to get AI response. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || chatMutation.isPending) return;

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

    chatMutation.mutate(userMessage);
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
            <h1 className="text-2xl font-bold">AI Coach</h1>
            <p className="text-sm text-muted-foreground">
              Get strategic guidance from your Digital Product Creator 2.0
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
                <h2 className="text-xl font-semibold mb-2" data-testid="text-welcome-title">Welcome to AI Coach</h2>
                <p className="text-muted-foreground max-w-md mb-6" data-testid="text-welcome-description">
                  I'm your Digital Product Creator 2.0 strategist. Ask me anything about:
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
            {chatMutation.isPending && (
              <div className="flex gap-3 justify-start" data-testid="indicator-thinking">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                </div>
                <Card className="p-4">
                  <p className="text-sm text-muted-foreground" data-testid="text-thinking">Thinking...</p>
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
            placeholder="Ask your AI coach anything about digital products..."
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
            disabled={!input.trim() || chatMutation.isPending}
            className="h-[60px] w-[60px]"
            data-testid="button-send-message"
          >
            <Send className="h-5 w-5" />
          </Button>
        </form>
        <p className="text-xs text-muted-foreground mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
