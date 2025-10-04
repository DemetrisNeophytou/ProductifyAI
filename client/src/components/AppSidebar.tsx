import { Home, Lightbulb, FileText, PenTool, DollarSign, Rocket, Sparkles, Palette, Image, Settings, HelpCircle, LogOut, MessageCircle, Crown, Users, BookOpen } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Link, useLocation } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import type { User } from "@shared/schema";

const dashboardItems = [
  {
    title: "My Projects",
    url: "/dashboard",
    icon: Home,
  },
];

const builderItems = [
  {
    title: "Idea Finder",
    url: "/builders/idea-finder",
    icon: Lightbulb,
  },
  {
    title: "Product Outline",
    url: "/builders/outline",
    icon: FileText,
  },
  {
    title: "Offer Builder",
    url: "/builders/offer",
    icon: DollarSign,
  },
  {
    title: "Content Writer",
    url: "/builders/content",
    icon: PenTool,
  },
  {
    title: "Funnel & Launch",
    url: "/builders/funnel",
    icon: Rocket,
  },
  {
    title: "Mission Control",
    url: "/ai-builders",
    icon: Sparkles,
  },
];

const toolsItems = [
  {
    title: "AI Coach",
    url: "/ai-coach",
    icon: MessageCircle,
  },
  {
    title: "Templates",
    url: "/templates",
    icon: BookOpen,
  },
  {
    title: "Brand Kit",
    url: "/brand-kit",
    icon: Palette,
  },
  {
    title: "Assets",
    url: "/assets",
    icon: Image,
  },
  {
    title: "Community",
    url: "/community",
    icon: Users,
  },
];

const accountItems = [
  {
    title: "Upgrade",
    url: "/pricing",
    icon: Crown,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
  {
    title: "Help",
    url: "/help",
    icon: HelpCircle,
  },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { user } = useAuth() as { user: User | undefined };

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const userInitials = user?.firstName && user?.lastName
    ? `${user.firstName[0]}${user.lastName[0]}`
    : user?.email?.[0]?.toUpperCase() || "U";

  const displayName = user?.firstName && user?.lastName
    ? `${user.firstName} ${user.lastName}`
    : user?.email || "User";

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-lg font-bold px-4 py-6">
            Productify AI
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {dashboardItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location === item.url}>
                    <Link 
                      href={item.url}
                      data-testid={`link-${item.title.toLowerCase().replace(' ', '-')}`}
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel className="px-4 text-xs uppercase tracking-wide text-muted-foreground">
            AI Builders
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {builderItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location === item.url}>
                    <Link 
                      href={item.url}
                      data-testid={`link-${item.title.toLowerCase().replace(' ', '-')}`}
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel className="px-4 text-xs uppercase tracking-wide text-muted-foreground">
            Tools
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {toolsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location === item.url}>
                    <Link 
                      href={item.url}
                      data-testid={`link-${item.title.toLowerCase().replace(' ', '-')}`}
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {accountItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location === item.url}>
                    <Link 
                      href={item.url}
                      data-testid={`link-${item.title.toLowerCase().replace(' ', '-')}`}
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4">
        <div 
          className="flex items-center gap-3 p-3 rounded-lg hover-elevate active-elevate-2 cursor-pointer" 
          onClick={handleLogout}
          data-testid="button-logout"
        >
          <Avatar className="h-9 w-9">
            <AvatarImage src={user?.profileImageUrl || ""} />
            <AvatarFallback className="bg-primary text-primary-foreground">{userInitials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{displayName}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
          <LogOut className="h-4 w-4 text-muted-foreground" />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
