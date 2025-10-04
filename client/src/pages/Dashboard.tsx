import { useEffect } from "react";
import { StatsCard } from "@/components/StatsCard";
import { Sparkles, Download, HardDrive, Plus, FileText, BookOpen, ListChecks, Crown, Zap, ArrowRight, Lightbulb, DollarSign, Rocket, Target, TrendingUp } from "lucide-react";
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
import { WelcomeDialog } from "@/components/WelcomeDialog";

const quickActions = [
  {
    id: "idea-finder",
    icon: Lightbulb,
    title: "Find Profitable Ideas",
    description: "AI analyzes your interests and finds 5 validated niches with €10k-€100k potential",
    outcome: "Get profitable ideas in 5 mins",
    href: "/builders/idea-finder",
    badge: "Start Here",
    color: "text-yellow-500"
  },
  {
    id: "outline-builder",
    icon: ListChecks,
    title: "Build Product Outline",
    description: "AI creates step-by-step outline for your eBook, course, or template",
    outcome: "Complete outline in 10 mins",
    href: "/builders/outline",
    badge: "Step 2",
    color: "text-blue-500"
  },
  {
    id: "content-writer",
    icon: FileText,
    title: "Write Content",
    description: "AI generates professional content for your product chapters or lessons",
    outcome: "Ready-to-sell content fast",
    href: "/builders/content",
    badge: "Step 3",
    color: "text-green-500"
  },
  {
    id: "offer-builder",
    icon: DollarSign,
    title: "Design Your Offer",
    description: "AI creates pricing, bonuses, and upsells to maximize revenue",
    outcome: "€47-€497 offer optimized",
    href: "/builders/offer",
    badge: "Step 4",
    color: "text-emerald-500"
  },
  {
    id: "funnel-planner",
    icon: Rocket,
    title: "Launch Plan",
    description: "AI builds complete funnel and launch roadmap to get your first sales",
    outcome: "€10k-€50k first 30 days",
    href: "/builders/funnel",
    badge: "Step 5",
    color: "text-purple-500"
  },
];

export default function Dashboard() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  if (authLoading || !isAuthenticated) {
    return (
      <div className="p-8 flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <WelcomeDialog />
      
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold mb-2" data-testid="heading-dashboard-title">
            Your €100k Journey Starts Here
          </h1>
          <p className="text-lg text-muted-foreground" data-testid="text-dashboard-subtitle">
            Follow the 5-step system: Idea → Outline → Content → Offer → Launch
          </p>
        </div>
        <Link href="/ai-coach">
          <Button size="lg" data-testid="button-ai-coach">
            <Sparkles className="h-4 w-4 mr-2" />
            Talk to AI Coach
          </Button>
        </Link>
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
                    Full access to all specialized AI builders • No credit card • Cancel anytime
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
                    €24.99/month • 10 products • 20k AI tokens • Core Builders
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

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold" data-testid="heading-quick-actions">
            AI Builders - Your Path to €100k/Year
          </h2>
        </div>
        <p className="text-muted-foreground mb-6" data-testid="text-builders-description">
          Not generic AI advice. Specialized tools that build complete digital products for you.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.id} href={action.href}>
                <Card className="hover-elevate cursor-pointer h-full" data-testid={`card-action-${action.id}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className={`h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 ${action.color}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <Badge variant="outline" className="text-xs" data-testid={`badge-${action.id}`}>
                        {action.badge}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg mt-3" data-testid={`title-${action.id}`}>
                      {action.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pb-4">
                    <p className="text-sm text-muted-foreground mb-3" data-testid={`description-${action.id}`}>
                      {action.description}
                    </p>
                    <div className="flex items-center gap-2 text-primary text-sm font-semibold">
                      <ArrowRight className="h-3 w-3" />
                      <span data-testid={`outcome-${action.id}`}>{action.outcome}</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard
          icon={Sparkles}
          label="Products Created"
          value={projects.length}
        />
        <StatsCard
          icon={Target}
          label="Ideas Validated"
          value="0"
        />
        <StatsCard
          icon={TrendingUp}
          label="Revenue Potential"
          value="€0"
        />
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

      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20" data-testid="card-next-step">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2" data-testid="heading-next-step">
            <Rocket className="h-5 w-5 text-primary" />
            Your Next Step
          </CardTitle>
          <CardDescription data-testid="text-next-step">
            {projects.length === 0 
              ? "Start with AI Idea Finder to discover 5 profitable niches you can dominate"
              : "Continue building your products or talk to AI Coach for personalized guidance"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            {projects.length === 0 ? (
              <Link href="/builders/idea-finder">
                <Button data-testid="button-next-step-action">
                  <Lightbulb className="mr-2 h-4 w-4" />
                  Find Profitable Ideas
                </Button>
              </Link>
            ) : (
              <Link href="/ai-coach">
                <Button data-testid="button-next-step-coach">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Get AI Guidance
                </Button>
              </Link>
            )}
            <Link href="/community">
              <Button variant="outline" data-testid="button-join-community">
                Join Community
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
