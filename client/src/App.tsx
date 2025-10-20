// Integration: blueprint:javascript_log_in_with_replit
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AppSidebar } from "@/components/AppSidebar";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Plus, Crown, Coins } from "lucide-react";
import { useState, useEffect, lazy, Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { CommandBar } from "@/components/CommandBar";
import { FloatingAICoach } from "@/components/FloatingAICoach";
import { BottomNav } from "@/components/BottomNav";
import { SmartSearch } from "@/components/SmartSearch";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { DevBanner } from "@/components/DevBanner";

// Eager-loaded critical routes (auth & landing)
import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import Dashboard from "@/pages/Dashboard";
import Pricing from "@/pages/Pricing";

// Lazy-loaded routes to reduce initial bundle size
const NewProject = lazy(() => import("@/pages/NewProject"));
const ProjectEditor = lazy(() => import("@/pages/ProjectEditor"));
const CanvaEditor = lazy(() => import("@/pages/CanvaEditor"));
const VisualEditor = lazy(() => import("@/pages/VisualEditor"));
const MediaGallery = lazy(() => import("@/pages/MediaGallery"));
const ProjectPages = lazy(() => import("@/pages/ProjectPages"));
const WizardCreateProduct = lazy(() => import("@/pages/WizardCreateProduct"));
const Products = lazy(() => import("@/pages/Products"));
const BrandKit = lazy(() => import("@/pages/BrandKit"));
const Assets = lazy(() => import("@/pages/Assets"));
const AICoach = lazy(() => import("@/pages/AICoach"));
const Community = lazy(() => import("@/pages/Community"));
const Settings = lazy(() => import("@/pages/Settings"));
const IdeaFinder = lazy(() => import("@/pages/IdeaFinder"));
const OutlineBuilder = lazy(() => import("@/pages/OutlineBuilder"));
const ContentWriter = lazy(() => import("@/pages/ContentWriter"));
const OfferBuilder = lazy(() => import("@/pages/OfferBuilder"));
const FunnelPlanner = lazy(() => import("@/pages/FunnelPlanner"));
const Onboarding = lazy(() => import("@/pages/Onboarding"));
const Templates = lazy(() => import("@/pages/Templates"));
const AIBuilders = lazy(() => import("@/pages/AIBuilders"));
const AIChatBuilder = lazy(() => import("@/pages/AIChatBuilder"));
const Billing = lazy(() => import("@/pages/Billing"));
const SuccessStories = lazy(() => import("@/pages/SuccessStories"));
const Analytics = lazy(() => import("@/pages/Analytics"));
const Referrals = lazy(() => import("@/pages/Referrals"));
const AiAgents = lazy(() => import("@/pages/AiAgents"));
const VideoBuilder = lazy(() => import("@/pages/VideoBuilder"));
const JobDetails = lazy(() => import("@/pages/JobDetails"));
const StyleGuide = lazy(() => import("@/pages/StyleGuide"));
const VisualEditorNew = lazy(() => import("@/pages/VisualEditor"));
const AdminEvaluation = lazy(() => import("@/pages/AdminEvaluation"));
const AdminKB = lazy(() => import("@/pages/AdminKB"));
const AdminOverview = lazy(() => import("@/pages/AdminOverview"));
const AdminAnalytics = lazy(() => import("@/pages/AdminAnalytics"));
const AdminSettings = lazy(() => import("@/pages/AdminSettings"));
const AdminUsers = lazy(() => import("@/pages/AdminUsers"));
const AdminRevenue = lazy(() => import("@/pages/AdminRevenue"));
const AdminUsage = lazy(() => import("@/pages/AdminUsage"));
const AdminCommunity = lazy(() => import("@/pages/AdminCommunity"));

// Loading fallback component with minimal skeleton
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [commandOpen, setCommandOpen] = useState(false);
  
  const style = {
    "--sidebar-width": "20rem",
    "--sidebar-width-icon": "4rem",
  };

  // Fetch credits
  const { data: creditInfo } = useQuery<{ credits: number }>({
    queryKey: ['/api/ai-agents/credits'],
    staleTime: 30000, // 30 seconds
  });

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCommandOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <header className="flex items-center justify-between gap-4 px-6 py-3 border-b sticky top-0 z-40 bg-background">
            <div className="flex items-center gap-4">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              <SmartSearch />
            </div>
            <div className="flex items-center gap-3">
              <Link href="/ai-agents">
                <Button variant="ghost" size="default" className="gap-2" data-testid="button-credits">
                  <Coins className="h-4 w-4 text-yellow-500" />
                  <span className="font-semibold">{creditInfo?.credits || 0}</span>
                </Button>
              </Link>
              <Link href="/pricing">
                <Button variant="outline" size="default" data-testid="button-upgrade">
                  <Crown className="h-4 w-4 mr-2" />
                  Upgrade
                </Button>
              </Link>
              <Link href="/create">
                <Button variant="default" size="default" data-testid="button-create-product">
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Product
                </Button>
              </Link>
              <ThemeToggle />
            </div>
          </header>
          <main className="flex-1 overflow-auto pb-20 md:pb-0">
            {children}
          </main>
        </div>
      </div>
      <BottomNav />
      <CommandBar open={commandOpen} onOpenChange={setCommandOpen} />
      <FloatingAICoach />
    </SidebarProvider>
  );
}

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
      {isLoading || !isAuthenticated ? (
        <>
          <Route path="/" component={Landing} />
          <Route path="/login" component={Login} />
          <Route path="/signup" component={Signup} />
          <Route path="/pricing" component={Pricing} />
        </>
      ) : (
        <>
          <Route path="/onboarding" component={Onboarding} />
          <Route path="/">
            <DashboardLayout>
              <Dashboard />
            </DashboardLayout>
          </Route>
          <Route path="/dashboard">
            <DashboardLayout>
              <Dashboard />
            </DashboardLayout>
          </Route>
          <Route path="/brand-kit">
            <DashboardLayout>
              <BrandKit />
            </DashboardLayout>
          </Route>
          <Route path="/assets">
            <DashboardLayout>
              <Assets />
            </DashboardLayout>
          </Route>
          <Route path="/projects/new">
            <DashboardLayout>
              <NewProject />
            </DashboardLayout>
          </Route>
          <Route path="/projects/:projectId/pages">
            {(params) => <ProjectPages />}
          </Route>
          <Route path="/projects/:id">
            {(params) => (
              <CanvaEditor />
            )}
          </Route>
          <Route path="/projects/:id/classic">
            {(params) => (
              <ProjectEditor />
            )}
          </Route>
                  <Route path="/editor/:projectId">
                    {(params) => (
                      <ProjectEditor />
                    )}
                  </Route>
                  <Route path="/media">
                    <MediaGallery />
                  </Route>
          <Route path="/create">
            <DashboardLayout>
              <WizardCreateProduct />
            </DashboardLayout>
          </Route>
          <Route path="/products">
            <DashboardLayout>
              <Products />
            </DashboardLayout>
          </Route>
          <Route path="/templates">
            <DashboardLayout>
              <Templates />
            </DashboardLayout>
          </Route>
          <Route path="/settings">
            <DashboardLayout>
              <Settings />
            </DashboardLayout>
          </Route>
          <Route path="/ai-coach">
            <DashboardLayout>
              <AICoach />
            </DashboardLayout>
          </Route>
          <Route path="/ai-builders">
            <DashboardLayout>
              <AIBuilders />
            </DashboardLayout>
          </Route>
          <Route path="/builders/chat">
            <AIChatBuilder />
          </Route>
          <Route path="/ai-agents">
            <DashboardLayout>
              <AiAgents />
            </DashboardLayout>
          </Route>
          <Route path="/jobs/:jobId">
            <DashboardLayout>
              <JobDetails />
            </DashboardLayout>
          </Route>
          <Route path="/video-builder">
            <DashboardLayout>
              <VideoBuilder />
            </DashboardLayout>
          </Route>
          <Route path="/community">
            <DashboardLayout>
              <Community />
            </DashboardLayout>
          </Route>
          <Route path="/pricing">
            <DashboardLayout>
              <Pricing />
            </DashboardLayout>
          </Route>
          <Route path="/billing">
            <DashboardLayout>
              <Billing />
            </DashboardLayout>
          </Route>
          <Route path="/success-stories">
            <DashboardLayout>
              <SuccessStories />
            </DashboardLayout>
          </Route>
          <Route path="/analytics">
            <DashboardLayout>
              <Analytics />
            </DashboardLayout>
          </Route>
          <Route path="/referrals">
            <DashboardLayout>
              <Referrals />
            </DashboardLayout>
          </Route>
          <Route path="/help">
            <DashboardLayout>
              <div className="p-8">
                <h1 className="text-3xl font-bold">Help Center</h1>
                <p className="text-muted-foreground mt-2">Get help and support</p>
              </div>
            </DashboardLayout>
          </Route>
          <Route path="/builders/idea-finder">
            <DashboardLayout>
              <IdeaFinder />
            </DashboardLayout>
          </Route>
          <Route path="/builders/outline">
            <DashboardLayout>
              <OutlineBuilder />
            </DashboardLayout>
          </Route>
          <Route path="/builders/content">
            <DashboardLayout>
              <ContentWriter />
            </DashboardLayout>
          </Route>
          <Route path="/builders/offer">
            <DashboardLayout>
              <OfferBuilder />
            </DashboardLayout>
          </Route>
          <Route path="/builders/funnel">
            <DashboardLayout>
              <FunnelPlanner />
            </DashboardLayout>
          </Route>
          <Route path="/style-guide">
            <DashboardLayout>
              <StyleGuide />
            </DashboardLayout>
          </Route>
          <Route path="/editor/:projectId">
            <VisualEditorNew />
          </Route>
          <Route path="/admin">
            <AdminLayout>
              <AdminOverview />
            </AdminLayout>
          </Route>
          <Route path="/admin/evaluation">
            <AdminLayout>
              <AdminEvaluation />
            </AdminLayout>
          </Route>
          <Route path="/admin/kb">
            <AdminLayout>
              <AdminKB />
            </AdminLayout>
          </Route>
          <Route path="/admin/analytics">
            <AdminLayout>
              <AdminAnalytics />
            </AdminLayout>
          </Route>
          <Route path="/admin/users">
            <AdminLayout>
              <AdminUsers />
            </AdminLayout>
          </Route>
          <Route path="/admin/revenue">
            <AdminLayout>
              <AdminRevenue />
            </AdminLayout>
          </Route>
          <Route path="/admin/usage">
            <AdminLayout>
              <AdminUsage />
            </AdminLayout>
          </Route>
          <Route path="/admin/community">
            <AdminLayout>
              <AdminCommunity />
            </AdminLayout>
          </Route>
          <Route path="/admin/settings">
            <AdminLayout>
              <AdminSettings />
            </AdminLayout>
          </Route>
        </>
      )}
      <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <TooltipProvider>
            <Router />
            <Toaster />
            <DevBanner />
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
