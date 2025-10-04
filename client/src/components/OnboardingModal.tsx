import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Lightbulb, Rocket, ArrowRight, CheckCircle2 } from "lucide-react";
import { useLocation } from "wouter";

interface OnboardingModalProps {
  open: boolean;
  onClose: () => void;
}

const steps = [
  {
    title: "Welcome to Productify AI",
    description: "Build your first €100k digital product in 90 seconds with GPT-5 powered AI",
    icon: Sparkles,
    features: [
      "5 AI Builders guide you step-by-step",
      "Auto-generate pricing, funnels & content",
      "Stripe payments integrated automatically"
    ]
  },
  {
    title: "Start with an Idea",
    description: "Not sure what to build? Our AI Idea Finder discovers profitable niches in seconds",
    icon: Lightbulb,
    features: [
      "AI analyzes market demand & competition",
      "7-step profitability scoring system",
      "Validated ideas ready to launch"
    ]
  },
  {
    title: "Ready to Launch?",
    description: "Click 'Create New Product' anytime to start your 90-second setup",
    icon: Rocket,
    features: [
      "AI builds your complete product flow",
      "Payment processing ready instantly",
      "Launch to customers in minutes"
    ]
  }
];

export function OnboardingModal({ open, onClose }: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (open) {
      setCurrentStep(0);
    }
  }, [open]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
      setLocation('/onboarding');
    }
  };

  const handleSkip = () => {
    onClose();
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      return;
    }
  };

  const currentStepData = steps[currentStep];
  const Icon = currentStepData.icon;
  const isLastStep = currentStep === steps.length - 1;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange} modal>
      <DialogContent className="sm:max-w-2xl" data-testid="dialog-onboarding">
        <DialogHeader>
          <div className="flex items-center justify-between mb-2">
            <Badge variant="secondary" data-testid="badge-step">
              Step {currentStep + 1} of {steps.length}
            </Badge>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleSkip}
              data-testid="button-skip"
            >
              Skip Tour
            </Button>
          </div>
          <div className="flex items-center gap-4 mb-4">
            <div className="p-4 bg-primary/10 rounded-xl">
              <Icon className="h-8 w-8 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-2xl mb-1" data-testid="heading-step-title">
                {currentStepData.title}
              </DialogTitle>
              <DialogDescription className="text-base" data-testid="text-step-description">
                {currentStepData.description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Card className="border-2">
          <CardContent className="pt-6">
            <div className="space-y-4">
              {currentStepData.features.map((feature, index) => (
                <div key={index} className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm" data-testid={`text-feature-${index}`}>{feature}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between gap-4 pt-4">
          <div className="flex gap-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-2 rounded-full transition-all ${
                  index === currentStep
                    ? "w-8 bg-primary"
                    : index < currentStep
                    ? "w-2 bg-primary/50"
                    : "w-2 bg-muted"
                }`}
                data-testid={`indicator-${index}`}
              />
            ))}
          </div>

          <div className="flex gap-2">
            <Button 
              size="lg" 
              onClick={handleNext}
              data-testid={isLastStep ? "button-start" : "button-next"}
            >
              {isLastStep ? (
                <>
                  <Rocket className="mr-2 h-4 w-4" />
                  Create My First Product
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
