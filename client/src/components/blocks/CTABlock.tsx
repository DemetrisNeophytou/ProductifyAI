import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MousePointer } from "lucide-react";
import type { CTAContent } from "@shared/schema";

interface CTABlockProps {
  content: CTAContent;
  onChange: (content: CTAContent) => void;
}

export function CTABlock({ content, onChange }: CTABlockProps) {
  const handleTextChange = (text: string) => {
    onChange({ ...content, text });
  };

  const handleButtonTextChange = (buttonText: string) => {
    onChange({ ...content, buttonText });
  };

  const handleUrlChange = (buttonUrl: string) => {
    onChange({ ...content, buttonUrl });
  };

  return (
    <div className="space-y-3">
      <Input
        value={content.text}
        onChange={(e) => handleTextChange(e.target.value)}
        placeholder="CTA text (e.g., 'Ready to get started?')"
        data-testid="input-cta-text"
      />
      <Input
        value={content.buttonText}
        onChange={(e) => handleButtonTextChange(e.target.value)}
        placeholder="Button text"
        data-testid="input-cta-button-text"
      />
      <Input
        value={content.buttonUrl}
        onChange={(e) => handleUrlChange(e.target.value)}
        placeholder="Button URL"
        data-testid="input-cta-url"
      />
      
      <div className="p-6 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg text-center space-y-3">
        <p className="text-lg font-medium">{content.text || "Your CTA text here"}</p>
        <Button size="lg" data-testid="preview-cta-button">
          <MousePointer className="h-4 w-4 mr-2" />
          {content.buttonText || "Button Text"}
        </Button>
      </div>
    </div>
  );
}
