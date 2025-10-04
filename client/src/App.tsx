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
import { Plus, Crown } from "lucide-react";
import { useState, useEffect } from "react";
import { CommandBar } from "@/components/CommandBar";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import Dashboard from "@/pages/Dashboard";
import NewProject from "@/pages/NewProject";
import ProjectEditor from "@/pages/ProjectEditor";
import CreateProduct from "@/pages/CreateProduct";
import Products from "@/pages/Products";
import BrandKit from "@/pages/BrandKit";
import Assets from "@/pages/Assets";
import AICoach from "@/pages/AICoach";
import Pricing from "@/pages/Pricing";
import Community from "@/pages/Community";
import Settings from "@/pages/Settings";
import IdeaFinder from "@/pages/IdeaFinder";
import OutlineBuilder from "@/pages/OutlineBuilder";
import ContentWriter from "@/pages/ContentWriter";
import OfferBuilder from "@/pages/OfferBuilder";
import FunnelPlanner from "@/pages/FunnelPlanner";
import Onboarding from "@/pages/Onboarding";
import Templates from "@/pages/Templates";
import AIBuilders from "@/pages/AIBuilders";
import AIChatBuilder from "@/pages/AIChatBuilder";
import Billing from "@/pages/Billing";
import SuccessStories from "@/pages/SuccessStories";
import Analytics from "@/pages/Analytics";
import Referrals from "@/pages/Referrals";

function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [commandOpen, setCommandOpen] = useState(false);
  
  const style = {
    "--sidebar-width": "20rem",
    "--sidebar-width-icon": "4rem",
  };

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
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <div className="flex items-center gap-3">
              <Link href="/pricing">
                <Button variant="outline" size="default" data-testid="button-upgrade">
                  <Crown className="h-4 w-4 mr-2" />
                  Upgrade
                </Button>
              </Link>
              <Link href="/onboarding">
                <Button variant="default" size="default" data-testid="button-create-product">
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Product
                </Button>
              </Link>
              <ThemeToggle />
            </div>
          </header>
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
      <CommandBar open={commandOpen} onOpenChange={setCommandOpen} />
    </SidebarProvider>
  );
}

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
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
          <Route path="/projects/:id">
            {(params) => (
              <ProjectEditor />
            )}
          </Route>
          <Route path="/create">
            <DashboardLayout>
              <CreateProduct />
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
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Router />
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
