import { useEffect } from "react";
import { StatsCard } from "@/components/StatsCard";
import { Sparkles, Download, HardDrive, Plus, FileText, BookOpen, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import type { Project } from "@shared/schema";

export default function Dashboard() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [isAuthenticated, authLoading, toast]);

  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
    enabled: isAuthenticated,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/projects/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Project deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to delete project.",
        variant: "destructive",
      });
    },
  });

  const getProjectIcon = (type: string) => {
    switch(type) {
      case 'ebook': return BookOpen;
      case 'course': return FileText;
      case 'checklist': return ListChecks;
      case 'template': return FileText;
      case 'lead_magnet': return Sparkles;
      default: return FileText;
    }
  };

  const getProjectTypeLabel = (type: string) => {
    switch(type) {
      case 'ebook': return 'eBook';
      case 'course': return 'Course';
      case 'checklist': return 'Checklist';
      case 'template': return 'Template';
      case 'lead_magnet': return 'Lead Magnet';
      default: return type;
    }
  };

  const recentProjects = projects.slice(0, 6);

  if (authLoading || !isAuthenticated) {
    return (
      <div className="p-8 flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold mb-2">Welcome back!</h1>
          <p className="text-muted-foreground">Create amazing digital products with AI</p>
        </div>
        <Link href="/projects/new">
          <Button data-testid="button-create-new">
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard
          icon={Sparkles}
          label="Projects Created"
          value={projects.length}
        />
        <StatsCard
          icon={Download}
          label="Total Exports"
          value="0"
        />
        <StatsCard
          icon={HardDrive}
          label="Storage Used"
          value="0 MB"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold">Your Projects</h2>
        </div>
        {isLoading ? (
          <p className="text-muted-foreground">Loading projects...</p>
        ) : recentProjects.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No projects yet. Create your first one!</p>
            <Link href="/projects/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Project
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentProjects.map((project) => {
              const Icon = getProjectIcon(project.type);
              return (
                <Link key={project.id} href={`/projects/${project.id}`}>
                  <Card className="hover-elevate cursor-pointer" data-testid={`card-project-${project.id}`}>
                    <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                      <CardTitle className="text-base font-semibold line-clamp-1">{project.title}</CardTitle>
                      <Icon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between gap-2">
                        <Badge variant="secondary" data-testid={`badge-type-${project.type}`}>
                          {getProjectTypeLabel(project.type)}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(project.createdAt!).toLocaleDateString()}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
