import { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ExportDialog } from "@/components/ExportDialog";
import RichTextEditor from "@/components/RichTextEditor";
import {
  GripVertical,
  Plus,
  Trash2,
  Download,
  Save,
  Undo,
  Redo,
  Eye,
  Settings,
  Sparkles,
  Image as ImageIcon,
  Palette,
  Type,
  Upload,
  Wand2,
  Check,
  FileText,
  List,
  Quote,
  MessageSquare,
} from "lucide-react";
import type { Project, Section } from "@shared/schema";

const blockTemplates = [
  { type: "text", icon: FileText, title: "Text Block", placeholder: "Start writing..." },
  { type: "heading", icon: Type, title: "Heading", placeholder: "Chapter title..." },
  { type: "list", icon: List, title: "List", placeholder: "Add list items..." },
  { type: "quote", icon: Quote, title: "Quote", placeholder: "Inspirational quote..." },
  { type: "image", icon: ImageIcon, title: "Image", placeholder: "Image placeholder..." },
  { type: "cta", icon: MessageSquare, title: "Call to Action", placeholder: "Add your CTA..." },
];

export default function CanvaEditor() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("edit");
  const [brandColors, setBrandColors] = useState({
    primary: "#8B5CF6",
    secondary: "#EC4899",
  });
  const [brandFonts, setBrandFonts] = useState({
    heading: "Inter",
    body: "Georgia",
  });

  const { data: project } = useQuery<Project & { sections?: Section[] }>({
    queryKey: ["/api/projects", id],
    enabled: !!id,
  });

  const { data: sections = [], isLoading } = useQuery<Section[]>({
    queryKey: ["/api/projects", id, "sections"],
    enabled: !!id,
  });

  const [localSections, setLocalSections] = useState<Section[]>([]);
  const [dirtyFlags, setDirtyFlags] = useState<Record<string, boolean>>({});
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const lastSectionsRef = useRef<Section[]>([]);
  const [undoStack, setUndoStack] = useState<Section[][]>([]);
  const [redoStack, setRedoStack] = useState<Section[][]>([]);

  useEffect(() => {
    if (JSON.stringify(sections) === JSON.stringify(lastSectionsRef.current)) {
      return;
    }
    
    lastSectionsRef.current = sections;
    
    setLocalSections((prevLocal) => {
      if (prevLocal.length === 0) {
        return sections;
      }
      
      return sections.map((serverSection) => {
        const localSection = prevLocal.find((s) => s.id === serverSection.id);
        const isDirty = dirtyFlags[serverSection.id];
        if (localSection && isDirty) {
          return localSection;
        }
        return serverSection;
      });
    });

    if (sections.length > 0 && !selectedSectionId) {
      setSelectedSectionId(sections[0].id);
    }
  }, [sections, dirtyFlags, selectedSectionId]);

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
        }, 5000);
        timeouts.push(timeout);
      }
    });

    return () => {
      timeouts.forEach((timeout) => clearTimeout(timeout));
    };
  }, [localSections, dirtyFlags]);

  const createSectionMutation = useMutation({
    mutationFn: async (template: typeof blockTemplates[0]) => {
      const emptyContent = {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [],
          },
        ],
      };

      return await apiRequest("POST", `/api/projects/${id}/sections`, {
        type: template.type,
        title: template.title,
        content: emptyContent,
        order: localSections.length,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", id, "sections"] });
      toast({ title: "Block added" });
    },
  });

  const updateSectionMutation = useMutation({
    mutationFn: async ({ sectionId, data }: { sectionId: string; data: any }) => {
      return await apiRequest("PATCH", `/api/sections/${sectionId}`, data);
    },
    onSuccess: (_, variables) => {
      const currentLocal = localSections.find((s) => s.id === variables.sectionId);
      const savedContentMatches = currentLocal && 
        JSON.stringify(currentLocal.content) === JSON.stringify(variables.data.content);
      
      if (savedContentMatches) {
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
        
        setDirtyFlags((prev) => ({ ...prev, [variables.sectionId]: false }));
      }
    },
    onError: (_, variables) => {
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
      toast({ title: "Block deleted" });
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

  const handleContentChange = (sectionId: string, content: any) => {
    setUndoStack((prev) => [...prev, localSections]);
    setRedoStack([]);
    
    setLocalSections((prev) =>
      prev.map((s) => (s.id === sectionId ? { ...s, content } : s))
    );
    setDirtyFlags((prev) => ({ ...prev, [sectionId]: true }));
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    
    const previous = undoStack[undoStack.length - 1];
    setRedoStack((prev) => [localSections, ...prev]);
    setLocalSections(previous);
    setUndoStack((prev) => prev.slice(0, -1));
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    
    const next = redoStack[0];
    setUndoStack((prev) => [...prev, localSections]);
    setLocalSections(next);
    setRedoStack((prev) => prev.slice(1));
  };

  const handleSave = () => {
    localSections.forEach((section) => {
      const isDirty = dirtyFlags[section.id];
      if (isDirty) {
        updateSectionMutation.mutate({
          sectionId: section.id,
          data: { content: section.content },
        });
      }
    });
    toast({ title: "Saving all changes..." });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undoStack, redoStack, dirtyFlags, localSections]);

  const selectedSection = localSections.find((s) => s.id === selectedSectionId);

  if (!project || isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Loading editor...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <div className="border-b bg-background sticky top-0 z-10">
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold" data-testid="text-project-title">{project.title}</h1>
            {updateSectionMutation.isPending && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <span className="inline-block h-2 w-2 rounded-full bg-primary animate-pulse" />
                Saving...
              </span>
            )}
            {!updateSectionMutation.isPending && Object.values(dirtyFlags).some(Boolean) && (
              <span className="text-xs text-muted-foreground">Unsaved changes</span>
            )}
            {!updateSectionMutation.isPending && !Object.values(dirtyFlags).some(Boolean) && (
              <span className="text-xs text-green-600 flex items-center gap-1">
                <Check className="h-3 w-3" />
                All saved
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleUndo}
              disabled={undoStack.length === 0}
              title="Undo (Ctrl+Z)"
              data-testid="button-undo"
            >
              <Undo className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRedo}
              disabled={redoStack.length === 0}
              title="Redo (Ctrl+Y)"
              data-testid="button-redo"
            >
              <Redo className="h-4 w-4" />
            </Button>
            <div className="w-px h-6 bg-border" />
            <Button
              variant="outline"
              size="sm"
              onClick={handleSave}
              data-testid="button-save"
            >
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowExportDialog(true)}
              data-testid="button-export"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="ghost" size="icon" data-testid="button-preview">
              <Eye className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" data-testid="button-settings">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-64 border-r bg-muted/20">
          <div className="p-3 border-b">
            <h2 className="text-sm font-semibold mb-2">Sections</h2>
            <div className="flex flex-wrap gap-1">
              {blockTemplates.slice(0, 3).map((template) => (
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
          </div>
          <ScrollArea className="h-[calc(100vh-140px)]">
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="sections">
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="p-2 space-y-1"
                  >
                    {localSections.map((section, index) => (
                      <Draggable key={section.id} draggableId={section.id} index={index}>
                        {(provided, snapshot) => (
                          <Card
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`p-2 cursor-pointer hover-elevate ${
                              selectedSectionId === section.id ? 'bg-primary/10 border-primary' : ''
                            } ${snapshot.isDragging ? 'shadow-lg' : ''}`}
                            onClick={() => setSelectedSectionId(section.id)}
                            data-testid={`section-item-${section.id}`}
                          >
                            <div className="flex items-center gap-2">
                              <div {...provided.dragHandleProps}>
                                <GripVertical className="h-4 w-4 text-muted-foreground" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{section.title}</p>
                                <p className="text-xs text-muted-foreground">{section.type}</p>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 opacity-0 group-hover:opacity-100"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteSectionMutation.mutate(section.id);
                                }}
                                data-testid={`button-delete-${section.id}`}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </Card>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </ScrollArea>
        </div>

        <div className="flex-1 overflow-auto bg-background">
          <div className="max-w-4xl mx-auto p-8">
            {selectedSection ? (
              <div className="space-y-4">
                <Input
                  value={selectedSection.title}
                  onChange={(e) => {
                    setLocalSections((prev) =>
                      prev.map((s) =>
                        s.id === selectedSection.id ? { ...s, title: e.target.value } : s
                      )
                    );
                    setDirtyFlags((prev) => ({ ...prev, [selectedSection.id]: true }));
                  }}
                  className="text-2xl font-bold border-0 px-0 focus-visible:ring-0"
                  placeholder="Section title..."
                  data-testid="input-section-title"
                />
                <RichTextEditor
                  content={selectedSection.content}
                  onChange={(content) => handleContentChange(selectedSection.id, content)}
                  placeholder={blockTemplates.find((t) => t.type === selectedSection.type)?.placeholder}
                />
              </div>
            ) : (
              <div className="text-center py-16 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select a section from the left panel to start editing</p>
                <p className="text-sm mt-2">or create a new block to begin</p>
              </div>
            )}
          </div>
        </div>

        <div className="w-80 border-l bg-muted/20">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="grid grid-cols-4 m-2">
              <TabsTrigger value="edit" data-testid="tab-edit">
                <Wand2 className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="images" data-testid="tab-images">
                <ImageIcon className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="brand" data-testid="tab-brand">
                <Palette className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="ai" data-testid="tab-ai">
                <Sparkles className="h-4 w-4" />
              </TabsTrigger>
            </TabsList>
            
            <ScrollArea className="flex-1">
              <TabsContent value="edit" className="p-4 space-y-4 m-0">
                <div>
                  <h3 className="font-semibold mb-3">AI Tools</h3>
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full justify-start" data-testid="button-ai-polish">
                      <Sparkles className="h-4 w-4 mr-2" />
                      Polish Content
                    </Button>
                    <Button variant="outline" className="w-full justify-start" data-testid="button-ai-improve">
                      <Wand2 className="h-4 w-4 mr-2" />
                      Improve Writing
                    </Button>
                    <Button variant="outline" className="w-full justify-start" data-testid="button-ai-shorten">
                      <FileText className="h-4 w-4 mr-2" />
                      Make Shorter
                    </Button>
                    <Button variant="outline" className="w-full justify-start" data-testid="button-ai-expand">
                      <FileText className="h-4 w-4 mr-2" />
                      Expand Content
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="images" className="p-4 space-y-4 m-0">
                <div>
                  <h3 className="font-semibold mb-3">Images</h3>
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full justify-start" data-testid="button-regenerate-image">
                      <ImageIcon className="h-4 w-4 mr-2" />
                      Regenerate Image
                    </Button>
                    <Button variant="outline" className="w-full justify-start" data-testid="button-upload-image">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Image
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="brand" className="p-4 space-y-4 m-0">
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Palette className="h-4 w-4" />
                    Brand Kit
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-muted-foreground mb-2 block">Primary Color</label>
                      <Input
                        type="color"
                        value={brandColors.primary}
                        onChange={(e) => setBrandColors({ ...brandColors, primary: e.target.value })}
                        className="h-10"
                        data-testid="input-brand-primary"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground mb-2 block">Secondary Color</label>
                      <Input
                        type="color"
                        value={brandColors.secondary}
                        onChange={(e) => setBrandColors({ ...brandColors, secondary: e.target.value })}
                        className="h-10"
                        data-testid="input-brand-secondary"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground mb-2 block">Heading Font</label>
                      <Input
                        value={brandFonts.heading}
                        onChange={(e) => setBrandFonts({ ...brandFonts, heading: e.target.value })}
                        data-testid="input-brand-heading-font"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground mb-2 block">Body Font</label>
                      <Input
                        value={brandFonts.body}
                        onChange={(e) => setBrandFonts({ ...brandFonts, body: e.target.value })}
                        data-testid="input-brand-body-font"
                      />
                    </div>
                    <Button className="w-full" data-testid="button-apply-brand">
                      Apply Brand Kit
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="ai" className="p-4 space-y-4 m-0">
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    AI Suggestions
                  </h3>
                  <div className="space-y-3">
                    <Card className="p-3">
                      <p className="text-sm text-muted-foreground">
                        Try adding a compelling introduction to hook your readers
                      </p>
                      <Button size="sm" variant="ghost" className="px-0 mt-1">
                        Apply suggestion
                      </Button>
                    </Card>
                    <Card className="p-3">
                      <p className="text-sm text-muted-foreground">
                        Consider adding more examples to illustrate your points
                      </p>
                      <Button size="sm" variant="ghost" className="px-0 mt-1">
                        Apply suggestion
                      </Button>
                    </Card>
                  </div>
                </div>
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </div>
      </div>

      <ExportDialog
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
        project={project}
        sections={localSections}
      />
    </div>
  );
}
