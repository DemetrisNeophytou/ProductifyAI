/**
 * ProductifyAI Dashboard - AI Intelligence Hub
 * Interactive analytics with live insights, trends, and performance metrics
 */

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Sparkles, 
  Video,
  TrendingUp,
  DollarSign,
  Eye,
  Zap,
  BarChart3,
} from 'lucide-react';
import { Link } from 'wouter';
import { AnimatedStatCard } from '@/components/dashboard/AnimatedStatCard';
import { ActivityTimeline } from '@/components/dashboard/ActivityTimeline';
import { AnalyticsCharts } from '@/components/dashboard/AnalyticsCharts';
import { AISummaryModal } from '@/components/dashboard/AISummaryModal';
import { getMockStats, getGreeting } from '@/utils/mockStats';

interface Product {
  id: number;
  title: string;
  type: string;
  status: string;
  createdAt: string;
}

export default function Dashboard() {
  const [statsVisible, setStatsVisible] = useState(false);
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5050';

  // Fetch products
  const { data: productsData } = useQuery<{ success: boolean; data: Product[] }>({
    queryKey: ['/products'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/products`);
      return response.json();
    },
  });

  const products = productsData?.data || [];
  const stats = getMockStats();

  // Trigger stat animations on mount
  useEffect(() => {
    const timeout = setTimeout(() => setStatsVisible(true), 100);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold animate-in fade-in slide-in-from-left-4 duration-500">
            {getGreeting()}! 👋
          </h1>
          <p className="text-muted-foreground animate-in fade-in slide-in-from-left-4 duration-500 delay-100">
            Here's what's happening with your products and AI activity
          </p>
        </div>
        <div className="flex gap-3 animate-in fade-in slide-in-from-right-4 duration-500">
          <AISummaryModal />
          <Link href="/ai-builders">
            <Button variant="outline">
              <Sparkles className="mr-2 h-4 w-4" />
              AI Tools
            </Button>
          </Link>
          <Link href="/create">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create
            </Button>
          </Link>
        </div>
      </div>

      {/* Animated Stats Grid */}
      {statsVisible && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <AnimatedStatCard
            title="Total Revenue"
            value={stats.revenue.value}
            trend={stats.revenue.trend}
            icon={DollarSign}
            sparkline={stats.revenue.sparkline}
            prefix="$"
            decimals={2}
            delay={0}
          />
          <AnimatedStatCard
            title="AI Generations"
            value={stats.aiGenerations.value}
            trend={stats.aiGenerations.trend}
            icon={Sparkles}
            sparkline={stats.aiGenerations.sparkline}
            delay={100}
          />
          <AnimatedStatCard
            title="Active Products"
            value={stats.activeProducts.value}
            trend={stats.activeProducts.trend}
            icon={BarChart3}
            sparkline={stats.activeProducts.sparkline}
            delay={200}
          />
          <AnimatedStatCard
            title="Total Views"
            value={stats.totalViews.value}
            trend={stats.totalViews.trend}
            icon={Eye}
            sparkline={stats.totalViews.sparkline}
            delay={300}
          />
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Quick Actions */}
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold">Quick Actions</h2>
              <div className="grid gap-4">
                <Link href="/ai-builders">
                  <div className="group p-6 rounded-xl border border-primary/30 bg-gradient-to-br from-primary/10 to-transparent hover:border-primary hover:shadow-lg transition-all duration-200 cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-primary rounded-lg group-hover:scale-110 transition-transform">
                        <Sparkles className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">AI Generator</h3>
                        <p className="text-sm text-muted-foreground">
                          Create layouts with AI assistance
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>

                <Link href="/video-builder">
                  <div className="group p-6 rounded-xl border border-secondary/30 bg-gradient-to-br from-secondary/10 to-transparent hover:border-secondary hover:shadow-lg transition-all duration-200 cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-secondary rounded-lg group-hover:scale-110 transition-transform">
                        <Video className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">Video Builder</h3>
                        <p className="text-sm text-muted-foreground">
                          Create engaging video content
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>

                <Link href="/analytics">
                  <div className="group p-6 rounded-xl border border-blue-500/30 bg-gradient-to-br from-blue-500/10 to-transparent hover:border-blue-500 hover:shadow-lg transition-all duration-200 cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-blue-500 rounded-lg group-hover:scale-110 transition-transform">
                        <TrendingUp className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">Deep Analytics</h3>
                        <p className="text-sm text-muted-foreground">
                          Track performance metrics
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            </div>

            {/* Activity Timeline */}
            <ActivityTimeline />
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <AnalyticsCharts />
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-6">
          <ActivityTimeline />
        </TabsContent>
      </Tabs>

      {/* Recent Products (if any) */}
      {products.length > 0 && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold">Recent Products</h2>
            <Link href="/products">
              <Button variant="ghost" size="sm">
                View all →
              </Button>
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {products.slice(0, 3).map((product, index) => (
              <div
                key={product.id}
                className="p-4 rounded-lg border hover:shadow-md transition-all duration-200 cursor-pointer"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <h3 className="font-medium mb-1">{product.title}</h3>
                <p className="text-sm text-muted-foreground mb-2">{product.type}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {new Date(product.createdAt).toLocaleDateString()}
                  </span>
                  <Link href={`/editor/${product.id}`}>
                    <Button variant="ghost" size="sm">
                      Edit
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
