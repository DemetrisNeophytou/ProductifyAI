/**
 * Animated Stat Card
 * Card with count-up animation, trend indicator, and sparkline
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUpRight, ArrowDownRight, TrendingUp } from 'lucide-react';

interface AnimatedStatCardProps {
  title: string;
  value: number;
  trend: number;
  icon: React.ElementType;
  sparkline?: number[];
  prefix?: string;
  suffix?: string;
  decimals?: number;
  delay?: number;
}

export function AnimatedStatCard({
  title,
  value,
  trend,
  icon: Icon,
  sparkline = [],
  prefix = '',
  suffix = '',
  decimals = 0,
  delay = 0,
}: AnimatedStatCardProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  // Count-up animation
  useEffect(() => {
    const timeout = setTimeout(() => {
      setIsVisible(true);
      
      const duration = 1000;
      const steps = 60;
      const increment = value / steps;
      let current = 0;
      let step = 0;

      const timer = setInterval(() => {
        step++;
        current += increment;
        
        if (step >= steps) {
          setDisplayValue(value);
          clearInterval(timer);
        } else {
          setDisplayValue(current);
        }
      }, duration / steps);

      return () => clearInterval(timer);
    }, delay);

    return () => clearTimeout(timeout);
  }, [value, delay]);

  const trendColor = trend >= 0 ? 'text-green-600' : 'text-red-600';
  const TrendIcon = trend >= 0 ? ArrowUpRight : ArrowDownRight;

  return (
    <Card 
      className={`transition-all duration-500 hover:shadow-lg ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="p-2 bg-primary/10 rounded-lg">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-baseline gap-2">
          <div className="text-3xl font-bold">
            {prefix}
            {displayValue.toLocaleString(undefined, { 
              minimumFractionDigits: decimals,
              maximumFractionDigits: decimals,
            })}
            {suffix}
          </div>
          <div className={`flex items-center text-xs font-medium ${trendColor}`}>
            <TrendIcon className="h-3 w-3 mr-0.5" />
            {Math.abs(trend).toFixed(1)}%
          </div>
        </div>

        {sparkline.length > 0 && (
          <div className="h-12 flex items-end gap-0.5">
            {sparkline.map((val, index) => {
              const maxVal = Math.max(...sparkline);
              const height = (val / maxVal) * 100;
              
              return (
                <div
                  key={index}
                  className="flex-1 bg-primary/20 rounded-sm transition-all duration-300 hover:bg-primary/40"
                  style={{
                    height: `${height}%`,
                    animationDelay: `${delay + index * 50}ms`,
                  }}
                  title={`Day ${index + 1}: ${val}`}
                />
              );
            })}
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          vs. last period
        </p>
      </CardContent>
    </Card>
  );
}

