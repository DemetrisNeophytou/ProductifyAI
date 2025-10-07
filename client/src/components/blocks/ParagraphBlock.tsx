import { Textarea } from "@/components/ui/textarea";
import type { ParagraphContent } from "@shared/schema";

interface ParagraphBlockProps {
  content: ParagraphContent;
  onChange: (content: ParagraphContent) => void;
}

export function ParagraphBlock({ content, onChange }: ParagraphBlockProps) {
  const handleTextChange = (text: string) => {
    onChange({ text });
  };

  return (
    <div className="space-y-2">
      <Textarea
        value={content.text}
        onChange={(e) => handleTextChange(e.target.value)}
        placeholder="Write your paragraph here..."
        className="min-h-[100px] resize-none"
        data-testid="textarea-paragraph"
      />
      <p className="text-sm leading-relaxed whitespace-pre-wrap">
        {content.text || "Paragraph text will appear here"}
      </p>
    </div>
  );
}
