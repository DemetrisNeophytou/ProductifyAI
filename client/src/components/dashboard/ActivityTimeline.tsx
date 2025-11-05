/**
 * Activity Timeline
 * Recent activity feed with animations and grouping
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  Sparkles, 
  Video, 
  Package, 
  DollarSign, 
  Users,
  Clock,
} from 'lucide-react';
import { getMockActivities, formatRelativeTime, type Activity } from '@/utils/mockStats';

const activityIcons = {
  ai: { icon: Sparkles, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  video: { icon: Video, color: 'text-pink-500', bg: 'bg-pink-500/10' },
  product: { icon: Package, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  revenue: { icon: DollarSign, color: 'text-green-600', bg: 'bg-green-600/10' },
  user: { icon: Users, color: 'text-orange-500', bg: 'bg-orange-500/10' },
};

export function ActivityTimeline() {
  const activities = getMockActivities();

  // Group by date
  const groupedActivities = activities.reduce((groups, activity) => {
    const date = activity.timestamp.toLocaleDateString();
    if (!groups[date]) groups[date] = [];
    groups[date].push(activity);
    return groups;
  }, {} as Record<string, Activity[]>);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          <div>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest actions and events</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          <div className="space-y-6">
            {Object.entries(groupedActivities).map(([date, dateActivities], groupIndex) => (
              <div key={date}>
                <div className="text-xs font-semibold text-muted-foreground mb-3 sticky top-0 bg-background py-1">
                  {date === new Date().toLocaleDateString() ? 'Today' : date}
                </div>
                <div className="space-y-3 relative">
                  {/* Timeline line */}
                  <div className="absolute left-6 top-0 bottom-0 w-px bg-border" />

                  {dateActivities.map((activity, index) => {
                    const config = activityIcons[activity.type];
                    const Icon = config.icon;

                    return (
                      <div
                        key={activity.id}
                        className="flex gap-4 relative animate-in fade-in slide-in-from-left-4 duration-300"
                        style={{ animationDelay: `${(groupIndex * dateActivities.length + index) * 50}ms` }}
                      >
                        <div className={`flex-shrink-0 w-12 h-12 rounded-full ${config.bg} flex items-center justify-center relative z-10`}>
                          <Icon className={`h-5 w-5 ${config.color}`} />
                        </div>
                        <div className="flex-1 pb-4">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-medium text-sm">{activity.action}</p>
                              <p className="text-sm text-muted-foreground">{activity.item}</p>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {formatRelativeTime(activity.timestamp)}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

