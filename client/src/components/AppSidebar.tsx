import { Home, Plus, FileText, BarChart3, MessageCircle, Palette, Users, Settings, LogOut, Sparkles, Video, Image, Database, TestTube } from "lucide-react";
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

const mainItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: Home,
  },
  {
    title: "Create",
    url: "/create",
    icon: Plus,
  },
  {
    title: "My Products",
    url: "/products",
    icon: FileText,
  },
  {
    title: "Media",
    url: "/media",
    icon: Image,
  },
  {
    title: "Analytics",
    url: "/analytics",
    icon: BarChart3,
  },
];

const aiToolsItems = [
  {
    title: "AI Agents",
    url: "/ai-agents",
    icon: Sparkles,
  },
  {
    title: "Video Builder",
    url: "/video-builder",
    icon: Video,
  },
  {
    title: "AI Coach",
    url: "/ai-coach",
    icon: MessageCircle,
  },
];

const moreItems = [
  {
    title: "Brand Kit",
    url: "/brand-kit",
    icon: Palette,
  },
  {
    title: "Community",
    url: "/community",
    icon: Users,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
];

const adminItems = [
  {
    title: "KB Admin",
    url: "/admin/kb",
    icon: Database,
  },
  {
    title: "AI Evaluation",
    url: "/admin/evaluation",
    icon: TestTube,
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

  // Check if admin features are enabled
  const isAdminEnabled = import.meta.env.VITE_EVAL_MODE === 'true';

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-lg font-bold px-4 py-6">
            Productify AI
          </SidebarGroupLabel>
          <SidebarGroupLabel className="px-4 text-xs uppercase tracking-wide text-muted-foreground mt-2">
            Main
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location === item.url}>
                    <Link 
                      href={item.url}
                      data-testid={`link-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
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
            AI Tools
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {aiToolsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location === item.url}>
                    <Link 
                      href={item.url}
                      data-testid={`link-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
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
            More
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {moreItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location === item.url}>
                    <Link 
                      href={item.url}
                      data-testid={`link-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
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

        {isAdminEnabled && (
          <>
            <SidebarSeparator />
            <SidebarGroup>
              <SidebarGroupLabel className="px-4 text-xs uppercase tracking-wide text-muted-foreground">
                Admin
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {adminItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={location === item.url}>
                        <Link 
                          href={item.url}
                          data-testid={`link-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
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
          </>
        )}
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
