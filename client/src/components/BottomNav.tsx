import { Link, useLocation } from "wouter";
import { Home, FolderOpen, Plus, LayoutTemplate, User } from "lucide-react";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const [location] = useLocation();

  const navItems = [
    { icon: Home, label: "Home", href: "/dashboard", testId: "nav-home" },
    { icon: FolderOpen, label: "Projects", href: "/products", testId: "nav-projects" },
    { icon: Plus, label: "Create", href: "/create", testId: "nav-create", isHighlight: true },
    { icon: LayoutTemplate, label: "Templates", href: "/templates", testId: "nav-templates" },
    { icon: User, label: "Profile", href: "/settings", testId: "nav-profile" },
  ];

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return location === "/" || location === "/dashboard";
    }
    return location.startsWith(href);
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;

          if (item.isHighlight) {
            return (
              <Link key={item.href} href={item.href}>
                <button
                  data-testid={item.testId}
                  className={cn(
                    "flex flex-col items-center justify-center w-14 h-14 -mt-8 rounded-full shadow-lg hover-elevate active-elevate-2 transition-all",
                    active
                      ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  <Icon className="h-6 w-6" />
                </button>
              </Link>
            );
          }

          return (
            <Link key={item.href} href={item.href}>
              <button
                data-testid={item.testId}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-md transition-colors min-w-[60px]",
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
