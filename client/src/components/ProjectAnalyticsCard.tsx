import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, Download, Sparkles, FileText } from "lucide-react";

interface ProjectAnalyticsSummary {
  views: number;
  exports: number;
  aiUsage: number;
  lastExportDate?: string;
  lastViewDate?: string;
}

interface ProjectAnalyticsCardProps {
  projectId: string;
}

export function ProjectAnalyticsCard({ projectId }: ProjectAnalyticsCardProps) {
  const { data: analytics, isLoading } = useQuery<ProjectAnalyticsSummary>({
    queryKey: ["/api/analytics/summary", { projectId }],
    enabled: !!projectId,
  });

  if (isLoading) {
    return (
      <Card data-testid="card-analytics-loading">
        <CardHeader>
          <CardTitle className="text-base">Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  if (!analytics) {
    return null;
  }

  const stats = [
    {
      icon: Eye,
      label: "Views",
      value: analytics.views,
      color: "text-blue-500",
    },
    {
      icon: Download,
      label: "Exports",
      value: analytics.exports,
      color: "text-green-500",
    },
    {
      icon: Sparkles,
      label: "AI Usage",
      value: analytics.aiUsage,
      color: "text-purple-500",
    },
  ];

  return (
    <Card data-testid="card-project-analytics">
      <CardHeader>
        <CardTitle className="text-base">Analytics</CardTitle>
        <CardDescription>Project activity overview</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="flex justify-center mb-2">
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
              <div className="text-2xl font-bold" data-testid={`text-${stat.label.toLowerCase()}-count`}>
                {stat.value}
              </div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>

        {analytics.lastViewDate && (
          <div className="pt-4 border-t text-xs text-muted-foreground">
            Last viewed: {new Date(analytics.lastViewDate).toLocaleDateString()}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
