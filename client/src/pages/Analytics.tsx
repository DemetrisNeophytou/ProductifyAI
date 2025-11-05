import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart3, 
  TrendingUp, 
  Zap, 
  DollarSign, 
  Eye,
  Users,
  FileText,
  Calendar,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AnalyticsSummary {
  totalProjects: number;
  totalAiUsage: number;
  totalRevenue: number;
  conversionRate: number;
}

export default function Analytics() {
  const [timeRange, setTimeRange] = useState("30d");

  const { data: summary, isLoading } = useQuery<AnalyticsSummary>({
    queryKey: ['/api/analytics/summary', timeRange],
    queryFn: async () => {
      // Mock data for now
      return {
        totalProjects: 12,
        totalAiUsage: 45,
        totalRevenue: 0,
        conversionRate: 0
      };
    }
  });

  // Mock data for charts
  const recentActivity = [
    { action: "Created", item: "Marketing Guide", time: "2 hours ago", trend: "up" },
    { action: "AI Generation", item: "Content ideas", time: "5 hours ago", trend: "up" },
    { action: "Published", item: "Email Template", time: "1 day ago", trend: "up" },
    { action: "Edited", item: "Landing Page", time: "2 days ago", trend: "neutral" },
  ];

  const topProducts = [
    { name: "AI Marketing Guide", views: 234, sales: 12, revenue: 588 },
    { name: "Email Template Pack", views: 189, sales: 8, revenue: 392 },
    { name: "Landing Page Kit", views: 156, sales: 6, revenue: 294 },
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold">Analytics</h1>
          <p className="text-muted-foreground mt-2">
            Track your product performance and growth
          </p>
        </div>
        <div className="flex gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Calendar className="mr-2 h-4 w-4" />
            Custom Range
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          <>
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16 mb-2" />
                  <Skeleton className="h-3 w-32" />
                </CardContent>
              </Card>
            ))}
          </>
        ) : (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{summary?.totalProjects || 0}</div>
                <p className="text-xs text-muted-foreground mt-1 flex items-center">
                  <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
                  <span className="text-green-500">+12%</span> from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">AI Generations</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{summary?.totalAiUsage || 0}</div>
                <p className="text-xs text-muted-foreground mt-1 flex items-center">
                  <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
                  <span className="text-green-500">+23%</span> from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">579</div>
                <p className="text-xs text-muted-foreground mt-1 flex items-center">
                  <ArrowDownRight className="h-3 w-3 text-red-500 mr-1" />
                  <span className="text-red-500">-5%</span> from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  ${((summary?.totalRevenue || 0) / 100).toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Coming soon
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Tabs for different views */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Chart Placeholder */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Overview</CardTitle>
                <CardDescription>Your product metrics over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center bg-muted/20 rounded-lg">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">
                      Chart visualization coming soon
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Growth Chart Placeholder */}
            <Card>
              <CardHeader>
                <CardTitle>Growth Trends</CardTitle>
                <CardDescription>Views and engagement over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center bg-muted/20 rounded-lg">
                  <div className="text-center">
                    <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">
                      Trend analysis coming soon
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="products" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Products</CardTitle>
              <CardDescription>Your best products by views and revenue</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topProducts.map((product, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary font-bold">
                        #{index + 1}
                      </div>
                      <div>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {product.views} views • {product.sales} sales
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">${product.revenue}</div>
                      <div className="text-sm text-muted-foreground">Revenue</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your latest actions and events</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 p-4 rounded-lg border"
                  >
                    <div className={`p-2 rounded-lg ${
                      activity.trend === "up" ? "bg-green-500/10" : "bg-muted"
                    }`}>
                      {activity.trend === "up" ? (
                        <ArrowUpRight className="h-4 w-4 text-green-500" />
                      ) : (
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">
                        {activity.action} <span className="text-muted-foreground">•</span>{" "}
                        {activity.item}
                      </div>
                      <div className="text-sm text-muted-foreground">{activity.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
