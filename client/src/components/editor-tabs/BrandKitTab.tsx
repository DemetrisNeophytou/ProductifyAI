import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Save, Palette, Loader2, Image as ImageIcon } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface GoogleFont {
  family: string;
  category: string;
  variants: string[];
}

const defaultColors = ["#8B5CF6", "#EC4899", "#F59E0B"];

interface BrandKit {
  logoUrl?: string;
  fonts: {
    heading: string;
    body: string;
  };
  colors: string[];
}

interface BrandKitTabProps {
  projectId: string;
  currentBrandKit?: BrandKit;
  onChange?: (brandKit: BrandKit) => void;
}

export function BrandKitTab({ projectId, currentBrandKit, onChange }: BrandKitTabProps) {
  const { toast } = useToast();
  const [headingFont, setHeadingFont] = useState(currentBrandKit?.fonts.heading || "Inter");
  const [bodyFont, setBodyFont] = useState(currentBrandKit?.fonts.body || "Open Sans");
  const [colors, setColors] = useState<string[]>(currentBrandKit?.colors || defaultColors);
  const [logoUrl, setLogoUrl] = useState<string>("");

  const { data: googleFontsData, isLoading: isFontsLoading } = useQuery<{ items: GoogleFont[]; source: string }>({
    queryKey: ["/api/fonts/google"],
    staleTime: 1000 * 60 * 60 * 24, // Cache for 24 hours
  });

  const popularFonts = googleFontsData?.items.map((font) => font.family) || [
    "Inter", "Roboto", "Open Sans", "Lato", "Montserrat", "Poppins"
  ];

  useEffect(() => {
    if (currentBrandKit) {
      setHeadingFont(currentBrandKit.fonts.heading);
      setBodyFont(currentBrandKit.fonts.body);
      setColors(currentBrandKit.colors);
      setLogoUrl(currentBrandKit.logoUrl || "");
    }
  }, [currentBrandKit]);

  const handleColorChange = (index: number, value: string) => {
    const newColors = [...colors];
    newColors[index] = value;
    setColors(newColors);
  };

  const applyBrandKitMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/brand/apply", {
        projectId,
        colors,
        fonts: {
          heading: headingFont,
          body: bodyFont,
        },
        logoUrl: logoUrl || undefined,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to apply brand kit");
      }

      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "Brand kit applied!",
        description: `Updated ${data.sectionsUpdated} sections with your brand styling.`,
      });

      // Call onChange callback if provided
      if (onChange) {
        onChange({
          logoUrl: logoUrl || undefined,
          fonts: { heading: headingFont, body: bodyFont },
          colors,
        });
      }

      // Invalidate project sections to refresh UI
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "sections"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to apply brand kit",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    applyBrandKitMutation.mutate();
  };

  const loadGoogleFont = (fontName: string) => {
    const link = document.createElement("link");
    link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(/ /g, "+")}:wght@400;700&display=swap`;
    link.rel = "stylesheet";
    document.head.appendChild(link);
  };

  useEffect(() => {
    loadGoogleFont(headingFont);
    loadGoogleFont(bodyFont);
  }, [headingFont, bodyFont]);

  if (isFontsLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
          <p className="text-sm text-muted-foreground">Loading fonts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Label htmlFor="logo-url">Brand Logo (Optional)</Label>
        <Input
          id="logo-url"
          type="url"
          placeholder="https://example.com/logo.png"
          value={logoUrl}
          onChange={(e) => setLogoUrl(e.target.value)}
          data-testid="input-logo-url"
        />
        {logoUrl && (
          <Card className="p-4">
            <p className="text-xs text-muted-foreground mb-2">Logo Preview:</p>
            <div className="flex items-center justify-center bg-muted rounded-lg p-4">
              <img
                src={logoUrl}
                alt="Brand logo"
                className="max-h-20 max-w-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
                data-testid="preview-logo"
              />
            </div>
          </Card>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="heading-font">Heading Font</Label>
          <Select value={headingFont} onValueChange={setHeadingFont}>
            <SelectTrigger id="heading-font" data-testid="select-heading-font">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {popularFonts.map((font) => (
                <SelectItem key={font} value={font}>
                  <span style={{ fontFamily: font }}>{font}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Card className="mt-2 p-4">
            <p
              className="text-2xl font-bold"
              style={{ fontFamily: headingFont }}
              data-testid="preview-heading-font"
            >
              The quick brown fox
            </p>
          </Card>
        </div>

        <div>
          <Label htmlFor="body-font">Body Font</Label>
          <Select value={bodyFont} onValueChange={setBodyFont}>
            <SelectTrigger id="body-font" data-testid="select-body-font">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {popularFonts.map((font) => (
                <SelectItem key={font} value={font}>
                  <span style={{ fontFamily: font }}>{font}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Card className="mt-2 p-4">
            <p
              className="text-sm"
              style={{ fontFamily: bodyFont }}
              data-testid="preview-body-font"
            >
              The quick brown fox jumps over the lazy dog. This is how your body text will appear in your product.
            </p>
          </Card>
        </div>
      </div>

      <div className="space-y-3">
        <Label>Brand Colors</Label>
        <div className="space-y-2">
          {colors.map((color, index) => (
            <div key={index} className="flex gap-2 items-center">
              <Label className="w-20 text-sm text-muted-foreground">
                {index === 0 ? "Primary" : index === 1 ? "Accent" : "Background"}
              </Label>
              <Input
                type="color"
                value={color}
                onChange={(e) => handleColorChange(index, e.target.value)}
                className="h-10 cursor-pointer flex-1"
                data-testid={`input-color-${index}`}
              />
              <Badge
                variant="outline"
                className="w-20 text-xs font-mono"
                style={{ backgroundColor: color, color: index === 2 ? "#000" : "#fff" }}
              >
                {color}
              </Badge>
            </div>
          ))}
        </div>

        <Card className="p-4 space-y-2">
          <p className="text-xs text-muted-foreground">Preview</p>
          <div className="flex gap-2">
            {colors.map((color, index) => (
              <div
                key={index}
                className="h-12 flex-1 rounded-md"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </Card>
      </div>

      <Button 
        onClick={handleSave} 
        className="w-full gap-2" 
        disabled={applyBrandKitMutation.isPending}
        data-testid="button-save-brand-kit"
      >
        {applyBrandKitMutation.isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Applying...
          </>
        ) : (
          <>
            <Save className="h-4 w-4" />
            Apply Brand Kit
          </>
        )}
      </Button>

      <div className="text-xs text-muted-foreground border-t pt-3">
        <p className="flex items-center gap-1">
          <Palette className="h-3 w-3" />
          {googleFontsData?.source === "api" 
            ? `${popularFonts.length}+ fonts from Google Fonts - Free for commercial use`
            : "Curated fonts from Google Fonts - Free for commercial use"
          }
        </p>
      </div>
    </div>
  );
}
