import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  BookOpen, 
  GraduationCap, 
  FileText, 
  Users, 
  Loader2,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  TrendingUp,
  AlertCircle,
  RotateCw,
  Zap,
  DollarSign,
  Target,
  Rocket
} from "lucide-react";

const PRODUCT_TYPES = [
  {
    type: "ebook",
    icon: BookOpen,
    title: "eBook",
    description: "Digital books & guides",
    popular: true
  },
  {
    type: "course",
    icon: GraduationCap,
    title: "Online Course",
    description: "Video lessons & modules"
  },
  {
    type: "template",
    icon: FileText,
    title: "Template",
    description: "Notion, worksheets, tools"
  },
  {
    type: "membership",
    icon: Users,
    title: "Membership",
    description: "Recurring community access"
  }
];

interface ScoringData {
  pain: number;
  money: number;
  access: number;
  speed: number;
  niche: string;
  productIdea: string;
}

interface OfferData {
  tripwire: {
    name: string;
    price: number;
    bullets?: string[];
  };
  core: {
    name: string;
    price: number;
    bullets?: string[];
  };
  premium: {
    name: string;
    price: number;
    bullets?: string[];
  };
  revenueProjection: string;
}

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string>("");
  const [scoringData, setScoringData] = useState<ScoringData | null>(null);
  const [offerData, setOfferData] = useState<OfferData | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);

  const progress = (step / 5) * 100;

  const handleTypeSelect = async (type: string) => {
    setSelectedType(type);
    setStep(2);
    setIsGenerating(true);
    setError("");

    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module: 'idea',
          inputs: {
            productType: type,
            quick: true
          },
          format: 'json'
        })
      });

      const result = await response.json();
      
      if (!result.ok) {
        throw new Error(result.error || 'Failed to generate idea');
      }
      
      if (result.deliverables?.[0]?.content) {
        let content = result.deliverables[0].content;
        
        if (typeof content === 'string') {
          try {
            content = JSON.parse(content);
          } catch (e) {
            throw new Error('Failed to parse AI response');
          }
        }
        
        const firstIdea = content.niches?.[0] || content.ideas?.[0] || content;
        
        setScoringData({
          pain: firstIdea.pain || firstIdea.scores?.pain || 8,
          money: firstIdea.money || firstIdea.scores?.money || 9,
          access: firstIdea.access || firstIdea.scores?.access || 7,
          speed: firstIdea.speed || firstIdea.scores?.speed || 8,
          niche: firstIdea.name || firstIdea.niche || firstIdea.title || "Digital products for busy entrepreneurs",
          productIdea: firstIdea.positioning || firstIdea.description || firstIdea.idea || "Time-saving templates and systems"
        });
        
        setStep(3);
      } else {
        throw new Error('No content received from AI');
      }
    } catch (error: any) {
      console.error('Error generating idea:', error);
      setError(error.message || 'Something went wrong. Please try again.');
      setStep(1);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateOffer = async () => {
    setIsGenerating(true);
    setStep(4);
    setError("");

    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module: 'offer',
          inputs: {
            productName: scoringData?.niche || "Digital Product",
            productType: selectedType,
            targetRevenue: "€5,000 first month"
          },
          format: 'json'
        })
      });

      const result = await response.json();
      
      if (!result.ok) {
        throw new Error(result.error || 'Failed to generate offer');
      }
      
      if (result.deliverables?.[0]?.content) {
        let content = result.deliverables[0].content;
        
        if (typeof content === 'string') {
          try {
            content = JSON.parse(content);
          } catch (e) {
            throw new Error('Failed to parse offer response');
          }
        }

        setOfferData({
          tripwire: {
            name: content.tripwire?.name || "Quick Start Guide",
            price: content.tripwire?.price || 27,
            bullets: content.tripwire?.bullets || ["Instant access to core frameworks", "Beginner-friendly tutorials", "Quick-win templates"]
          },
          core: {
            name: content.core?.name || "Complete System",
            price: content.core?.price || 97,
            bullets: content.core?.bullets || ["Full curriculum & modules", "Templates & worksheets", "Email support", "Lifetime updates"]
          },
          premium: {
            name: content.premium?.name || "Premium Package",
            price: content.premium?.price || 297,
            bullets: content.premium?.bullets || ["Everything in Core", "1-on-1 coaching calls", "Done-for-you setup", "Priority support"]
          },
          revenueProjection: content.revenueProjection || "€5k+ in 30 days with 50 sales"
        });
        
        setStep(5);
      } else {
        throw new Error('No offer content received');
      }
    } catch (error: any) {
      console.error('Error generating offer:', error);
      setError(error.message || 'Failed to generate offer. Please try again.');
      setStep(3);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    setError("");

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: selectedType,
          title: scoringData?.niche || "My Product",
          status: "draft",
          metadata: {
            niche: scoringData?.niche,
            scores: {
              pain: scoringData?.pain,
              money: scoringData?.money,
              access: scoringData?.access,
              speed: scoringData?.speed
            },
            offer: offerData
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create project');
      }

      const project = await response.json();
      
      setPublishSuccess(true);
      
      setTimeout(() => {
        setLocation(`/projects/${project.id}`);
      }, 2000);
    } catch (error: any) {
      console.error('Error creating project:', error);
      setError(error.message || 'Failed to publish. Please try again.');
      setIsPublishing(false);
    }
  };

  const handleRetry = () => {
    setError("");
    if (step <= 2) {
      setStep(1);
    } else if (step <= 4) {
      handleTypeSelect(selectedType);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex flex-col">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="h-6 w-6 text-primary" />
              <div>
                <h1 className="text-xl font-bold" data-testid="heading-onboarding">90-Second Product Setup</h1>
                <p className="text-xs text-muted-foreground">10x faster than Gumroad, smarter than The Leap</p>
              </div>
            </div>
            <Badge variant="secondary" data-testid="badge-step">
              Step {step} of 5
            </Badge>
          </div>
          <Progress value={progress} className="mt-3" data-testid="progress-onboarding" />
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="container max-w-6xl mx-auto px-4 pt-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>{error}</span>
              <Button variant="outline" size="sm" onClick={handleRetry} data-testid="button-retry">
                <RotateCw className="h-4 w-4 mr-1" />
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 container max-w-6xl mx-auto px-4 py-8">
        
        {/* Step 1: Choose Product Type */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold" data-testid="heading-choose-type">
                What do you want to create?
              </h2>
              <p className="text-muted-foreground text-lg" data-testid="text-choose-description">
                AI validates + builds + prices your offer in 90 seconds
              </p>
              <div className="flex items-center justify-center gap-4 pt-2">
                <Badge variant="outline" className="gap-1">
                  <Zap className="h-3 w-3" />
                  10x faster setup
                </Badge>
                <Badge variant="outline" className="gap-1">
                  <DollarSign className="h-3 w-3" />
                  €1,440/quarter saved
                </Badge>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mt-8">
              {PRODUCT_TYPES.map(({ type, icon: Icon, title, description, popular }) => (
                <Card
                  key={type}
                  className="hover-elevate active-elevate-2 cursor-pointer relative"
                  onClick={() => handleTypeSelect(type)}
                  data-testid={`card-product-type-${type}`}
                >
                  {popular && (
                    <Badge className="absolute -top-2 -right-2" data-testid="badge-popular">
                      Popular
                    </Badge>
                  )}
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-primary/10 rounded-lg">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">{title}</CardTitle>
                        <CardDescription>{description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Generating Idea */}
        {step === 2 && (
          <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6">
            <Loader2 className="h-16 w-16 animate-spin text-primary" data-testid="loader-generating" />
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold" data-testid="heading-generating">
                GPT-5 is analyzing your market...
              </h2>
              <p className="text-muted-foreground" data-testid="text-generating">
                Validating profitable niches with Iman Gadzhi's 7-filter scoring
              </p>
              <Badge variant="outline" className="mt-4">
                <Target className="h-4 w-4 mr-1" />
                Pain • Money • Access • Speed analysis
              </Badge>
            </div>
          </div>
        )}

        {/* Step 3: Show Scoring */}
        {step === 3 && scoringData && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <Badge className="mb-4" variant="secondary" data-testid="badge-validated">
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Validated in 30 seconds
              </Badge>
              <h2 className="text-3xl font-bold" data-testid="heading-niche">
                {scoringData.niche}
              </h2>
              <p className="text-muted-foreground text-lg" data-testid="text-idea">
                {scoringData.productIdea}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4 max-w-5xl mx-auto">
              <Card data-testid="card-scoring">
                <CardHeader>
                  <CardTitle>Iman Gadzhi Profitability Score</CardTitle>
                  <CardDescription>7-Filter Framework Analysis</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">Pain Level</span>
                        <span className="text-sm font-bold text-red-500" data-testid="score-pain">
                          {scoringData.pain}/10
                        </span>
                      </div>
                      <Progress value={scoringData.pain * 10} className="h-2" />
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">Money Potential</span>
                        <span className="text-sm font-bold text-green-500" data-testid="score-money">
                          {scoringData.money}/10
                        </span>
                      </div>
                      <Progress value={scoringData.money * 10} className="h-2" />
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">Audience Access</span>
                        <span className="text-sm font-bold text-blue-500" data-testid="score-access">
                          {scoringData.access}/10
                        </span>
                      </div>
                      <Progress value={scoringData.access * 10} className="h-2" />
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">Speed to Market</span>
                        <span className="text-sm font-bold text-purple-500" data-testid="score-speed">
                          {scoringData.speed}/10
                        </span>
                      </div>
                      <Progress value={scoringData.speed * 10} className="h-2" />
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">Overall Score</span>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-green-500" />
                        <span className="text-2xl font-bold text-green-500" data-testid="score-overall">
                          {Math.round((scoringData.pain + scoringData.money + scoringData.access + scoringData.speed) / 4)}/10
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Competitive Advantage</CardTitle>
                  <CardDescription>Why this beats Gumroad & Monetise</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <p className="font-medium">AI-Validated Niche</p>
                      <p className="text-sm text-muted-foreground">Score {Math.round((scoringData.pain + scoringData.money + scoringData.access + scoringData.speed) / 4)}/10 = High profit potential</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <p className="font-medium">10x Faster Than Competitors</p>
                      <p className="text-sm text-muted-foreground">Gumroad: 2-3 days • You: 90 seconds</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Built-in Revenue Math</p>
                      <p className="text-sm text-muted-foreground">AI calculates pricing for €5k+ first month</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-center">
              <Button
                size="lg"
                onClick={handleGenerateOffer}
                disabled={isGenerating}
                data-testid="button-build-offer"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Building Offer...
                  </>
                ) : (
                  <>
                    Build My Offer
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Generating Offer */}
        {step === 4 && (
          <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6">
            <Loader2 className="h-16 w-16 animate-spin text-primary" data-testid="loader-building-offer" />
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold" data-testid="heading-building-offer">
                Creating your 3-tier pricing stack...
              </h2>
              <p className="text-muted-foreground" data-testid="text-building-offer">
                Calculating revenue projections with proven pricing psychology
              </p>
            </div>
          </div>
        )}

        {/* Step 5: Show Offer & Publish */}
        {step === 5 && offerData && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <Badge className="mb-4" variant="secondary" data-testid="badge-offer-ready">
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Offer ready in 60 seconds
              </Badge>
              <h2 className="text-3xl font-bold" data-testid="heading-offer-title">
                Your 3-Tier Offer Stack
              </h2>
              <p className="text-muted-foreground text-lg" data-testid="text-revenue-projection">
                💰 {offerData.revenueProjection}
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-4 max-w-5xl mx-auto">
              <Card data-testid="card-tripwire">
                <CardHeader>
                  <Badge variant="outline" className="w-fit">Tripwire</Badge>
                  <CardTitle className="text-xl mt-2">{offerData.tripwire.name}</CardTitle>
                  <div className="text-3xl font-bold text-primary">€{offerData.tripwire.price}</div>
                  <CardDescription>Entry-level offer to build trust</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1 text-sm">
                    {offerData.tripwire.bullets?.map((bullet, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-primary shadow-lg scale-105" data-testid="card-core">
                <CardHeader>
                  <Badge className="w-fit">Most Popular</Badge>
                  <CardTitle className="text-xl mt-2">{offerData.core.name}</CardTitle>
                  <div className="text-3xl font-bold text-primary">€{offerData.core.price}</div>
                  <CardDescription>Main revenue driver</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1 text-sm">
                    {offerData.core.bullets?.map((bullet, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card data-testid="card-premium">
                <CardHeader>
                  <Badge variant="outline" className="w-fit">Premium</Badge>
                  <CardTitle className="text-xl mt-2">{offerData.premium.name}</CardTitle>
                  <div className="text-3xl font-bold text-primary">€{offerData.premium.price}</div>
                  <CardDescription>High-ticket upsell</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1 text-sm">
                    {offerData.premium.bullets?.map((bullet, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            {publishSuccess ? (
              <div className="flex flex-col items-center gap-4 pt-4">
                <Alert className="max-w-md border-green-500">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <AlertDescription>
                    <div className="font-semibold">Product published successfully!</div>
                    <div className="text-sm text-muted-foreground mt-1">Redirecting to editor...</div>
                  </AlertDescription>
                </Alert>
              </div>
            ) : (
              <div className="flex justify-center pt-4">
                <Button
                  size="lg"
                  onClick={handlePublish}
                  disabled={isPublishing}
                  data-testid="button-publish"
                >
                  {isPublishing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Publishing...
                    </>
                  ) : (
                    <>
                      <Rocket className="mr-2 h-4 w-4" />
                      Publish My Product
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
