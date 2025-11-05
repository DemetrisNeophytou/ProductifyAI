/**
 * AI Insights Feed
 * Auto-updating feed of intelligent insights
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sparkles, RefreshCw } from 'lucide-react';
import { generateAIInsight, type AIInsight } from '@/utils/aiInsightsGenerator';
import { formatRelativeTime } from '@/utils/mockStats';

export function AIInsightsFeed() {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [autoUpdate, setAutoUpdate] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  // Generate initial insights
  useEffect(() => {
    const initial = [generateAIInsight(), generateAIInsight()];
    setInsights(initial);
  }, []);

  // Auto-update every 10 seconds
  useEffect(() => {
    if (!autoUpdate) return;

    const interval = setInterval(() => {
      const newInsight = generateAIInsight();
      setInsights(prev => [newInsight, ...prev].slice(0, 10)); // Keep last 10
    }, 10000);

    return () => clearInterval(interval);
  }, [autoUpdate]);

  const handleManualRefresh = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const newInsight = generateAIInsight();
      setInsights(prev => [newInsight, ...prev].slice(0, 10));
      setIsGenerating(false);
    }, 800);
  };

  const getPriorityColor = (priority: AIInsight['priority']) => {
    switch (priority) {
      case 'high':
        return 'border-primary bg-primary/5';
      case 'medium':
        return 'border-blue-500/30 bg-blue-500/5';
      default:
        return 'border-border bg-muted/20';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">AI Insights</CardTitle>
              <CardDescription>Intelligent analysis of your activity</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Switch
                id="auto-insights"
                checked={autoUpdate}
                onCheckedChange={setAutoUpdate}
              />
              <Label htmlFor="auto-insights" className="text-xs cursor-pointer">
                Auto-update
              </Label>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleManualRefresh}
              disabled={isGenerating}
              className="hover-elevate"
            >
              <RefreshCw className={`h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          <div className="space-y-3">
            {insights.map((insight, index) => (
              <div
                key={insight.id}
                className={`p-4 rounded-lg border transition-all duration-300 ${getPriorityColor(insight.priority)}`}
                style={{
                  animation: `slideInFromTop 0.3s ease-out ${index * 0.05}s both`,
                }}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-sm font-semibold">{insight.title}</span>
                  <Badge variant="outline" className="text-xs">
                    {formatRelativeTime(insight.timestamp)}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {insight.message}
                </p>
              </div>
            ))}

            {insights.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">AI insights will appear here</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>

      <style>{`
        @keyframes slideInFromTop {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </Card>
  );
}

