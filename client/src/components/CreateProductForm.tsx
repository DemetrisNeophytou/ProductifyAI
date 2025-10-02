import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { Product } from "@shared/schema";

interface CreateProductFormProps {
  productType: string;
  onProductGenerated?: (product: Product) => void;
}

export function CreateProductForm({ productType, onProductGenerated }: CreateProductFormProps) {
  const [prompt, setPrompt] = useState("");
  const [creativity, setCreativity] = useState([0.7]);
  const [length, setLength] = useState([500]);
  const [style, setStyle] = useState("professional");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const generateMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/products/generate", {
        prompt,
        type: productType,
        creativity: creativity[0],
        length: length[0],
        style,
      });
      return await response.json();
    },
    onSuccess: (product) => {
      toast({
        title: "Success!",
        description: "Your product has been generated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      onProductGenerated?.(product);
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      
      // Check for quota exceeded error - error message format is "429: {json response}"
      if (error.message.includes("429") || error.message.toLowerCase().includes("quota")) {
        toast({
          title: "AI Quota Exceeded",
          description: "The OpenAI API quota has been exceeded. Please add credits to your OpenAI account.",
          variant: "destructive",
        });
        return;
      }
      
      // Extract message from error if it's in the format "status: message"
      const errorText = error.message.includes(":") 
        ? error.message.split(":").slice(1).join(":").trim()
        : error.message;
      
      toast({
        title: "Error",
        description: errorText || "Failed to generate product. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleGenerate = () => {
    if (!prompt) return;
    generateMutation.mutate();
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
          disabled={!prompt || generateMutation.isPending}
          className="w-full"
          data-testid="button-generate"
        >
          {generateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {generateMutation.isPending ? "Generating..." : "Generate Product"}
        </Button>
      </CardContent>
    </Card>
  );
}
