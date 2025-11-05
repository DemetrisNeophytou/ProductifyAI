import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, ChevronLeft, ChevronRight, FileText, BookOpen, CheckSquare, Newspaper, Palette, FileSpreadsheet } from "lucide-react";

const productTypes = [
  {
    value: "ebook",
    icon: BookOpen,
    title: "eBook",
    description: "Create comprehensive digital books with chapters and sections",
  },
  {
    value: "course",
    icon: FileText,
    title: "Online Course",
    description: "Build structured learning experiences with lessons and modules",
  },
  {
    value: "checklist",
    icon: CheckSquare,
    title: "Checklist",
    description: "Design actionable checklists and step-by-step guides",
  },
  {
    value: "leadmagnet",
    icon: Newspaper,
    title: "Lead Magnet",
    description: "Create valuable freebies to grow your email list",
  },
  {
    value: "workbook",
    icon: FileSpreadsheet,
    title: "Workbook",
    description: "Build interactive workbooks with exercises and worksheets",
  },
  {
    value: "template",
    icon: Palette,
    title: "Template",
    description: "Design reusable templates for various purposes",
  },
];

interface WizardState {
  type: string;
  title: string;
  niche: string;
  audience: string;
  goal: string;
  tone: string;
  templateId?: string;
}

const STORAGE_KEY = "productify_wizard_state";

export default function WizardCreateProduct() {
  const [currentStep, setCurrentStep] = useState(1);
  const [wizardState, setWizardState] = useState<WizardState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {
      type: "",
      title: "",
      niche: "",
      audience: "",
      goal: "",
      tone: "professional",
    };
  });
  
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please log in to create products",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [isAuthenticated, authLoading, toast]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(wizardState));
  }, [wizardState]);

  const createProjectMutation = useMutation({
    mutationFn: async () => {
      const projectData = {
        type: wizardState.type,
        title: wizardState.title,
        status: "draft" as const,
        metadata: {
          niche: wizardState.niche,
          goal: wizardState.goal,
          audience: wizardState.audience,
          tone: wizardState.tone,
        },
        templateId: wizardState.templateId,
      };

      const response = await apiRequest("POST", "/api/projects", projectData);
      return await response.json();
    },
    onSuccess: (project) => {
      toast({
        title: "Project Created!",
        description: "Your product has been created successfully",
      });
      localStorage.removeItem(STORAGE_KEY);
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      setLocation(`/projects/${project.id}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create project",
        variant: "destructive",
      });
    },
  });

  const updateState = (updates: Partial<WizardState>) => {
    setWizardState((prev) => ({ ...prev, ...updates }));
  };

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    } else {
      createProjectMutation.mutate();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return wizardState.type !== "";
      case 2:
        return wizardState.title !== "";
      case 3:
        return wizardState.niche !== "" && wizardState.audience !== "";
      case 4:
        return true;
      default:
        return false;
    }
  };

  if (authLoading || !isAuthenticated) {
    return (
      <div className="p-8 flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const steps = [
    { number: 1, title: "Product Type" },
    { number: 2, title: "Basic Info" },
    { number: 3, title: "Details" },
    { number: 4, title: "Review" },
  ];

  return (
    <div className="bg-background">
      <div className="max-w-5xl mx-auto p-8 space-y-8">
        <div className="flex items-center justify-between mb-12">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                    step.number < currentStep
                      ? "bg-primary border-primary text-primary-foreground"
                      : step.number === currentStep
                      ? "bg-primary border-primary text-primary-foreground"
                      : "bg-background border-muted-foreground/30 text-muted-foreground"
                  }`}
                  data-testid={`step-indicator-${step.number}`}
                >
                  {step.number < currentStep ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <span className="font-semibold">{step.number}</span>
                  )}
                </div>
                <span
                  className={`mt-2 text-sm font-medium ${
                    step.number <= currentStep
                      ? "text-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  {step.title}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`h-0.5 flex-1 mx-4 transition-colors ${
                    step.number < currentStep
                      ? "bg-primary"
                      : "bg-muted-foreground/30"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <Card>
          <CardContent className="p-8">
            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-3xl font-bold mb-2">Choose Your Product Type</h2>
                  <p className="text-muted-foreground">
                    Select the type of digital product you want to create
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {productTypes.map((type) => {
                    const Icon = type.icon;
                    const isSelected = wizardState.type === type.value;
                    return (
                      <button
                        key={type.value}
                        onClick={() => updateState({ type: type.value })}
                        className={`p-6 rounded-xl border-2 text-left transition-all hover-elevate active-elevate-2 ${
                          isSelected
                            ? "border-primary bg-primary/5"
                            : "border-border bg-card"
                        }`}
                        data-testid={`product-type-${type.value}`}
                      >
                        <Icon className={`w-10 h-10 mb-3 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                        <h3 className="font-semibold mb-1">{type.title}</h3>
                        <p className="text-sm text-muted-foreground">{type.description}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-3xl font-bold mb-2">Basic Information</h2>
                  <p className="text-muted-foreground">
                    Give your product a title and set the tone
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Product Title</Label>
                    <Input
                      id="title"
                      placeholder="e.g., The Ultimate Guide to..."
                      value={wizardState.title}
                      onChange={(e) => updateState({ title: e.target.value })}
                      data-testid="input-title"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tone">Tone of Voice</Label>
                    <Select value={wizardState.tone} onValueChange={(value) => updateState({ tone: value })}>
                      <SelectTrigger id="tone" data-testid="select-tone">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="professional">Professional</SelectItem>
                        <SelectItem value="casual">Casual & Friendly</SelectItem>
                        <SelectItem value="inspirational">Inspirational</SelectItem>
                        <SelectItem value="educational">Educational</SelectItem>
                        <SelectItem value="conversational">Conversational</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-3xl font-bold mb-2">Tell Us More</h2>
                  <p className="text-muted-foreground">
                    Help us understand your product better
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="niche">Niche/Industry</Label>
                    <Input
                      id="niche"
                      placeholder="e.g., Digital Marketing, Health & Fitness..."
                      value={wizardState.niche}
                      onChange={(e) => updateState({ niche: e.target.value })}
                      data-testid="input-niche"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="audience">Target Audience</Label>
                    <Input
                      id="audience"
                      placeholder="e.g., Beginner entrepreneurs, busy professionals..."
                      value={wizardState.audience}
                      onChange={(e) => updateState({ audience: e.target.value })}
                      data-testid="input-audience"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="goal">Main Goal</Label>
                    <Textarea
                      id="goal"
                      placeholder="What should this product help people achieve?"
                      value={wizardState.goal}
                      onChange={(e) => updateState({ goal: e.target.value })}
                      className="min-h-24 resize-none"
                      data-testid="input-goal"
                    />
                  </div>
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-3xl font-bold mb-2">Review & Create</h2>
                  <p className="text-muted-foreground">
                    Double-check your information before creating
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Product Type</p>
                      <p className="font-semibold" data-testid="review-type">
                        {productTypes.find((t) => t.value === wizardState.type)?.title}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Tone</p>
                      <p className="font-semibold capitalize" data-testid="review-tone">{wizardState.tone}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Title</p>
                    <p className="font-semibold" data-testid="review-title">{wizardState.title}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Niche</p>
                    <p className="font-semibold" data-testid="review-niche">{wizardState.niche}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Target Audience</p>
                    <p className="font-semibold" data-testid="review-audience">{wizardState.audience}</p>
                  </div>
                  {wizardState.goal && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Main Goal</p>
                      <p className="font-semibold" data-testid="review-goal">{wizardState.goal}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1}
            data-testid="button-back"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button
            onClick={handleNext}
            disabled={!canProceed() || createProjectMutation.isPending}
            data-testid="button-next"
          >
            {currentStep === 4 ? (
              createProjectMutation.isPending ? "Creating..." : "Create Product"
            ) : (
              <>
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
