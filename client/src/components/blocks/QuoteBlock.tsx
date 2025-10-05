import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Quote as QuoteIcon } from "lucide-react";
import type { QuoteContent } from "@shared/schema";

interface QuoteBlockProps {
  content: QuoteContent;
  onChange: (content: QuoteContent) => void;
}

export function QuoteBlock({ content, onChange }: QuoteBlockProps) {
  const handleTextChange = (text: string) => {
    onChange({ ...content, text });
  };

  const handleAuthorChange = (author: string) => {
    onChange({ ...content, author });
  };

  return (
    <div className="space-y-3">
      <Textarea
        value={content.text}
        onChange={(e) => handleTextChange(e.target.value)}
        placeholder="Quote text"
        className="min-h-[80px] resize-none"
        data-testid="textarea-quote-text"
      />
      <Input
        value={content.author || ""}
        onChange={(e) => handleAuthorChange(e.target.value)}
        placeholder="Author (optional)"
        data-testid="input-quote-author"
      />

      <div className="border-l-4 border-primary pl-4 py-2 bg-muted/30 rounded-r-lg">
        <div className="flex items-start gap-3">
          <QuoteIcon className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
          <div className="flex-1">
            <p className="text-base italic leading-relaxed">
              "{content.text || "Your quote here"}"
            </p>
            {content.author && (
              <p className="text-sm text-muted-foreground mt-2">
                — {content.author}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
