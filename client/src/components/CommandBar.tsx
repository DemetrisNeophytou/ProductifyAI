import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Home,
  Lightbulb,
  FileText,
  Rocket,
  BarChart3,
  MessageCircle,
  Palette,
  Users,
  Settings,
  Search,
  Sparkles,
} from "lucide-react";

interface CommandBarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const navigationItems = [
  { icon: Home, label: "Dashboard", url: "/dashboard", keywords: ["home", "main", "projects"] },
  { icon: Lightbulb, label: "Create Product", url: "/builders/idea-finder", keywords: ["idea", "new", "create", "product", "niche"] },
  { icon: FileText, label: "Content Studio", url: "/builders/content", keywords: ["write", "content", "writer", "templates"] },
  { icon: Rocket, label: "Launch & Sales", url: "/builders/funnel", keywords: ["funnel", "launch", "sales", "monetize"] },
  { icon: BarChart3, label: "Performance", url: "/analytics", keywords: ["analytics", "stats", "metrics", "performance"] },
  { icon: MessageCircle, label: "AI Coach", url: "/ai-coach", keywords: ["coach", "help", "assistant", "chat", "ai"] },
  { icon: Palette, label: "Brand Kit", url: "/brand-kit", keywords: ["brand", "assets", "colors", "logo"] },
  { icon: Users, label: "Community", url: "/community", keywords: ["community", "forum", "users"] },
  { icon: Settings, label: "Settings", url: "/settings", keywords: ["settings", "preferences", "account"] },
];

const aiActions = [
  { icon: Sparkles, label: "Generate new eBook idea", action: "idea-ebook", keywords: ["ebook", "book", "idea"] },
  { icon: Sparkles, label: "Generate new course idea", action: "idea-course", keywords: ["course", "training", "idea"] },
  { icon: Sparkles, label: "Ask AI Coach about pricing", action: "coach-pricing", keywords: ["pricing", "price", "money", "revenue"] },
  { icon: Sparkles, label: "Create product outline", action: "outline", keywords: ["outline", "structure", "plan"] },
  { icon: Sparkles, label: "Generate sales copy", action: "sales-copy", keywords: ["sales", "copy", "marketing"] },
];

export function CommandBar({ open, onOpenChange }: CommandBarProps) {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!open) {
      setSearch("");
    }
  }, [open]);

  const handleSelect = (callback: () => void) => {
    onOpenChange(false);
    callback();
  };

  const handleNavigation = (url: string) => {
    handleSelect(() => setLocation(url));
  };

  const handleAIAction = (action: string) => {
    handleSelect(() => {
      switch (action) {
        case "idea-ebook":
        case "idea-course":
          setLocation("/builders/idea-finder");
          break;
        case "coach-pricing":
          setLocation("/ai-coach");
          break;
        case "outline":
          setLocation("/builders/outline");
          break;
        case "sales-copy":
          setLocation("/builders/content");
          break;
      }
    });
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Type a command or search..."
        value={search}
        onValueChange={setSearch}
        data-testid="input-command-search"
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Navigation">
          {navigationItems.map((item) => (
            <CommandItem
              key={item.url}
              onSelect={() => handleNavigation(item.url)}
              data-testid={`command-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <item.icon className="mr-2 h-4 w-4" />
              <span>{item.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="AI Actions">
          {aiActions.map((item) => (
            <CommandItem
              key={item.action}
              onSelect={() => handleAIAction(item.action)}
              data-testid={`command-ai-${item.action}`}
            >
              <item.icon className="mr-2 h-4 w-4 text-primary" />
              <span>{item.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
