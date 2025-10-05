import { useEffect, useState } from "react";
import { 
  Sparkles, 
  Plus, 
  ArrowRight, 
  Lightbulb, 
  MessageSquare,
  FileText,
  TrendingUp,
  Download,
  Eye,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import type { Project } from "@shared/schema";
import { OnboardingModal } from "@/components/OnboardingModal";

export default function Dashboard() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
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

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
    enabled: isAuthenticated,
  });

  const { data: analytics } = useQuery<{
    totalEvents: number;
    views: number;
    exports: number;
    aiGenerations: number;
  }>({
    queryKey: ["/api/analytics/summary"],
    enabled: isAuthenticated,
  });

  // Get the most recent project
  const lastProject = projects.length > 0 ? projects[0] : null;
  
  // Calculate simple progress
  const totalSteps = 5;
  let completedSteps = 0;
  
  if (lastProject) {
    const metadata = lastProject.metadata as any;
    if (metadata?.idea) completedSteps++;
    if (metadata?.outline) completedSteps++;
    if (metadata?.content) completedSteps++;
    if (metadata?.offer) completedSteps++;
    if (metadata?.funnel) completedSteps++;
  }

  if (authLoading || !isAuthenticated) {
    return (
      <div className="p-8 flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      <OnboardingModal open={showOnboarding} onClose={handleCloseOnboarding} />
      
      {/* Welcome Section */}
      <div className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-bold" data-testid="heading-dashboard-title">
          Welcome back, {(user as any)?.email?.split('@')[0] || 'Creator'}
        </h1>
        <p className="text-base md:text-lg text-muted-foreground" data-testid="text-dashboard-subtitle">
          {lastProject 
            ? "Ready to continue your journey" 
            : "Let's create your first digital product"
          }
        </p>
      </div>

      {/* Continue or Create CTA */}
      {lastProject ? (
        <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20 hover-elevate cursor-pointer" data-testid="card-continue-project">
          <Link href={`/projects/${lastProject.id}/edit`}>
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <CardTitle className="text-xl mb-1">Continue your last project</CardTitle>
                  <CardDescription className="text-base">
                    "{lastProject.title}"
                  </CardDescription>
                </div>
                <ArrowRight className="h-5 w-5 text-primary flex-shrink-0" />
              </div>
            </CardHeader>
          </Link>
        </Card>
      ) : (
        <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20 hover-elevate cursor-pointer" data-testid="card-create-first">
          <Link href="/create">
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <CardTitle className="text-xl mb-1">Create your first product</CardTitle>
                  <CardDescription className="text-base">
                    Start with AI-powered templates in minutes
                  </CardDescription>
                </div>
                <Plus className="h-6 w-6 text-primary flex-shrink-0" />
              </div>
            </CardHeader>
          </Link>
        </Card>
      )}

      {/* 2️⃣ Quick Progress Tracker (compact) */}
      {projects.length > 0 && (
        <Card data-testid="card-progress-tracker">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Progress Tracker</CardTitle>
              <span className="text-sm text-muted-foreground" data-testid="text-progress-steps">
                {completedSteps}/{totalSteps} Steps
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-primary h-full transition-all duration-500 rounded-full"
                  style={{ width: `${(completedSteps / totalSteps) * 100}%` }}
                  data-testid="progress-bar"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                {completedSteps === 0 && "Just getting started - let's build your outline!"}
                {completedSteps > 0 && completedSteps < totalSteps && `${totalSteps - completedSteps} steps remaining - you're making great progress!`}
                {completedSteps === totalSteps && "Ready to launch! All steps completed."}
              </p>
              {completedSteps < totalSteps && (
                <Link href="/create">
                  <Button size="sm" variant="outline" className="w-full" data-testid="button-continue-progress">
                    Continue <ArrowRight className="h-3 w-3 ml-2" />
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 3️⃣ Insights Section (compact Week at a Glance) */}
      <Card data-testid="card-insights">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Week at a Glance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center space-y-1" data-testid="stat-projects">
              <div className="text-2xl font-bold">{projects.length}</div>
              <div className="text-xs text-muted-foreground">Projects</div>
            </div>
            <div className="text-center space-y-1" data-testid="stat-views">
              <div className="text-2xl font-bold flex items-center justify-center gap-1">
                <Eye className="h-4 w-4 text-muted-foreground" />
                {analytics?.views || 0}
              </div>
              <div className="text-xs text-muted-foreground">Views</div>
            </div>
            <div className="text-center space-y-1" data-testid="stat-exports">
              <div className="text-2xl font-bold flex items-center justify-center gap-1">
                <Download className="h-4 w-4 text-muted-foreground" />
                {analytics?.exports || 0}
              </div>
              <div className="text-xs text-muted-foreground">Exports</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions / AI Tools (3 main buttons) */}
      <Card data-testid="card-quick-actions">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            <Button asChild className="w-full justify-start h-auto py-3" data-testid="button-create-product">
              <Link href="/create">
                <div className="flex items-center gap-3 w-full">
                  <div className="h-10 w-10 rounded-lg bg-primary-foreground/10 flex items-center justify-center flex-shrink-0">
                    <Plus className="h-5 w-5" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-semibold">Create New Product</div>
                    <div className="text-xs opacity-90">Start from scratch or use a template</div>
                  </div>
                </div>
              </Link>
            </Button>
            
            <Button asChild variant="outline" className="w-full justify-start h-auto py-3" data-testid="button-generate-content">
              <Link href="/builders/content">
                <div className="flex items-center gap-3 w-full">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-semibold">Generate Content</div>
                    <div className="text-xs text-muted-foreground">AI-powered content creation</div>
                  </div>
                </div>
              </Link>
            </Button>
            
            <Button asChild variant="outline" className="w-full justify-start h-auto py-3" data-testid="button-ai-coach">
              <Link href="/ai-coach">
                <div className="flex items-center gap-3 w-full">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-semibold">AI Coach</div>
                    <div className="text-xs text-muted-foreground">Get expert guidance 24/7</div>
                  </div>
                </div>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Link to More Tools */}
      <div className="text-center py-4" data-testid="section-more-tools">
        <p className="text-sm text-muted-foreground mb-3">
          Need more tools? Explore our full AI toolkit
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Link href="/builders/idea-finder">
            <Button variant="ghost" size="sm" data-testid="link-idea-finder">
              <Lightbulb className="h-3 w-3 mr-1" />
              Idea Finder
            </Button>
          </Link>
          <Link href="/builders/offer">
            <Button variant="ghost" size="sm" data-testid="link-offer-builder">
              <TrendingUp className="h-3 w-3 mr-1" />
              Offer Builder
            </Button>
          </Link>
          <Link href="/analytics">
            <Button variant="ghost" size="sm" data-testid="link-analytics">
              <TrendingUp className="h-3 w-3 mr-1" />
              Analytics
            </Button>
          </Link>
          <Link href="/ai-agents">
            <Button variant="ghost" size="sm" data-testid="link-ai-agents">
              <Sparkles className="h-3 w-3 mr-1" />
              AI Agents
            </Button>
          </Link>
          <Link href="/video-builder">
            <Button variant="ghost" size="sm" data-testid="link-video-builder">
              <FileText className="h-3 w-3 mr-1" />
              Video Builder
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
