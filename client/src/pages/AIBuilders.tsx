import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lightbulb, TrendingUp, FileText, Rocket, LineChart, Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";

interface Builder {
  id: string;
  type: "product_idea" | "market_research" | "content_plan" | "launch_strategy" | "scale_blueprint";
  title: string;
  description: string;
  icon: typeof Lightbulb;
  color: string;
  benefits: string[];
}

const builders: Builder[] = [
  {
    id: "product_idea",
    type: "product_idea",
    title: "Product Idea Validator",
    description: "Validate €100k+ digital product ideas using Iman Gadzhi's 7-filter framework",
    icon: Lightbulb,
    color: "text-yellow-500",
    benefits: [
      "Pain • Money • Access • Speed analysis",
      "Market demand validation",
      "Revenue projections",
    ],
  },
  {
    id: "market_research",
    type: "market_research",
    title: "Market Research Pro",
    description: "Deep market analysis for digital products with customer avatars",
    icon: TrendingUp,
    color: "text-blue-500",
    benefits: [
      "Target audience psychographics",
      "Competitor analysis",
      "Customer journey maps",
    ],
  },
  {
    id: "content_plan",
    type: "content_plan",
    title: "Content Planner",
    description: "Design comprehensive content strategies with learning objectives",
    icon: FileText,
    color: "text-purple-500",
    benefits: [
      "Chapter & module structure",
      "Learning objectives",
      "Content delivery planning",
    ],
  },
  {
    id: "launch_strategy",
    type: "launch_strategy",
    title: "Launch Strategist",
    description: "Create €100k+ product launches with email sequences and campaigns",
    icon: Rocket,
    color: "text-red-500",
    benefits: [
      "Pre-launch to post-launch timelines",
      "Email automation sequences",
      "Conversion optimization",
    ],
  },
  {
    id: "scale_blueprint",
    type: "scale_blueprint",
    title: "Scale Blueprint",
    description: "Build growth systems with funnels, upsells, and automation",
    icon: LineChart,
    color: "text-green-500",
    benefits: [
      "Automated sales funnels",
      "Upsell & cross-sell strategies",
      "Affiliate programs",
    ],
  },
];

export default function AIBuilders() {
  const [, setLocation] = useLocation();

  const { data: sessions = [] } = useQuery<any[]>({
    queryKey: ["/api/ai/sessions"],
  });

  const getBuilderSessions = (builderType: string) => {
    return sessions.filter((s: any) => s.builderType === builderType);
  };

  const startNewSession = (builderType: string, title: string) => {
    setLocation(`/builders/chat?type=${builderType}&new=true&title=${encodeURIComponent(title)}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-8">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-3" data-testid="heading-ai-builders">
            AI Mission Control
          </h1>
          <p className="text-xl text-muted-foreground">
            5 GPT-5 powered AI builders to create €100k+ digital products
          </p>
        </div>

        {/* Builders Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {builders.map((builder) => {
            const Icon = builder.icon;
            const builderSessions = getBuilderSessions(builder.type);
            
            return (
              <Card 
                key={builder.id} 
                className="hover-elevate transition-all"
                data-testid={`card-builder-${builder.type}`}
              >
                <CardHeader>
                  <div className="flex items-start gap-4 mb-2">
                    <div className={`p-3 rounded-lg bg-muted ${builder.color}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-xl mb-2">{builder.title}</CardTitle>
                      <CardDescription className="text-sm">
                        {builder.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Benefits */}
                  <ul className="space-y-2">
                    {builder.benefits.map((benefit, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-primary mt-0.5">✓</span>
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Sessions count */}
                  {builderSessions.length > 0 && (
                    <div className="text-sm text-muted-foreground pt-2 border-t">
                      {builderSessions.length} active {builderSessions.length === 1 ? 'session' : 'sessions'}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      className="flex-1"
                      onClick={() => startNewSession(builder.type, builder.title)}
                      data-testid={`button-start-${builder.type}`}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      New Session
                    </Button>
                    {builderSessions.length > 0 && (
                      <Button
                        variant="outline"
                        onClick={() => setLocation(`/builders/chat?type=${builder.type}`)}
                        data-testid={`button-view-sessions-${builder.type}`}
                      >
                        View
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 p-8 bg-muted/50 rounded-lg border">
          <h2 className="text-2xl font-bold mb-3">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            <div>
              <div className="text-4xl font-bold text-primary mb-2">1</div>
              <h3 className="font-semibold mb-1">Choose Your Builder</h3>
              <p className="text-sm text-muted-foreground">
                Select the AI builder that matches your current goal
              </p>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">2</div>
              <h3 className="font-semibold mb-1">Chat & Collaborate</h3>
              <p className="text-sm text-muted-foreground">
                Have a conversation with GPT-5 powered AI
              </p>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">3</div>
              <h3 className="font-semibold mb-1">Export & Execute</h3>
              <p className="text-sm text-muted-foreground">
                Get actionable deliverables you can implement immediately
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
