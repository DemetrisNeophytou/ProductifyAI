import { useEffect, useState } from "react";
import { StatsCard } from "@/components/StatsCard";
import { 
  Sparkles, 
  Download, 
  HardDrive, 
  Plus, 
  FileText, 
  BookOpen, 
  ListChecks, 
  Crown, 
  Zap, 
  ArrowRight, 
  Lightbulb, 
  DollarSign, 
  Rocket, 
  Target, 
  TrendingUp,
  LineChart,
  MessageSquare,
  Copy,
  Megaphone,
  CheckCircle2,
  Clock,
  Coins
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import type { Project } from "@shared/schema";
import { OnboardingModal } from "@/components/OnboardingModal";

const AI_AGENTS = [
  {
    id: "idea-finder",
    icon: Lightbulb,
    title: "Idea Finder",
    description: "AI analyzes markets and finds 5 validated €100k niches",
    outcome: "Profitable ideas in 5 mins",
    href: "/builders/idea-finder",
    badge: "Start Here",
    color: "text-yellow-500"
  },
  {
    id: "offer-crafter",
    icon: DollarSign,
    title: "Offer Crafter",
    description: "AI creates pricing, bonuses, and upsells for max revenue",
    outcome: "€47-€497 offer optimized",
    href: "/builders/offer",
    badge: "Revenue",
    color: "text-emerald-500"
  },
  {
    id: "content-writer",
    icon: FileText,
    title: "Content Writer",
    description: "AI generates professional content for chapters or lessons",
    outcome: "Ready-to-sell content fast",
    href: "/builders/content",
    badge: "Create",
    color: "text-green-500"
  },
  {
    id: "funnel-planner",
    icon: Rocket,
    title: "Funnel & Launch",
    description: "Smart AI plans and launches your funnel automatically",
    outcome: "€10k-€50k first 30 days",
    href: "/builders/funnel",
    badge: "Launch",
    color: "text-purple-500"
  },
  {
    id: "outline-builder",
    icon: ListChecks,
    title: "Outline Builder",
    description: "AI creates step-by-step outline for your product",
    outcome: "Complete outline in 10 mins",
    href: "/builders/outline",
    badge: "Structure",
    color: "text-blue-500"
  },
  {
    id: "ai-coach",
    icon: MessageSquare,
    title: "AI Coach",
    description: "Chat with your Personal AI Strategy Coach (7-step success framework)",
    outcome: "Expert guidance 24/7",
    href: "/ai-coach",
    badge: "Coach",
    color: "text-pink-500"
  },
  {
    id: "analytics-agent",
    icon: LineChart,
    title: "Analytics Agent",
    description: "Track performance and optimize for €100k+ revenue",
    outcome: "Data-driven decisions",
    href: "/dashboard",
    badge: "Optimize",
    color: "text-orange-500"
  }
];

export default function Dashboard() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding');
    if (!hasSeenOnboarding && isAuthenticated && !authLoading) {
      setShowOnboarding(true);
    }
  }, [isAuthenticated, authLoading]);

  const handleCloseOnboarding = () => {
    localStorage.setItem('hasSeenOnboarding', 'true');
    setShowOnboarding(false);
  };

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [isAuthenticated, authLoading, toast]);

  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
    enabled: isAuthenticated,
  });

  const { data: subscriptionStatus } = useQuery<{
    tier: 'free' | 'plus' | 'pro' | null;
    status: 'active' | 'canceled' | 'expired' | null;
    isOnTrial: boolean;
    trialEndsAt: string | null;
    daysRemaining: number;
  }>({
    queryKey: ["/api/subscription/status"],
    enabled: isAuthenticated,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/projects/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Project deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
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
      toast({
        title: "Error",
        description: "Failed to delete project.",
        variant: "destructive",
      });
    },
  });

  const getProjectIcon = (type: string) => {
    switch(type) {
      case 'ebook': return BookOpen;
      case 'course': return FileText;
      case 'checklist': return ListChecks;
      case 'template': return FileText;
      case 'lead_magnet': return Sparkles;
      default: return FileText;
    }
  };

  const getProjectTypeLabel = (type: string) => {
    switch(type) {
      case 'ebook': return 'eBook';
      case 'course': return 'Course';
      case 'checklist': return 'Checklist';
      case 'template': return 'Template';
      case 'lead_magnet': return 'Lead Magnet';
      default: return type;
    }
  };

  const recentProjects = projects.slice(0, 6);
  
  // Calculate total revenue potential from projects
  const totalRevenuePotential = projects.reduce((acc, project) => {
    const metadata = project.metadata as any;
    if (metadata?.offer?.core?.price) {
      return acc + (metadata.offer.core.price * 50); // Assume 50 sales potential
    }
    return acc + 5000; // Default €5k potential
  }, 0);

  if (authLoading || !isAuthenticated) {
    return (
      <div className="p-8 flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <OnboardingModal open={showOnboarding} onClose={handleCloseOnboarding} />
      
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold mb-2" data-testid="heading-dashboard-title">
            AI Mission Control
          </h1>
          <p className="text-lg text-muted-foreground" data-testid="text-dashboard-subtitle">
            Build your first €100k digital product brand with AI precision
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/onboarding">
            <Button size="lg" variant="outline" data-testid="button-onboarding">
              <Clock className="h-4 w-4 mr-2" />
              90-Second Setup
            </Button>
          </Link>
          <Link href="/ai-coach">
            <Button size="lg" data-testid="button-ai-coach">
              <Sparkles className="h-4 w-4 mr-2" />
              AI Coach
            </Button>
          </Link>
        </div>
      </div>

      {/* Revenue Tracker + Cost Savings */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20" data-testid="card-revenue-tracker">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Revenue Potential</CardTitle>
                  <Badge variant="outline" className="text-xs">Phase 4: Live Tracking</Badge>
                </div>
                <div className="text-3xl font-bold mt-1" data-testid="text-revenue-amount">
                  €{totalRevenuePotential.toLocaleString()}
                </div>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-500/20 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  {projects.length} {projects.length === 1 ? 'product' : 'products'} × €50-5k potential
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Real-time tracking activates after payment integration
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20" data-testid="card-cost-savings">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-medium text-muted-foreground">You Save vs Typical Tool Stack</CardTitle>
                <div className="text-3xl font-bold mt-1" data-testid="text-savings-amount">
                  €1,440<span className="text-lg text-muted-foreground">/quarter</span>
                </div>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                <Coins className="h-6 w-6 text-purple-500" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Productify AI Pro:</span>
                <span className="font-semibold">€59.99/quarter</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Other platforms:</span>
                <span className="font-semibold line-through text-destructive">€500+/quarter</span>
              </div>
              <div className="pt-2 border-t">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="font-medium text-green-600">88% cost reduction</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions Strip */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20" data-testid="card-quick-actions">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Quick Actions
          </CardTitle>
          <CardDescription>Launch new products or optimize existing ones</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Link href="/onboarding">
              <Button data-testid="button-quick-generate">
                <Plus className="h-4 w-4 mr-2" />
                Generate New Product
              </Button>
            </Link>
            <Button variant="outline" disabled data-testid="button-quick-clone">
              <Copy className="h-4 w-4 mr-2" />
              Clone Best Seller
              <Badge variant="secondary" className="ml-2">Soon</Badge>
            </Button>
            <Button variant="outline" disabled data-testid="button-quick-promo">
              <Megaphone className="h-4 w-4 mr-2" />
              Launch Promo
              <Badge variant="secondary" className="ml-2">Soon</Badge>
            </Button>
          </div>
        </CardContent>
      </Card>

      {subscriptionStatus?.isOnTrial && (
        <Card className="border-primary/20 bg-primary/5" data-testid="card-trial-status">
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <Sparkles className="h-6 w-6 text-primary mt-1" />
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <CardTitle className="text-xl">Free Trial Active</CardTitle>
                    <Badge variant="secondary" data-testid="badge-days-remaining">
                      {subscriptionStatus.daysRemaining} {subscriptionStatus.daysRemaining === 1 ? 'day' : 'days'} left
                    </Badge>
                  </div>
                  <CardDescription className="text-sm">
                    Full access to all 7 AI agents • No credit card • Cancel anytime
                  </CardDescription>
                </div>
              </div>
              <Link href="/pricing">
                <Button data-testid="button-view-plans">
                  View Plans
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardHeader>
        </Card>
      )}

      {subscriptionStatus?.tier === 'plus' && (
        <Card className="border-primary/20" data-testid="card-plus-status">
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <Zap className="h-6 w-6 text-primary mt-1" />
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <CardTitle className="text-xl">Plus Plan</CardTitle>
                    <Badge variant="secondary" data-testid="badge-plus-active">Active</Badge>
                  </div>
                  <CardDescription className="text-sm">
                    €24.99/month • 10 products • 20k AI tokens • All 7 AI Agents
                  </CardDescription>
                </div>
              </div>
              <div className="flex gap-2">
                <Link href="/pricing">
                  <Button variant="outline" data-testid="button-upgrade-to-pro">
                    <Crown className="mr-2 h-4 w-4" />
                    Upgrade to Pro
                  </Button>
                </Link>
                <Button variant="ghost" onClick={() => window.location.href = '/api/billing/portal'} data-testid="button-manage-billing">
                  Manage Billing
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>
      )}

      {subscriptionStatus?.tier === 'pro' && (
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10" data-testid="card-pro-status">
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <Crown className="h-6 w-6 text-primary mt-1" />
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <CardTitle className="text-xl">Pro Plan</CardTitle>
                    <Badge variant="default" data-testid="badge-pro-active">Active</Badge>
                  </div>
                  <CardDescription className="text-sm">
                    €59.99/3 months • Unlimited products • 100k tokens • Advanced strategies
                  </CardDescription>
                </div>
              </div>
              <Button variant="ghost" onClick={() => window.location.href = '/api/billing/portal'} data-testid="button-manage-billing-pro">
                Manage Billing
              </Button>
            </div>
          </CardHeader>
        </Card>
      )}

      {/* 7 AI Agents Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold" data-testid="heading-ai-agents">
            Your 7 AI Agents
          </h2>
          <Badge variant="outline" className="gap-1">
            <Sparkles className="h-3 w-3" />
            GPT-5 Powered
          </Badge>
        </div>
        <p className="text-muted-foreground mb-6" data-testid="text-agents-description">
          Not generic AI. Specialized agents that build €100k+ digital products for you.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {AI_AGENTS.map((agent) => {
            const Icon = agent.icon;
            return (
              <Link key={agent.id} href={agent.href}>
                <Card className="hover-elevate cursor-pointer h-full" data-testid={`card-agent-${agent.id}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className={`h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 ${agent.color}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <Badge variant="outline" className="text-xs" data-testid={`badge-${agent.id}`}>
                        {agent.badge}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg mt-3" data-testid={`title-${agent.id}`}>
                      {agent.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pb-4">
                    <p className="text-sm text-muted-foreground mb-3" data-testid={`description-${agent.id}`}>
                      {agent.description}
                    </p>
                    <div className="flex items-center gap-2 text-primary text-sm font-semibold">
                      <ArrowRight className="h-3 w-3" />
                      <span data-testid={`outcome-${agent.id}`}>{agent.outcome}</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {projects.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold" data-testid="heading-your-products">Your Products</h2>
            <Link href="/products">
              <Button variant="outline" data-testid="button-view-all-products">
                View All
              </Button>
            </Link>
          </div>
          {isLoading ? (
            <p className="text-muted-foreground">Loading products...</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentProjects.map((project) => {
                const Icon = getProjectIcon(project.type);
                return (
                  <Link key={project.id} href={`/projects/${project.id}`}>
                    <Card className="hover-elevate cursor-pointer" data-testid={`card-project-${project.id}`}>
                      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                        <CardTitle className="text-base font-semibold line-clamp-1">{project.title}</CardTitle>
                        <Icon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between gap-2">
                          <Badge variant="secondary" data-testid={`badge-type-${project.type}`}>
                            {getProjectTypeLabel(project.type)}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(project.createdAt!).toLocaleDateString()}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}

      {projects.length === 0 && (
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20" data-testid="card-get-started">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2" data-testid="heading-get-started">
              <Rocket className="h-5 w-5 text-primary" />
              Ready to Create Your €100k Product?
            </CardTitle>
            <CardDescription data-testid="text-get-started">
              Start with our 90-second onboarding or use the AI Idea Finder to discover profitable niches
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Link href="/onboarding">
                <Button data-testid="button-start-onboarding">
                  <Zap className="mr-2 h-4 w-4" />
                  90-Second Setup
                </Button>
              </Link>
              <Link href="/builders/idea-finder">
                <Button variant="outline" data-testid="button-start-idea-finder">
                  <Lightbulb className="mr-2 h-4 w-4" />
                  Find Profitable Ideas
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
