import { useEffect, useState } from "react";
import { 
  Sparkles, 
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
  TrendingUp,
  LineChart,
  MessageSquare,
  CheckCircle2,
  Clock,
  Coins,
  BarChart3,
  PenTool,
  Target,
  Activity,
  Star
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

  // Calculate progress through the builder steps based on actual completion
  const totalSteps = 5; // Idea, Outline, Content, Offer, Launch
  let completedSteps = 0;
  
  // Check actual metadata for completion flags
  if (projects.length > 0) {
    const latestProject = projects[0];
    const metadata = latestProject.metadata as any;
    
    // Count completed steps based on metadata
    if (metadata?.idea) completedSteps++;
    if (metadata?.outline) completedSteps++;
    if (metadata?.content) completedSteps++;
    if (metadata?.offer) completedSteps++;
    if (metadata?.funnel) completedSteps++;
  }
  
  const progressPercentage = (completedSteps / totalSteps) * 100;

  // Build recent activity from actual project data
  const recentActivity: Array<{ id: number; action: string; time: string; icon: any }> = [];
  if (projects.length > 0) {
    projects.slice(0, 3).forEach((project, index) => {
      const timeSince = new Date().getTime() - new Date(project.createdAt!).getTime();
      const hoursAgo = Math.floor(timeSince / (1000 * 60 * 60));
      const timeStr = hoursAgo < 24 ? `${hoursAgo} hours ago` : `${Math.floor(hoursAgo / 24)} days ago`;
      
      recentActivity.push({
        id: index + 1,
        action: `Created "${project.title}"`,
        time: timeStr,
        icon: Plus
      });
    });
  }

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

      {/* Progress Tracker */}
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20" data-testid="card-progress-tracker">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Your Launch Progress
              </CardTitle>
              <CardDescription className="mt-1">
                {progressPercentage === 100 ? "Ready to launch your product!" : `${Math.round(progressPercentage)}% complete to your first €100k product`}
              </CardDescription>
            </div>
            <Badge variant="default" className="text-sm" data-testid="badge-progress">
              {completedSteps}/{totalSteps} Steps
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
              <div 
                className="bg-primary h-full transition-all duration-500 rounded-full"
                style={{ width: `${progressPercentage}%` }}
                data-testid="progress-bar"
              />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {(() => {
                const latestProject = projects.length > 0 ? projects[0] : null;
                const metadata = latestProject?.metadata as any;
                
                return [
                  { icon: Lightbulb, label: "Idea", complete: !!metadata?.idea },
                  { icon: ListChecks, label: "Outline", complete: !!metadata?.outline },
                  { icon: PenTool, label: "Content", complete: !!metadata?.content },
                  { icon: DollarSign, label: "Offer", complete: !!metadata?.offer },
                  { icon: Rocket, label: "Launch", complete: !!metadata?.funnel },
                ];
              })().map((step, index) => (
                <div
                  key={step.label}
                  className={`flex items-center gap-2 p-2 rounded-lg ${
                    step.complete ? "bg-green-500/10 border border-green-500/20" : "bg-muted"
                  }`}
                  data-testid={`step-${step.label.toLowerCase()}`}
                >
                  {step.complete ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <step.icon className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className={`text-xs font-medium ${step.complete ? "text-green-600" : "text-muted-foreground"}`}>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actionable Widgets */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="hover-elevate cursor-pointer bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20" data-testid="card-revenue-action">
          <Link href="/builders/offer">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    <CardTitle className="text-lg">Generate Offer to Validate Revenue</CardTitle>
                  </div>
                  <CardDescription>
                    Create optimized pricing and offers to maximize your €50k-€100k potential
                  </CardDescription>
                </div>
                <ArrowRight className="h-5 w-5 text-green-500 flex-shrink-0" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                  AI Powered
                </Badge>
                <Badge variant="outline">5 min setup</Badge>
              </div>
            </CardContent>
          </Link>
        </Card>

        <Card className="hover-elevate cursor-pointer bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20" data-testid="card-savings-action">
          <Link href="/pricing">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Coins className="h-5 w-5 text-purple-500" />
                    <CardTitle className="text-lg">Save €1,440 vs Typical Tools – Learn Why</CardTitle>
                  </div>
                  <CardDescription>
                    See how Productify AI replaces 7+ expensive tools with one AI platform
                  </CardDescription>
                </div>
                <ArrowRight className="h-5 w-5 text-purple-500 flex-shrink-0" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-purple-500/10 text-purple-600 border-purple-500/20">
                  88% Savings
                </Badge>
                <Badge variant="outline">Pro: €59.99/3mo</Badge>
              </div>
            </CardContent>
          </Link>
        </Card>
      </div>

      {/* Recent Activity + Quick Actions */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card data-testid="card-recent-activity">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Recent Activity
            </CardTitle>
            <CardDescription>Your latest actions and updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {projects.length > 0 ? (
                recentActivity.slice(0, 3).map((activity) => {
                  const Icon = activity.icon;
                  return (
                    <div key={activity.id} className="flex items-start gap-3 p-2 rounded-lg hover-elevate">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{activity.action}</p>
                        <p className="text-xs text-muted-foreground">{activity.time}</p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <p className="text-sm">No recent activity yet</p>
                  <p className="text-xs mt-1">Start creating your first product!</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20" data-testid="card-quick-actions">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Quick Actions
            </CardTitle>
            <CardDescription>Jump into building your next product</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Link href="/onboarding">
                <Button className="w-full justify-start" data-testid="button-quick-new-product">
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Product (90-sec Setup)
                </Button>
              </Link>
              <Link href="/builders/content">
                <Button variant="outline" className="w-full justify-start" data-testid="button-quick-content">
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Content
                </Button>
              </Link>
              <Link href="/analytics">
                <Button variant="outline" className="w-full justify-start" data-testid="button-quick-analytics">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  View Performance
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

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
