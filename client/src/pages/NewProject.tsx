import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, FileText, ListChecks, Sparkles, ArrowRight, GraduationCap, Wand2, Mail, Share2, Globe, Loader2 } from "lucide-react";
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
    id: "workbook",
    name: "Workbook",
    description: "Interactive worksheets and exercises",
    icon: FileText,
  },
  {
    id: "course",
    name: "Course Script",
    description: "Build a structured learning experience",
    icon: GraduationCap,
  },
  {
    id: "landing",
    name: "Landing Page",
    description: "High-converting landing page content",
    icon: Globe,
  },
  {
    id: "emails",
    name: "Email Sequence",
    description: "5-part email nurture sequence",
    icon: Mail,
  },
  {
    id: "social",
    name: "Social Media Pack",
    description: "10 ready-to-post social media content pieces",
    icon: Share2,
  },
];

export default function NewProject() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [creationMode, setCreationMode] = useState<"manual" | "ai">("ai");
  const [selectedType, setSelectedType] = useState<string>("ebook");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [title, setTitle] = useState("");
  
  // AI Autopilot generation fields
  const [aiType, setAiType] = useState<string>("ebook");
  const [aiTopic, setAiTopic] = useState("");
  const [aiAudience, setAiAudience] = useState("");
  const [aiTone, setAiTone] = useState("professional");
  const [aiGoal, setAiGoal] = useState("");

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
      const response = await apiRequest("POST", "/api/projects/auto-generate", {
        type: aiType,
        topic: aiTopic,
        audience: aiAudience,
        tone: aiTone,
        goal: aiGoal,
      });
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: data.message || `Your ${aiType} has been generated successfully!`,
      });
      setLocation(`/projects/${data.project.id}`);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to generate product with AI",
        variant: "destructive",
      });
    },
  });

  const handleCreate = () => {
    if (creationMode === "ai") {
      if (!aiType || !aiTopic || !aiAudience || !aiGoal) {
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
  const selectedAiTypeInfo = projectTypes.find(t => t.id === aiType);

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-2">Create New Digital Product</h1>
        <p className="text-muted-foreground">AI will auto-generate complete, ready-to-sell content in 60 seconds</p>
      </div>

      <Tabs value={creationMode} onValueChange={(v) => setCreationMode(v as "manual" | "ai")} className="space-y-6">
        <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
          <TabsTrigger value="ai" data-testid="tab-ai">
            <Sparkles className="mr-2 h-4 w-4" />
            AI Autopilot
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
                <Wand2 className="h-5 w-5 text-primary" />
                AI Autopilot: Auto-Generate Complete Product
              </CardTitle>
              <CardDescription>
                Give us 4 inputs, and AI will create a complete, ready-to-sell digital product with full content, structure, and image prompts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ai-type">Product Type *</Label>
                <Select value={aiType} onValueChange={setAiType}>
                  <SelectTrigger id="ai-type" data-testid="select-ai-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {projectTypes.map(type => (
                      <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ai-topic">Topic/Title *</Label>
                <Input
                  id="ai-topic"
                  data-testid="input-ai-topic"
                  placeholder="e.g., Time Management for Busy Professionals"
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ai-audience">Target Audience *</Label>
                <Input
                  id="ai-audience"
                  data-testid="input-ai-audience"
                  placeholder="e.g., Entrepreneurs, freelancers, working parents"
                  value={aiAudience}
                  onChange={(e) => setAiAudience(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ai-tone">Tone of Voice *</Label>
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

              <div className="space-y-2">
                <Label htmlFor="ai-goal">Primary Goal *</Label>
                <Textarea
                  id="ai-goal"
                  data-testid="input-ai-goal"
                  placeholder="e.g., Help people save 10 hours per week through proven time management techniques"
                  value={aiGoal}
                  onChange={(e) => setAiGoal(e.target.value)}
                  rows={3}
                />
              </div>

              {isPending && (
                <div className="bg-primary/10 p-6 rounded-md space-y-3">
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    <p className="font-medium">Building your digital product...</p>
                  </div>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>✓ Generating outline with {aiType === 'emails' ? '5' : aiType === 'social' ? '10' : '8-12'} sections</p>
                    <p>✓ Writing 300-400 words per section</p>
                    <p>✓ Creating image prompts for visuals</p>
                    <p>✓ Applying brand styling</p>
                  </div>
                </div>
              )}

              {!isPending && (
                <div className="bg-muted/50 p-4 rounded-md space-y-2">
                  <p className="text-sm font-medium">AI will auto-create:</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {aiType === 'ebook' && (
                      <>
                        <li>• Complete outline with 8-10 chapters</li>
                        <li>• 300-400 words of content per chapter</li>
                        <li>• Professional image prompts for each section</li>
                        <li>• Brand colors and font selection</li>
                      </>
                    )}
                    {aiType === 'workbook' && (
                      <>
                        <li>• Interactive workbook with 8-10 sections</li>
                        <li>• Exercises, worksheets, and reflection prompts</li>
                        <li>• Actionable content (300-400 words each)</li>
                        <li>• Professional image prompts</li>
                      </>
                    )}
                    {aiType === 'course' && (
                      <>
                        <li>• Complete course outline with 10-12 lessons</li>
                        <li>• Learning objectives for each module</li>
                        <li>• 300-400 words of lesson content</li>
                        <li>• Visual aids and image prompts</li>
                      </>
                    )}
                    {aiType === 'landing' && (
                      <>
                        <li>• High-converting landing page structure</li>
                        <li>• Hero, problem, solution, benefits, features</li>
                        <li>• Testimonials, FAQ, and CTA sections</li>
                        <li>• Professional copy and image prompts</li>
                      </>
                    )}
                    {aiType === 'emails' && (
                      <>
                        <li>• 5-email nurture sequence</li>
                        <li>• Each email designed to educate and convert</li>
                        <li>• 300-400 words per email with compelling copy</li>
                        <li>• Subject lines and CTAs included</li>
                      </>
                    )}
                    {aiType === 'social' && (
                      <>
                        <li>• 10 ready-to-post social media pieces</li>
                        <li>• Mix of educational, inspirational, promotional</li>
                        <li>• Optimized for engagement</li>
                        <li>• Caption copy and image prompts</li>
                      </>
                    )}
                  </ul>
                </div>
              )}
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
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={isPending || (creationMode === "manual" && !selectedType)}
            data-testid="button-create"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {creationMode === "ai" ? "Generating..." : "Creating..."}
              </>
            ) : (
              <>
                {creationMode === "ai" ? (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
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
