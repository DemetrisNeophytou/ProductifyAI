import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Search, X, Filter, FileText, Calendar, Star, Tag } from "lucide-react";
import type { Project } from "@shared/schema";

export function SmartSearch() {
  const [, setLocation] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [type, setType] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [starred, setStarred] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

  const { data: results = [], isLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects/search", { q: query, type, status, starred, limit: 10 }],
    enabled: query.length > 0 || !!type || !!status || !!starred,
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/" && !isOpen) {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
        setQuery("");
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const handleSelectProject = (projectId: string, projectType: string) => {
    setIsOpen(false);
    setQuery("");
    
    if (projectType === "ebook" || projectType === "course" || projectType === "checklist" || 
        projectType === "workbook" || projectType === "template" || projectType === "lead_magnet") {
      setLocation(`/editor/${projectId}`);
    } else {
      setLocation(`/projects/${projectId}`);
    }
  };

  const clearFilters = () => {
    setType("all");
    setStatus("all");
    setStarred("all");
  };

  const hasFilters = type !== "all" || status !== "all" || starred !== "all";

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="w-64"
        data-testid="button-open-search"
      >
        <Search className="h-4 w-4 mr-2" />
        <span className="text-muted-foreground">Search projects...</span>
        <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-xs font-medium text-muted-foreground">
          /
        </kbd>
      </Button>
    );
  }

  return (
    <div className="relative w-full max-w-2xl" data-testid="container-smart-search">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            autoFocus
            placeholder="Search projects by name, type, or description..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10 pr-10"
            data-testid="input-search-query"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              data-testid="button-clear-query"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Button
          variant={showFilters ? "default" : "outline"}
          size="icon"
          onClick={() => setShowFilters(!showFilters)}
          data-testid="button-toggle-filters"
        >
          <Filter className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            setIsOpen(false);
            setQuery("");
          }}
          data-testid="button-close-search"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {showFilters && (
        <div className="absolute top-full mt-2 w-full bg-background border rounded-lg p-4 shadow-lg z-50">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">Filters</h3>
            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                data-testid="button-clear-filters"
              >
                Clear all
              </Button>
            )}
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Type</label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger data-testid="select-type-filter">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="ebook">eBook</SelectItem>
                  <SelectItem value="course">Online Course</SelectItem>
                  <SelectItem value="checklist">Checklist</SelectItem>
                  <SelectItem value="workbook">Workbook</SelectItem>
                  <SelectItem value="template">Template</SelectItem>
                  <SelectItem value="lead_magnet">Lead Magnet</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Status</label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger data-testid="select-status-filter">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Starred</label>
              <Select value={starred} onValueChange={setStarred}>
                <SelectTrigger data-testid="select-starred-filter">
                  <SelectValue placeholder="All projects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All projects</SelectItem>
                  <SelectItem value="true">Starred only</SelectItem>
                  <SelectItem value="false">Not starred</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}

      {(query || hasFilters) && (
        <div className="absolute top-full mt-2 w-full bg-background border rounded-lg shadow-lg z-50 max-h-96">
          <ScrollArea className="max-h-96">
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground" data-testid="text-loading">
                Searching...
              </div>
            ) : results.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground" data-testid="text-no-results">
                No projects found
              </div>
            ) : (
              <div className="p-2">
                {results.map((project) => (
                  <button
                    key={project.id}
                    onClick={() => handleSelectProject(project.id, project.type)}
                    className="w-full text-left p-3 rounded-lg hover-elevate active-elevate-2 border border-transparent hover:border-border"
                    data-testid={`result-project-${project.id}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium truncate">{project.title}</h4>
                          {project.metadata?.starred && (
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="secondary" className="text-xs">
                            {project.type}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {project.status}
                          </Badge>
                          {project.metadata?.niche && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Tag className="h-3 w-3" />
                              {project.metadata.niche}
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {project.updatedAt ? new Date(project.updatedAt).toLocaleDateString() : 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
