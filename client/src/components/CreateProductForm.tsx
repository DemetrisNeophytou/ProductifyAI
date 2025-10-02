import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

export function CreateProductForm() {
  const [prompt, setPrompt] = useState("");
  const [creativity, setCreativity] = useState([0.7]);
  const [length, setLength] = useState([500]);
  const [style, setStyle] = useState("professional");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = () => {
    setIsGenerating(true);
    console.log("Generating product", { prompt, creativity: creativity[0], length: length[0], style });
    setTimeout(() => setIsGenerating(false), 2000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Your Product</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="prompt">Describe what you want to create</Label>
          <Textarea
            id="prompt"
            placeholder="E.g., Create a professional email template for product launches..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="min-h-32 resize-none"
            data-testid="input-product-prompt"
          />
          <p className="text-xs text-muted-foreground">{prompt.length} / 1000 characters</p>
        </div>

        <div className="space-y-2">
          <Label>Creativity Level: {creativity[0].toFixed(1)}</Label>
          <Slider
            value={creativity}
            onValueChange={setCreativity}
            min={0}
            max={1}
            step={0.1}
            data-testid="slider-creativity"
          />
        </div>

        <div className="space-y-2">
          <Label>Length: {length[0]} words</Label>
          <Slider
            value={length}
            onValueChange={setLength}
            min={100}
            max={2000}
            step={100}
            data-testid="slider-length"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="style">Style</Label>
          <Select value={style} onValueChange={setStyle}>
            <SelectTrigger id="style" data-testid="select-style">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="professional">Professional</SelectItem>
              <SelectItem value="casual">Casual</SelectItem>
              <SelectItem value="creative">Creative</SelectItem>
              <SelectItem value="technical">Technical</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button 
          onClick={handleGenerate} 
          disabled={!prompt || isGenerating}
          className="w-full"
          data-testid="button-generate"
        >
          {isGenerating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {isGenerating ? "Generating..." : "Generate Product"}
        </Button>
      </CardContent>
    </Card>
  );
}
