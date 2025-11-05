/**
 * Analytics Charts
 * Performance visualization with animated charts
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, TrendingUp, Zap } from 'lucide-react';
import { getAIUsageChartData, getRevenueChartData, getUsageDistribution } from '@/utils/mockStats';

export function AnalyticsCharts() {
  const aiUsageData = getAIUsageChartData();
  const revenueData = getRevenueChartData();
  const distributionData = getUsageDistribution();

  // Simple bar chart component
  const SimpleBarChart = ({ data, dataKey }: { data: any[]; dataKey: string }) => {
    const maxValue = Math.max(...data.map(d => d[dataKey]));

    return (
      <div className="space-y-2">
        {data.map((item, index) => (
          <div key={index} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{item.day || item.month}</span>
              <span className="font-medium">{item[dataKey]}</span>
            </div>
            <div className="h-8 bg-muted rounded-md overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-500 ease-out"
                style={{
                  width: `${(item[dataKey] / maxValue) * 100}%`,
                  animationDelay: `${index * 50}ms`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Simple line chart visualization
  const SimpleLineChart = ({ data, dataKeys }: { data: any[]; dataKeys: string[] }) => {
    const maxValue = Math.max(...data.flatMap(d => dataKeys.map(key => d[key])));
    const width = 100 / (data.length - 1);

    return (
      <div className="relative h-64 border rounded-lg p-4 bg-muted/20">
        {/* Y-axis grid lines */}
        {[0, 25, 50, 75, 100].map(percent => (
          <div
            key={percent}
            className="absolute left-0 right-0 border-t border-dashed border-muted-foreground/20"
            style={{ bottom: `${percent}%` }}
          />
        ))}

        {/* Data visualization */}
        <svg className="w-full h-full" preserveAspectRatio="none">
          {dataKeys.map((dataKey, keyIndex) => {
            const points = data.map((item, index) => {
              const x = (index / (data.length - 1)) * 100;
              const y = 100 - ((item[dataKey] / maxValue) * 100);
              return `${x},${y}`;
            }).join(' ');

            const colors = ['#A855F7', '#EC4899', '#3B82F6'];
            const color = colors[keyIndex % colors.length];

            return (
              <g key={dataKey}>
                {/* Gradient fill */}
                <defs>
                  <linearGradient id={`gradient-${dataKey}`} x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor={color} stopOpacity="0.3" />
                    <stop offset="100%" stopColor={color} stopOpacity="0" />
                  </linearGradient>
                </defs>
                <polyline
                  points={`0,100 ${points} 100,100`}
                  fill={`url(#gradient-${dataKey})`}
                  className="animate-in fade-in duration-700"
                />
                <polyline
                  points={points}
                  fill="none"
                  stroke={color}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="animate-in fade-in duration-500"
                />
              </g>
            );
          })}
        </svg>

        {/* X-axis labels */}
        <div className="absolute -bottom-6 left-0 right-0 flex justify-between text-xs text-muted-foreground">
          {data.map((item, index) => (
            <span key={index}>{item.day || item.month}</span>
          ))}
        </div>
      </div>
    );
  };

  // Usage distribution donut
  const UsageDonut = ({ data }: { data: typeof distributionData }) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    let currentAngle = 0;

    return (
      <div className="space-y-4">
        <div className="relative w-48 h-48 mx-auto">
          <svg className="w-full h-full transform -rotate-90">
            {data.map((item, index) => {
              const percentage = (item.value / total) * 100;
              const angle = (percentage / 100) * 360;
              const radius = 70;
              const circumference = 2 * Math.PI * radius;
              const strokeDasharray = `${(angle / 360) * circumference} ${circumference}`;
              const rotation = currentAngle;
              currentAngle += angle;

              return (
                <circle
                  key={index}
                  cx="96"
                  cy="96"
                  r={radius}
                  fill="none"
                  stroke={item.color}
                  strokeWidth="24"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset="0"
                  style={{
                    transform: `rotate(${rotation}deg)`,
                    transformOrigin: 'center',
                    transition: 'all 0.5s ease-out',
                  }}
                />
              );
            })}
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl font-bold">{total}%</div>
              <div className="text-xs text-muted-foreground">Usage</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {data.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: item.color }}
              />
              <div className="flex-1">
                <div className="text-xs font-medium">{item.name}</div>
                <div className="text-xs text-muted-foreground">{item.value}%</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* AI Usage Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>AI Usage Trends</CardTitle>
              <CardDescription>Generation activity over time</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="week">
            <TabsList className="mb-4">
              <TabsTrigger value="week">Week</TabsTrigger>
              <TabsTrigger value="month">Month</TabsTrigger>
            </TabsList>
            <TabsContent value="week" className="space-y-4">
              <SimpleLineChart 
                data={aiUsageData} 
                dataKeys={['generations', 'layouts', 'naming']} 
              />
              <div className="flex items-center justify-center gap-4 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-primary" />
                  <span>Generations</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-secondary" />
                  <span>Layouts</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span>Naming</span>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="month">
              <SimpleBarChart data={aiUsageData} dataKey="generations" />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Revenue Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            <div>
              <CardTitle>Revenue Growth</CardTitle>
              <CardDescription>Monthly revenue trends</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <SimpleBarChart data={revenueData} dataKey="revenue" />
        </CardContent>
      </Card>

      {/* Usage Distribution */}
      <Card className="md:col-span-2">
        <CardHeader>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Usage Distribution</CardTitle>
              <CardDescription>How you spend your time in ProductifyAI</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <UsageDonut data={distributionData} />
        </CardContent>
      </Card>

      {/* AI Insights */}
      <Card className="md:col-span-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-gradient-to-br from-primary to-secondary rounded-lg">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div>
                <CardTitle>AI Insights</CardTitle>
                <CardDescription>Real-time intelligent observations</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="auto-insights-main"
                checked={autoUpdate}
                onCheckedChange={setAutoUpdate}
              />
              <Label htmlFor="auto-insights-main" className="text-sm cursor-pointer">
                {autoUpdate ? 'Live' : 'Paused'}
              </Label>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            <div className="space-y-3">
              {insights.map((insight, index) => (
                <div
                  key={insight.id}
                  className="p-4 rounded-lg border bg-gradient-to-r from-muted/50 to-transparent hover:from-muted transition-all duration-200"
                  style={{
                    animation: `slideInFromTop 0.3s ease-out ${index * 0.1}s both`,
                  }}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="text-sm font-semibold">{insight.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatRelativeTime(insight.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{insight.message}</p>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

