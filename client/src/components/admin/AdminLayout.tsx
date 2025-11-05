/**
 * Admin Control Center Layout
 * Unified interface for Evaluation, KB, Analytics, and Settings
 */

import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/ThemeToggle';
import {
  TestTube,
  Database,
  BarChart3,
  Settings,
  Home,
  Shield,
  ArrowLeft,
  Users,
  DollarSign,
  Activity,
  MessageCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const adminNavItems = [
  {
    title: 'Overview',
    href: '/admin',
    icon: Home,
    description: 'System dashboard',
  },
  {
    title: 'Users',
    href: '/admin/users',
    icon: Users,
    description: 'User Management',
  },
  {
    title: 'Revenue',
    href: '/admin/revenue',
    icon: DollarSign,
    description: 'Stripe & Commissions',
  },
  {
    title: 'AI Usage',
    href: '/admin/usage',
    icon: Activity,
    description: 'Token Analytics',
  },
  {
    title: 'Community',
    href: '/admin/community',
    icon: MessageCircle,
    description: 'Chat Insights',
  },
  {
    title: 'Evaluation',
    href: '/admin/evaluation',
    icon: TestTube,
    description: 'AI Quality Testing',
  },
  {
    title: 'Knowledge Base',
    href: '/admin/kb',
    icon: Database,
    description: 'Manage AI Memory',
  },
  {
    title: 'Settings',
    href: '/admin/settings',
    icon: Settings,
    description: 'System Config',
  },
];

export function AdminLayout({ children }: AdminLayoutProps) {
  const [location] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center px-6">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-xl font-bold">Admin Control Center</h1>
              <p className="text-xs text-muted-foreground">
                ProductifyAI Internal Tools
              </p>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-4">
            <Badge variant="outline" className="text-xs">
              Admin Mode
            </Badge>
            <ThemeToggle />
            <Link href="/dashboard">
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to App
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="sticky top-16 h-[calc(100vh-4rem)] w-64 border-r bg-muted/30">
          <nav className="flex flex-col gap-1 p-4">
            <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Navigation
            </p>
            {adminNavItems.map((item) => {
              const isActive = location === item.href;
              const Icon = item.icon;

              return (
                <Link key={item.href} href={item.href}>
                  <a
                    className={cn(
                      'flex items-start gap-3 rounded-lg px-3 py-2.5 transition-all hover:bg-accent',
                      isActive && 'bg-accent text-accent-foreground font-medium'
                    )}
                  >
                    <Icon className={cn('h-5 w-5 mt-0.5', isActive && 'text-primary')} />
                    <div className="flex-1">
                      <div className="text-sm leading-none">{item.title}</div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {item.description}
                      </div>
                    </div>
                  </a>
                </Link>
              );
            })}
          </nav>

          <Separator className="my-4" />

          <div className="px-4 pb-4">
            <div className="rounded-lg bg-primary/10 p-3 text-xs">
              <p className="font-semibold text-primary mb-1">⚡ Admin Access</p>
              <p className="text-muted-foreground">
                You have full system privileges. Handle with care.
              </p>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}

