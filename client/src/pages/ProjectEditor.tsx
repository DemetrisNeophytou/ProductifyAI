import { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ExportDialog } from "@/components/ExportDialog";
import { 
  GripVertical, 
  Plus, 
  Trash2, 
  Download, 
  Palette,
  Type,
  Image as ImageIcon,
  Check,
  Sparkles,
  Search,
  TrendingUp,
} from "lucide-react";
import type { Project, Section } from "@shared/schema";

const sectionTemplates = [
  { type: "introduction", title: "Introduction", placeholder: "Start with a compelling introduction..." },
  { type: "problem", title: "Problem", placeholder: "Describe the problem your audience faces..." },
  { type: "solution", title: "Solution", placeholder: "Present your solution..." },
  { type: "product", title: "Product", placeholder: "Detail your product features..." },
  { type: "offer", title: "Offer", placeholder: "Describe your special offer..." },
  { type: "bonuses", title: "Bonuses", placeholder: "List the bonuses included..." },
  { type: "guarantee", title: "Guarantee", placeholder: "Explain your guarantee..." },
];

export default function ProjectEditor() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showDesignPanel, setShowDesignPanel] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);

  const { data: project } = useQuery<Project & { sections?: Section[] }>({
    queryKey: ["/api/projects", id],
    queryFn: async () => {
      return await fetch(`/api/projects/${id}`, {
        credentials: "include",
      }).then((res) => res.json());
    },
    enabled: !!id,
  });

  const { data: sections = [], isLoading } = useQuery<Section[]>({
    queryKey: ["/api/projects", id, "sections"],
    queryFn: async () => {
      return await fetch(`/api/projects/${id}/sections`, {
        credentials: "include",
      }).then((res) => res.json());
    },
    enabled: !!id,
  });

  const [localSections, setLocalSections] = useState<Section[]>([]);
  const [dirtyFlags, setDirtyFlags] = useState<Record<string, boolean>>({});
  const lastSectionsRef = useRef<Section[]>([]);

  useEffect(() => {
    // Only update if server sections actually changed
    if (JSON.stringify(sections) === JSON.stringify(lastSectionsRef.current)) {
      return;
    }
    
    lastSectionsRef.current = sections;
    
    setLocalSections((prevLocal) => {
      // If no local sections yet, initialize with server data
      if (prevLocal.length === 0) {
        return sections;
      }
      
      // Merge: keep dirty sections from local, use server for clean sections
      return sections.map((serverSection) => {
        const localSection = prevLocal.find((s) => s.id === serverSection.id);
        // Access dirtyFlags from outer scope (current value)
        const isDirty = dirtyFlags[serverSection.id];
        if (localSection && isDirty) {
          return localSection;
        }
        return serverSection;
      });
    });
  }, [sections]);

  // Auto-save with debouncing
  useEffect(() => {
    const timeouts: NodeJS.Timeout[] = [];

    localSections.forEach((section) => {
      const originalSection = sections.find((s) => s.id === section.id);
      const isDirty = dirtyFlags[section.id];
      
      if (isDirty && originalSection && JSON.stringify(section.content) !== JSON.stringify(originalSection.content)) {
        const timeout = setTimeout(() => {
          updateSectionMutation.mutate({
            sectionId: section.id,
            data: { content: section.content },
          });
        }, 1000);
        timeouts.push(timeout);
      }
    });

    return () => {
      timeouts.forEach((timeout) => clearTimeout(timeout));
    };
  }, [localSections, dirtyFlags]);

  const createSectionMutation = useMutation({
    mutationFn: async (template: typeof sectionTemplates[0]) => {
      return await apiRequest("POST", `/api/projects/${id}/sections`, {
        type: template.type,
        title: template.title,
        content: { text: "" },
        order: localSections.length,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", id, "sections"] });
      toast({ title: "Section added" });
    },
  });

  const updateSectionMutation = useMutation({
    mutationFn: async ({ sectionId, data }: { sectionId: string; data: any }) => {
      return await apiRequest("PATCH", `/api/sections/${sectionId}`, data);
    },
    onSuccess: (_, variables) => {
      // Check if local content still matches what we just saved
      // If user has edited more, don't clear dirty flag
      const currentLocal = localSections.find((s) => s.id === variables.sectionId);
      const savedContentMatches = currentLocal && 
        JSON.stringify(currentLocal.content) === JSON.stringify(variables.data.content);
      
      if (savedContentMatches) {
        // Optimistically update the query cache with saved content
        queryClient.setQueryData(
          ["/api/projects", id, "sections"],
          (old: Section[] | undefined) => {
            if (!old) return old;
            return old.map((s) =>
              s.id === variables.sectionId
                ? { ...s, content: variables.data.content }
                : s
            );
          }
        );
        
        // Clear dirty flag only if content still matches
        setDirtyFlags((prev) => ({ ...prev, [variables.sectionId]: false }));
      }
      // If content doesn't match, leave dirty flag set and auto-save will retry with newer content
    },
    onError: (_, variables) => {
      // Restore dirty flag on error so auto-save will retry
      setDirtyFlags((prev) => ({ ...prev, [variables.sectionId]: true }));
      toast({ 
        title: "Failed to save changes", 
        description: "Your changes will be retried automatically",
        variant: "destructive" 
      });
    },
  });

  const deleteSectionMutation = useMutation({
    mutationFn: async (sectionId: string) => {
      return await apiRequest("DELETE", `/api/sections/${sectionId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", id, "sections"] });
      toast({ title: "Section deleted" });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async (sectionIds: string[]) => {
      return await apiRequest("POST", "/api/sections/reorder", {
        projectId: id,
        sectionIds,
      });
    },
  });

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(localSections);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setLocalSections(items);
    reorderMutation.mutate(items.map((s) => s.id));
  };

  const handleContentChange = (sectionId: string, content: string) => {
    setLocalSections((prev) =>
      prev.map((s) => (s.id === sectionId ? { ...s, content: { text: content } } : s))
    );
    // Mark section as dirty when content changes
    setDirtyFlags((prev) => ({ ...prev, [sectionId]: true }));
  };

  // AI Enhancement mutations
  const polishMutation = useMutation({
    mutationFn: async (sectionId: string) => {
      return await apiRequest("POST", `/api/sections/${sectionId}/enhance/polish`, {});
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", id, "sections"] });
      toast({ title: "Content polished successfully!" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Polish failed", 
        description: error.message || "Failed to polish content",
        variant: "destructive" 
      });
    },
  });

  const imagesMutation = useMutation({
    mutationFn: async (sectionId: string) => {
      return await apiRequest("POST", `/api/sections/${sectionId}/enhance/images`, {});
    },
    onSuccess: (data: any) => {
      console.log('Images response:', data);
      const suggestions = data?.suggestions || [];
      toast({ 
        title: "Image suggestions", 
        description: suggestions.length > 0
          ? `Try searching: ${suggestions.slice(0, 2).join(', ')}`
          : "Suggestions generated! Check the response."
      });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to suggest images", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const seoMutation = useMutation({
    mutationFn: async (sectionId: string) => {
      return await apiRequest("POST", `/api/sections/${sectionId}/enhance/seo`, {});
    },
    onSuccess: (data: any) => {
      toast({ 
        title: "SEO recommendations", 
        description: `Keywords: ${(data.keywords || []).slice(0, 3).join(', ')}` 
      });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to generate SEO", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const upsellsMutation = useMutation({
    mutationFn: async (sectionId: string) => {
      return await apiRequest("POST", `/api/sections/${sectionId}/enhance/upsells`, {});
    },
    onSuccess: (data: any) => {
      console.log('Upsells response:', data);
      const ideas = data?.ideas || [];
      toast({ 
        title: "Upsell ideas", 
        description: ideas.length > 0 
          ? `${ideas.length} suggestions generated!` 
          : "Suggestions generated! Check the response."
      });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to generate upsells", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  if (!project || isLoading) {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">Loading project...</p>
      </div>
    );
  }

  return (
    <div className="h-full flex">
      {/* Main Editor */}
      <div className="flex-1 overflow-auto">
        <div className="p-8 max-w-5xl mx-auto space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold" data-testid="text-project-title">{project.title}</h1>
                {updateSectionMutation.isPending && (
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <span className="inline-block h-2 w-2 rounded-full bg-primary animate-pulse" />
                    Saving...
                  </span>
                )}
                {!updateSectionMutation.isPending && (
                  <span className="text-sm text-muted-foreground flex items-center gap-1 opacity-0 hover:opacity-100 transition-opacity">
                    <Check className="h-3 w-3 text-green-600" />
                    Saved
                  </span>
                )}
              </div>
              <p className="text-muted-foreground mt-1">Drag and drop sections to reorder</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowDesignPanel(!showDesignPanel)}
                data-testid="button-toggle-design"
              >
                <Palette className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowExportDialog(true)}
                data-testid="button-export"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          <Card className="p-4">
            <div className="flex flex-wrap gap-2">
              {sectionTemplates.map((template) => (
                <Button
                  key={template.type}
                  variant="outline"
                  size="sm"
                  onClick={() => createSectionMutation.mutate(template)}
                  disabled={createSectionMutation.isPending}
                  data-testid={`button-add-${template.type}`}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  {template.title}
                </Button>
              ))}
            </div>
          </Card>

          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="sections">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="space-y-4"
                >
                  {localSections.map((section, index) => (
                    <Draggable key={section.id} draggableId={section.id} index={index}>
                      {(provided) => (
                        <Card
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className="group"
                          data-testid={`section-${section.id}`}
                        >
                          <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-4">
                            <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing">
                              <GripVertical className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <h3 className="text-lg font-semibold flex-1">{section.title}</h3>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => polishMutation.mutate(section.id)}
                                disabled={polishMutation.isPending}
                                title="Polish content"
                                data-testid={`button-polish-${section.id}`}
                              >
                                <Sparkles className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => imagesMutation.mutate(section.id)}
                                disabled={imagesMutation.isPending}
                                title="Suggest images"
                                data-testid={`button-images-${section.id}`}
                              >
                                <ImageIcon className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => seoMutation.mutate(section.id)}
                                disabled={seoMutation.isPending}
                                title="SEO recommendations"
                                data-testid={`button-seo-${section.id}`}
                              >
                                <Search className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => upsellsMutation.mutate(section.id)}
                                disabled={upsellsMutation.isPending}
                                title="Upsell ideas"
                                data-testid={`button-upsells-${section.id}`}
                              >
                                <TrendingUp className="h-4 w-4" />
                              </Button>
                              <div className="w-px h-4 bg-border mx-1" />
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => deleteSectionMutation.mutate(section.id)}
                                disabled={deleteSectionMutation.isPending}
                                data-testid={`button-delete-${section.id}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <Textarea
                              value={(section.content as any)?.text || ""}
                              onChange={(e) => handleContentChange(section.id, e.target.value)}
                              placeholder={sectionTemplates.find((t) => t.type === section.type)?.placeholder}
                              className="min-h-[120px] resize-none"
                              data-testid={`textarea-${section.id}`}
                            />
                          </CardContent>
                        </Card>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>

          {localSections.length === 0 && (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <p className="text-muted-foreground mb-4">No sections yet. Add your first section above!</p>
            </div>
          )}
        </div>
      </div>

      {/* Design Panel */}
      {showDesignPanel && (
        <div className="w-80 border-l bg-muted/20 overflow-auto">
          <div className="p-6 space-y-6">
            <div>
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Type className="h-4 w-4" />
                Typography
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-muted-foreground">Heading Font</label>
                  <Input defaultValue="Inter" className="mt-1" />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Body Font</label>
                  <Input defaultValue="Georgia" className="mt-1" />
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Colors
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-muted-foreground">Background</label>
                  <Input type="color" defaultValue="#ffffff" className="mt-1 h-10" />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Text Color</label>
                  <Input type="color" defaultValue="#000000" className="mt-1 h-10" />
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                Cover Image
              </h3>
              <Button variant="outline" className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Cover
              </Button>
            </div>
          </div>
        </div>
      )}

      <ExportDialog
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
        project={project}
        sections={localSections}
      />
    </div>
  );
}
