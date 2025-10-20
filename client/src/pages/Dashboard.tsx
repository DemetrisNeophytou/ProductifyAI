import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Plus, 
  Sparkles, 
  Video, 
  FileText, 
  TrendingUp, 
  DollarSign,
  Users,
  Activity,
  ArrowUpRight,
  Clock,
  Eye,
  Edit,
  MoreHorizontal
} from "lucide-react";
import { Link } from "wouter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Product {
  id: number;
  ownerId: number;
  title: string;
  kind: string;
  price: string;
  published: boolean;
  createdAt: string;
}

interface Stats {
  totalProducts: number;
  publishedProducts: number;
  totalRevenue: number;
  totalViews: number;
}

export default function Dashboard() {
  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5050";

  // Fetch products
  const { data: productsData, isLoading: productsLoading } = useQuery<{ success: boolean; data: Product[] }>({
    queryKey: ["/products"],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/products`);
      return response.json();
    },
  });

  const products = productsData?.data || [];

  // Calculate stats
  const stats: Stats = {
    totalProducts: products.length,
    publishedProducts: products.filter(p => p.published).length,
    totalRevenue: 0, // Placeholder
    totalViews: 0, // Placeholder
  };

  // Recent activity (mock data)
  const recentActivity = [
    { id: 1, action: "Created", item: "AI Marketing Guide", time: "2 hours ago", icon: Plus },
    { id: 2, action: "Published", item: "Video Course: React Basics", time: "5 hours ago", icon: Eye },
    { id: 3, action: "Edited", item: "Email Templates Pack", time: "1 day ago", icon: Edit },
    { id: 4, action: "Generated", item: "AI Product Ideas", time: "2 days ago", icon: Sparkles },
  ];

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Welcome back! Here's what's happening with your products.
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/ai-builders">
            <Button>
              <Sparkles className="mr-2 h-4 w-4" />
              AI Generator
            </Button>
          </Link>
          <Link href="/create">
            <Button variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Create Product
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {productsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-3xl font-bold">{stats.totalProducts}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.publishedProducts} published
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${stats.totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-green-600 mt-1 flex items-center">
              <TrendingUp className="h-3 w-3 mr-1" />
              Coming soon
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalViews}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Analytics coming soon
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Generations</CardTitle>
            <Sparkles className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">0</div>
            <p className="text-xs text-muted-foreground mt-1">
              Use AI to create
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Recent Products */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Products</CardTitle>
              <CardDescription>Your latest digital products</CardDescription>
            </div>
            <Link href="/products">
              <Button variant="ghost" size="sm">
                View all
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {productsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mb-3" />
                <h3 className="text-lg font-semibold mb-2">No products yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Create your first digital product to get started
                </p>
                <Link href="/create">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Product
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {products.slice(0, 4).map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium">{product.title}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                          <span>{product.kind}</span>
                          <span>•</span>
                          <span>${product.price}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={product.published ? "default" : "secondary"}>
                        {product.published ? "Published" : "Draft"}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Edit</DropdownMenuItem>
                          <DropdownMenuItem>Publish</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest actions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => {
                const Icon = activity.icon;
                return (
                  <div key={activity.id} className="flex gap-3">
                    <div className="p-2 bg-muted rounded-lg h-fit">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {activity.action} <span className="text-muted-foreground">•</span>{" "}
                        {activity.item}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center mt-1">
                        <Clock className="h-3 w-3 mr-1" />
                        {activity.time}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-primary/50 hover:border-primary transition-colors cursor-pointer">
          <Link href="/ai-builders">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">AI Generator</CardTitle>
                  <CardDescription>Create with AI</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Transform ideas into complete products using AI
              </p>
            </CardContent>
          </Link>
        </Card>

        <Card className="border-secondary/50 hover:border-secondary transition-colors cursor-pointer">
          <Link href="/video-builder">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-secondary/10 rounded-lg">
                  <Video className="h-6 w-6 text-secondary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Video Builder</CardTitle>
                  <CardDescription>Create videos</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Generate engaging videos from your scripts
              </p>
            </CardContent>
          </Link>
        </Card>

        <Card className="border-accent hover:border-accent-foreground transition-colors cursor-pointer">
          <Link href="/analytics">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-accent rounded-lg">
                  <Activity className="h-6 w-6 text-accent-foreground" />
                </div>
                <div>
                  <CardTitle className="text-lg">Analytics</CardTitle>
                  <CardDescription>Track performance</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Monitor your product metrics and growth
              </p>
            </CardContent>
          </Link>
        </Card>
      </div>
    </div>
  );
}
