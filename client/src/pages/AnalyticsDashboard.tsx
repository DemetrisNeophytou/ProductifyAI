import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, BarChart3, TrendingUp, Users, DollarSign, Eye, MousePointer } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AnalyticsSummary {
  summary: Array<{
    kind: string;
    count: string;
    total_value: string;
    avg_value: string;
    min_value: string;
    max_value: string;
  }>;
  totals: {
    total_events: string;
    total_leads: string;
    total_sales: string;
    total_revenue: string;
    total_views: string;
    total_clicks: string;
  };
  dailyMetrics: Array<{
    date: string;
    kind: string;
    count: string;
    total_value: string;
  }>;
}

const AnalyticsDashboard = () => {
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const { toast } = useToast();

  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5050";

  // Fetch analytics data
  const fetchAnalytics = async () => {
    if (!selectedProject) {
      setAnalytics(null);
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({
        projectId: selectedProject,
        ...(startDate && { startDate }),
        ...(endDate && { endDate })
      });

      const response = await fetch(`${API_BASE}/api/analytics/summary?${params}`);
      const data = await response.json();
      
      if (data.ok) {
        setAnalytics(data.data);
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to fetch analytics",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch analytics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Track a sample event
  const trackEvent = async (kind: string, value?: number) => {
    if (!selectedProject) {
      toast({
        title: "Error",
        description: "Please select a project first",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/analytics/event`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: selectedProject,
          kind,
          value,
          metadata: { source: "dashboard_test" }
        }),
      });
      
      const data = await response.json();
      
      if (data.ok) {
        toast({
          title: "Event Tracked!",
          description: `Tracked ${kind} event successfully`,
        });
        await fetchAnalytics(); // Refresh analytics
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to track event",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to track event",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [selectedProject, startDate, endDate]);

  const formatNumber = (num: string | number) => {
    const n = typeof num === 'string' ? parseFloat(num) : num;
    return isNaN(n) ? '0' : n.toLocaleString();
  };

  const formatCurrency = (num: string | number) => {
    const n = typeof num === 'string' ? parseFloat(num) : num;
    return isNaN(n) ? '$0.00' : `$${n.toFixed(2)}`;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Track and analyze your product performance
          </p>
        </div>
        <Button onClick={fetchAnalytics} variant="outline">
          <BarChart3 className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="project-select">Project *</Label>
              <select
                id="project-select"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
              >
                <option value="">Select a project...</option>
                <option value="proj_1234567890_abc123">Sample Project 1</option>
                <option value="proj_0987654321_xyz789">Sample Project 2</option>
              </select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="end-date">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label>Test Events</Label>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => trackEvent("view")}>
                  <Eye className="h-3 w-3 mr-1" />
                  View
                </Button>
                <Button size="sm" onClick={() => trackEvent("click")}>
                  <MousePointer className="h-3 w-3 mr-1" />
                  Click
                </Button>
                <Button size="sm" onClick={() => trackEvent("lead")}>
                  <Users className="h-3 w-3 mr-1" />
                  Lead
                </Button>
                <Button size="sm" onClick={() => trackEvent("sale", 99.99)}>
                  <DollarSign className="h-3 w-3 mr-1" />
                  Sale
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : analytics ? (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Events</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(analytics.totals.total_events)}</div>
                <p className="text-xs text-muted-foreground">
                  All tracked events
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Leads</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(analytics.totals.total_leads)}</div>
                <p className="text-xs text-muted-foreground">
                  Potential customers
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Sales</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(analytics.totals.total_sales)}</div>
                <p className="text-xs text-muted-foreground">
                  Completed purchases
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(analytics.totals.total_revenue)}</div>
                <p className="text-xs text-muted-foreground">
                  Total earnings
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Event Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Event Breakdown</CardTitle>
              <CardDescription>
                Detailed metrics by event type
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.summary.map((event) => (
                  <div key={event.kind} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <div>
                        <h4 className="font-medium capitalize">{event.kind}</h4>
                        <p className="text-sm text-muted-foreground">
                          {formatNumber(event.count)} events
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">
                        {event.total_value ? formatCurrency(event.total_value) : 'N/A'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Avg: {event.avg_value ? formatCurrency(event.avg_value) : 'N/A'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Daily Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Daily Metrics</CardTitle>
              <CardDescription>
                Recent activity by day
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {analytics.dailyMetrics.slice(0, 10).map((metric, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center space-x-4">
                      <div className="text-sm font-medium">
                        {new Date(metric.date).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-muted-foreground capitalize">
                        {metric.kind}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatNumber(metric.count)}</div>
                      {metric.total_value && (
                        <div className="text-sm text-muted-foreground">
                          {formatCurrency(metric.total_value)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Analytics Data</h3>
            <p className="text-muted-foreground text-center">
              Select a project to view analytics or start tracking events
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AnalyticsDashboard;
