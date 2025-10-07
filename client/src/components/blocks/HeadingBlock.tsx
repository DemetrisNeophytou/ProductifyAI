import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { HeadingContent } from "@shared/schema";

interface HeadingBlockProps {
  content: HeadingContent;
  onChange: (content: HeadingContent) => void;
}

export function HeadingBlock({ content, onChange }: HeadingBlockProps) {
  const handleTextChange = (text: string) => {
    onChange({ ...content, text });
  };

  const handleLevelChange = (level: string) => {
    onChange({ ...content, level: parseInt(level) as 1 | 2 | 3 | 4 | 5 | 6 });
  };

  const HeadingTag = `h${content.level}` as keyof JSX.IntrinsicElements;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Select value={content.level.toString()} onValueChange={handleLevelChange}>
          <SelectTrigger className="w-24" data-testid="select-heading-level">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">H1</SelectItem>
            <SelectItem value="2">H2</SelectItem>
            <SelectItem value="3">H3</SelectItem>
            <SelectItem value="4">H4</SelectItem>
            <SelectItem value="5">H5</SelectItem>
            <SelectItem value="6">H6</SelectItem>
          </SelectContent>
        </Select>
        <Input
          value={content.text}
          onChange={(e) => handleTextChange(e.target.value)}
          placeholder="Heading text"
          className="flex-1"
          data-testid="input-heading-text"
        />
      </div>
      <HeadingTag className={`font-bold ${getHeadingSize(content.level)}`}>
        {content.text || "Heading"}
      </HeadingTag>
    </div>
  );
}

function getHeadingSize(level: number) {
  const sizes = {
    1: "text-4xl",
    2: "text-3xl",
    3: "text-2xl",
    4: "text-xl",
    5: "text-lg",
    6: "text-base",
  };
  return sizes[level as keyof typeof sizes] || "text-2xl";
}
