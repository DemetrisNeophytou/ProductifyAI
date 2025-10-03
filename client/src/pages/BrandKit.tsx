import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Palette, Type, Mic, Upload, Save } from "lucide-react";
import type { BrandKit as BrandKitType } from "@shared/schema";

const fontOptions = [
  { value: "Inter", label: "Inter" },
  { value: "Roboto", label: "Roboto" },
  { value: "Open Sans", label: "Open Sans" },
  { value: "Lato", label: "Lato" },
  { value: "Montserrat", label: "Montserrat" },
  { value: "Poppins", label: "Poppins" },
  { value: "Raleway", label: "Raleway" },
  { value: "Merriweather", label: "Merriweather" },
  { value: "Playfair Display", label: "Playfair Display" },
  { value: "Georgia", label: "Georgia" },
];

const toneOptions = [
  { value: "professional", label: "Professional", description: "Formal, authoritative, business-oriented" },
  { value: "casual", label: "Casual", description: "Relaxed, conversational, approachable" },
  { value: "friendly", label: "Friendly", description: "Warm, personable, enthusiastic" },
  { value: "educational", label: "Educational", description: "Informative, clear, instructional" },
  { value: "inspirational", label: "Inspirational", description: "Motivating, uplifting, encouraging" },
  { value: "humorous", label: "Humorous", description: "Witty, entertaining, light-hearted" },
];

export default function BrandKit() {
  const { toast } = useToast();

  const { data: brandKit, isLoading } = useQuery<BrandKitType>({
    queryKey: ["/api/brand-kit"],
  });

  const [logoUrl, setLogoUrl] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#8B5CF6");
  const [secondaryColor, setSecondaryColor] = useState("#EC4899");
  const [headingFont, setHeadingFont] = useState("Poppins");
  const [bodyFont, setBodyFont] = useState("Inter");
  const [accentFont, setAccentFont] = useState("Montserrat");
  const [toneOfVoice, setToneOfVoice] = useState("professional");

  useEffect(() => {
    if (brandKit) {
      setLogoUrl(brandKit.logoUrl ?? "");
      setPrimaryColor(brandKit.primaryColor ?? "#8B5CF6");
      setSecondaryColor(brandKit.secondaryColor ?? "#EC4899");
      
      const fonts = brandKit.fonts as { heading?: string; body?: string; accent?: string } | null;
      setHeadingFont(fonts?.heading ?? "Poppins");
      setBodyFont(fonts?.body ?? "Inter");
      setAccentFont(fonts?.accent ?? "Montserrat");
      
      setToneOfVoice(brandKit.toneOfVoice ?? "professional");
    }
  }, [brandKit]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/brand-kit", {
        logoUrl: logoUrl || null,
        primaryColor,
        secondaryColor,
        fonts: {
          heading: headingFont,
          body: bodyFont,
          accent: accentFont,
        },
        toneOfVoice,
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/brand-kit"] });
      toast({
        title: "Brand kit saved",
        description: "Your brand preferences have been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save brand kit. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    saveMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="text-muted-foreground">Loading brand kit...</div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-2" data-testid="heading-brand-kit">Brand Kit</h1>
        <p className="text-muted-foreground">
          Customize your brand identity to create consistent, professional digital products
        </p>
      </div>

      <div className="grid gap-6">
        {/* Logo Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Brand Logo
            </CardTitle>
            <CardDescription>Upload your logo to appear on your digital products</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="logoUrl">Logo URL (File upload coming in Phase 6)</Label>
              <Input
                id="logoUrl"
                data-testid="input-logo-url"
                placeholder="https://example.com/logo.png"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
              />
              {logoUrl && (
                <div className="mt-4 p-4 border rounded-lg">
                  <img
                    src={logoUrl}
                    alt="Brand logo preview"
                    className="max-h-24 object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Colors Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Brand Colors
            </CardTitle>
            <CardDescription>Choose colors that represent your brand identity</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="primaryColor">Primary Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="primaryColor"
                    type="color"
                    data-testid="input-primary-color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-20 h-10 cursor-pointer"
                  />
                  <Input
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    placeholder="#000000"
                    className="flex-1"
                    data-testid="input-primary-color-text"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="secondaryColor">Secondary Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="secondaryColor"
                    type="color"
                    data-testid="input-secondary-color"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="w-20 h-10 cursor-pointer"
                  />
                  <Input
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    placeholder="#000000"
                    className="flex-1"
                    data-testid="input-secondary-color-text"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Typography Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Type className="h-5 w-5" />
              Typography
            </CardTitle>
            <CardDescription>Select fonts for different text elements in your products</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="headingFont">Heading Font</Label>
                <Select value={headingFont} onValueChange={setHeadingFont}>
                  <SelectTrigger id="headingFont" data-testid="select-heading-font">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {fontOptions.map((font) => (
                      <SelectItem key={font.value} value={font.value}>
                        {font.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bodyFont">Body Font</Label>
                <Select value={bodyFont} onValueChange={setBodyFont}>
                  <SelectTrigger id="bodyFont" data-testid="select-body-font">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {fontOptions.map((font) => (
                      <SelectItem key={font.value} value={font.value}>
                        {font.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="accentFont">Accent Font</Label>
                <Select value={accentFont} onValueChange={setAccentFont}>
                  <SelectTrigger id="accentFont" data-testid="select-accent-font">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {fontOptions.map((font) => (
                      <SelectItem key={font.value} value={font.value}>
                        {font.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tone of Voice Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mic className="h-5 w-5" />
              Tone of Voice
            </CardTitle>
            <CardDescription>
              Define the personality and style of your content for AI generation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {toneOptions.map((tone) => (
                <Card
                  key={tone.value}
                  className={`cursor-pointer transition-all hover-elevate ${
                    toneOfVoice === tone.value ? "ring-2 ring-primary" : ""
                  }`}
                  onClick={() => setToneOfVoice(tone.value)}
                  data-testid={`card-tone-${tone.value}`}
                >
                  <CardHeader className="py-3">
                    <div className="flex items-start gap-3">
                      <div
                        className={`mt-1 h-4 w-4 rounded-full border-2 ${
                          toneOfVoice === tone.value
                            ? "border-primary bg-primary"
                            : "border-muted-foreground"
                        }`}
                      />
                      <div className="flex-1">
                        <CardTitle className="text-base">{tone.label}</CardTitle>
                        <CardDescription className="mt-1">{tone.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end gap-3">
          <Button
            onClick={handleSave}
            disabled={saveMutation.isPending}
            size="lg"
            data-testid="button-save-brand-kit"
          >
            {saveMutation.isPending ? (
              "Saving..."
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Brand Kit
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
