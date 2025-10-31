/**
 * Mock Statistics
 * Simulated data for dashboard analytics
 */

export interface StatValue {
  value: number;
  trend: number; // Percentage change
  sparkline: number[]; // Last 7 days
}

export interface DashboardStats {
  revenue: StatValue;
  aiGenerations: StatValue;
  videoProjects: StatValue;
  activeProducts: StatValue;
  totalViews: StatValue;
  conversionRate: StatValue;
}

/**
 * Generate mock dashboard stats
 */
export function getMockStats(): DashboardStats {
  return {
    revenue: {
      value: 12345.67,
      trend: 12.5,
      sparkline: [8200, 9100, 8800, 10200, 11500, 11800, 12345],
    },
    aiGenerations: {
      value: 853,
      trend: 23.4,
      sparkline: [620, 680, 710, 750, 790, 820, 853],
    },
    videoProjects: {
      value: 74,
      trend: -3.2,
      sparkline: [82, 79, 77, 76, 75, 75, 74],
    },
    activeProducts: {
      value: 428,
      trend: 8.7,
      sparkline: [380, 390, 400, 410, 415, 422, 428],
    },
    totalViews: {
      value: 15234,
      trend: 15.3,
      sparkline: [12000, 12800, 13200, 13900, 14400, 14800, 15234],
    },
    conversionRate: {
      value: 3.2,
      trend: 0.5,
      sparkline: [2.8, 2.9, 3.0, 3.1, 3.1, 3.2, 3.2],
    },
  };
}

/**
 * Generate mock activity timeline
 */
export interface Activity {
  id: string;
  type: 'ai' | 'video' | 'product' | 'revenue' | 'user';
  action: string;
  item: string;
  timestamp: Date;
  metadata?: any;
}

export function getMockActivities(): Activity[] {
  const now = new Date();
  
  return [
    {
      id: '1',
      type: 'ai',
      action: 'AI Generation Created',
      item: 'Pricing section layout',
      timestamp: new Date(now.getTime() - 15 * 60 * 1000), // 15 mins ago
    },
    {
      id: '2',
      type: 'product',
      action: 'Product Published',
      item: 'Marketing Masterclass',
      timestamp: new Date(now.getTime() - 45 * 60 * 1000), // 45 mins ago
    },
    {
      id: '3',
      type: 'video',
      action: 'Video Rendered',
      item: 'Product Demo Video',
      timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
    },
    {
      id: '4',
      type: 'revenue',
      action: 'Milestone Reached',
      item: '$10,000 total revenue',
      timestamp: new Date(now.getTime() - 3 * 60 * 60 * 1000), // 3 hours ago
    },
    {
      id: '5',
      type: 'ai',
      action: 'Layout Auto-Aligned',
      item: '12 layers aligned to grid',
      timestamp: new Date(now.getTime() - 5 * 60 * 60 * 1000), // 5 hours ago
    },
    {
      id: '6',
      type: 'product',
      action: 'Product Created',
      item: 'Email Template Pack',
      timestamp: new Date(now.getTime() - 24 * 60 * 60 * 1000), // 1 day ago
    },
    {
      id: '7',
      type: 'user',
      action: 'Team Member Invited',
      item: 'john@example.com',
      timestamp: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    },
    {
      id: '8',
      type: 'ai',
      action: 'Layers Auto-Named',
      item: '8 layers renamed',
      timestamp: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    },
  ];
}

/**
 * Generate chart data for AI usage
 */
export function getAIUsageChartData() {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
  return days.map((day, index) => ({
    day,
    generations: Math.floor(Math.random() * 50) + 100 + index * 10,
    layouts: Math.floor(Math.random() * 30) + 50 + index * 5,
    naming: Math.floor(Math.random() * 20) + 30 + index * 3,
  }));
}

/**
 * Generate chart data for revenue
 */
export function getRevenueChartData() {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  
  return months.map((month, index) => ({
    month,
    revenue: Math.floor(Math.random() * 3000) + 5000 + index * 1000,
    subscriptions: Math.floor(Math.random() * 100) + 150 + index * 20,
  }));
}

/**
 * Get usage distribution
 */
export function getUsageDistribution() {
  return [
    { name: 'AI Generation', value: 45, color: '#A855F7' },
    { name: 'Video Builder', value: 25, color: '#EC4899' },
    { name: 'Products', value: 20, color: '#3B82F6' },
    { name: 'Media', value: 10, color: '#10B981' },
  ];
}

/**
 * Format relative time
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins === 1) return '1 minute ago';
  if (diffMins < 60) return `${diffMins} minutes ago`;
  if (diffHours === 1) return '1 hour ago';
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays === 1) return '1 day ago';
  return `${diffDays} days ago`;
}


/**
 * Get greeting based on time of day
 */
export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}