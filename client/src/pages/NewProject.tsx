import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, FileText, ListChecks, Sparkles, ArrowRight, GraduationCap, Wand2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { PRODUCT_TEMPLATES } from "@shared/templates";

const projectTypes = [
  {
    id: "ebook",
    name: "eBook",
    description: "Create a professional digital book",
    icon: BookOpen,
  },
  {
    id: "course",
    name: "Online Course",
    description: "Build a structured learning experience",
    icon: GraduationCap,
  },
  {
    id: "workbook",
    name: "Workbook",
    description: "Interactive worksheets and exercises",
    icon: FileText,
  },
  {
    id: "checklist",
    name: "Checklist",
    description: "Create actionable step-by-step guides",
    icon: ListChecks,
  },
  {
    id: "lead_magnet",
    name: "Lead Magnet",
    description: "Design compelling opt-in content",
    icon: Sparkles,
  },
];

export default function NewProject() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [creationMode, setCreationMode] = useState<"manual" | "ai">("ai");
  const [selectedType, setSelectedType] = useState<string>("ebook");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [title, setTitle] = useState("");
  
  // AI generation fields
  const [aiTitle, setAiTitle] = useState("");
  const [aiNiche, setAiNiche] = useState("");
  const [aiAudience, setAiAudience] = useState("");
  const [aiTone, setAiTone] = useState("professional");

  const availableTemplates = PRODUCT_TEMPLATES.filter(t => t.type === selectedType);

  const createMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/projects", {
        type: selectedType,
        title: title || `New ${projectTypes.find(t => t.id === selectedType)?.name}`,
        status: "draft",
        templateId: selectedTemplate || null,
      });
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: "Project created successfully!",
      });
      setLocation(`/projects/${data.id}`);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create project",
        variant: "destructive",
      });
    },
  });

  const aiGenerateMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/projects/generate-full", {
        title: aiTitle,
        niche: aiNiche,
        audience: aiAudience,
        tone: aiTone,
        type: "ebook",
      });
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: `Your ebook "${data.title}" has been generated with AI!`,
      });
      setLocation(`/projects/${data.id}`);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to generate ebook with AI",
        variant: "destructive",
      });
    },
  });

  const handleCreate = () => {
    if (creationMode === "ai") {
      if (!aiTitle || !aiNiche || !aiAudience) {
        toast({
          title: "Missing information",
          description: "Please fill in all required fields",
          variant: "destructive",
        });
        return;
      }
      aiGenerateMutation.mutate();
    } else {
      if (!selectedType) {
        toast({
          title: "Select a type",
          description: "Please select a project type to continue",
          variant: "destructive",
        });
        return;
      }
      createMutation.mutate();
    }
  };

  const isPending = creationMode === "ai" ? aiGenerateMutation.isPending : createMutation.isPending;

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-2">Create New Project</h1>
        <p className="text-muted-foreground">Choose how you want to create your digital product</p>
      </div>

      <Tabs value={creationMode} onValueChange={(v) => setCreationMode(v as "manual" | "ai")} className="space-y-6">
        <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
          <TabsTrigger value="ai" data-testid="tab-ai">
            <Wand2 className="mr-2 h-4 w-4" />
            AI-Powered
          </TabsTrigger>
          <TabsTrigger value="manual" data-testid="tab-manual">
            <FileText className="mr-2 h-4 w-4" />
            Manual
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ai" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Generate Complete Ebook with AI
              </CardTitle>
              <CardDescription>
                AI will create a complete ebook with introduction, 5 chapters, summary, and professional images
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ai-title">Ebook Title *</Label>
                <Input
                  id="ai-title"
                  data-testid="input-ai-title"
                  placeholder="e.g., The Ultimate Guide to Productivity"
                  value={aiTitle}
                  onChange={(e) => setAiTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ai-niche">Niche/Topic *</Label>
                <Textarea
                  id="ai-niche"
                  data-testid="input-ai-niche"
                  placeholder="e.g., Time management for busy professionals"
                  value={aiNiche}
                  onChange={(e) => setAiNiche(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ai-audience">Target Audience *</Label>
                <Input
                  id="ai-audience"
                  data-testid="input-ai-audience"
                  placeholder="e.g., Entrepreneurs, students, working parents"
                  value={aiAudience}
                  onChange={(e) => setAiAudience(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ai-tone">Tone</Label>
                <Select value={aiTone} onValueChange={setAiTone}>
                  <SelectTrigger id="ai-tone" data-testid="select-ai-tone">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="friendly">Friendly</SelectItem>
                    <SelectItem value="casual">Casual</SelectItem>
                    <SelectItem value="authoritative">Authoritative</SelectItem>
                    <SelectItem value="inspirational">Inspirational</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="bg-muted/50 p-4 rounded-md space-y-2">
                <p className="text-sm font-medium">What AI will create:</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Cover image with professional design</li>
                  <li>• Introduction (200-300 words)</li>
                  <li>• 5 chapters with detailed content (300-400 words each)</li>
                  <li>• Chapter images that match the content</li>
                  <li>• Summary section with key takeaways</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manual" className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Project Title (Optional)</Label>
            <Input
              id="title"
              data-testid="input-title"
              placeholder="Enter a title for your project..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-3">
            <Label>Select Project Type</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projectTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <Card
                    key={type.id}
                    className={`cursor-pointer transition-all hover-elevate ${
                      selectedType === type.id ? "ring-2 ring-primary" : ""
                    }`}
                    onClick={() => {
                      setSelectedType(type.id);
                      setSelectedTemplate("");
                    }}
                    data-testid={`card-type-${type.id}`}
                  >
                    <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
                      <Icon className="h-8 w-8 text-primary" />
                      <div className="flex-1">
                        <CardTitle className="text-lg">{type.name}</CardTitle>
                        <CardDescription className="mt-1">{type.description}</CardDescription>
                      </div>
                    </CardHeader>
                  </Card>
                );
              })}
            </div>
          </div>

          {selectedType && availableTemplates.length > 0 && (
            <div className="space-y-3">
              <Label>Choose a Template (Optional)</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card
                  className={`cursor-pointer transition-all hover-elevate ${
                    selectedTemplate === "" ? "ring-2 ring-primary" : ""
                  }`}
                  onClick={() => setSelectedTemplate("")}
                  data-testid="card-template-blank"
                >
                  <CardHeader className="space-y-0 pb-2">
                    <CardTitle className="text-lg">Start from Scratch</CardTitle>
                    <CardDescription className="mt-1">
                      Create your own structure
                    </CardDescription>
                  </CardHeader>
                </Card>
                {availableTemplates.map((template) => (
                  <Card
                    key={template.id}
                    className={`cursor-pointer transition-all hover-elevate ${
                      selectedTemplate === template.id ? "ring-2 ring-primary" : ""
                    }`}
                    onClick={() => setSelectedTemplate(template.id)}
                    data-testid={`card-template-${template.id}`}
                  >
                    <CardHeader className="space-y-0 pb-2">
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {template.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pb-4">
                      <p className="text-xs text-muted-foreground">
                        {template.sections.length} sections included
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => setLocation("/dashboard")}
            data-testid="button-cancel"
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={isPending || (creationMode === "manual" && !selectedType)}
            data-testid="button-create"
          >
            {isPending ? (
              creationMode === "ai" ? "Generating with AI..." : "Creating..."
            ) : (
              <>
                {creationMode === "ai" ? (
                  <>
                    <Wand2 className="mr-2 h-4 w-4" />
                    Generate with AI
                  </>
                ) : (
                  <>
                    Create Project
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </>
            )}
          </Button>
        </div>
      </Tabs>
    </div>
  );
}
