import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import {
  Eye,
  Download,
  Sparkles,
  TrendingUp,
  Award,
  ArrowRight,
  FileText,
  Rocket,
  Target,
} from "lucide-react";

interface AnalyticsSummary {
  totalEvents: number;
  views: number;
  exports: number;
  aiUsage: number;
}

export function AnalyticsDashboard() {
  const [, setLocation] = useLocation();
  const { data: analytics } = useQuery<AnalyticsSummary>({
    queryKey: ["/api/analytics/summary"],
  });

  const { data: projects } = useQuery<any[]>({
    queryKey: ["/api/projects"],
  });

  const getNextBestAction = () => {
    if (!projects || projects.length === 0) {
      return {
        title: "Create Your First Product",
        description: "Start your journey by creating your first digital product with AI assistance.",
        action: "Get Started",
        icon: Rocket,
        href: "/create",
      };
    }

    const draftProjects = projects.filter((p) => p.status === "draft");
    if (draftProjects.length > 0) {
      return {
        title: "Complete Your Draft",
        description: `You have ${draftProjects.length} draft project${draftProjects.length > 1 ? "s" : ""} waiting. Finish and publish to start earning.`,
        action: "View Drafts",
        icon: FileText,
        href: `/editor/${draftProjects[0].id}`,
      };
    }

    const publishedCount = projects.filter((p) => p.status === "published").length;
    if (publishedCount < 3) {
      return {
        title: "Build Your Portfolio",
        description: "Create more products to diversify your offerings and reach more customers.",
        action: "Create New Product",
        icon: Target,
        href: "/create",
      };
    }

    return {
      title: "Grow Your Business",
      description: "Export your products and share them with your audience to maximize impact.",
      action: "View Analytics",
      icon: TrendingUp,
      href: "/analytics",
    };
  };

  const nextAction = getNextBestAction();

  const stats = [
    {
      icon: Eye,
      label: "Total Views",
      value: analytics?.views || 0,
      trend: "+12%",
      color: "text-blue-500",
    },
    {
      icon: Download,
      label: "Exports",
      value: analytics?.exports || 0,
      trend: "+8%",
      color: "text-green-500",
    },
    {
      icon: Sparkles,
      label: "AI Actions",
      value: analytics?.aiUsage || 0,
      trend: "+25%",
      color: "text-purple-500",
    },
    {
      icon: FileText,
      label: "Total Projects",
      value: projects?.length || 0,
      trend: "",
      color: "text-orange-500",
    },
  ];

  return (
    <div className="space-y-6" data-testid="container-analytics-dashboard">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Your Week at a Glance
          </CardTitle>
          <CardDescription>
            Track your productivity and AI-powered content creation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat) => (
              <div key={stat.label} className="space-y-2" data-testid={`stat-${stat.label.toLowerCase().replace(/\s+/g, "-")}`}>
                <div className="flex items-center gap-2">
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                  <span className="text-sm text-muted-foreground">{stat.label}</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold">{stat.value}</span>
                  {stat.trend && (
                    <Badge variant="secondary" className="text-xs">
                      {stat.trend}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <nextAction.icon className="h-5 w-5" />
            Next Best Action
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg mb-1">{nextAction.title}</h3>
              <p className="text-muted-foreground">{nextAction.description}</p>
            </div>
            <Button
              onClick={() => setLocation(nextAction.href)}
              className="w-full sm:w-auto"
              data-testid="button-next-action"
            >
              {nextAction.action}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
