import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  GripVertical,
  Plus,
  Trash2,
  Copy,
  FileText,
  ChevronLeft,
} from "lucide-react";
import type { Page } from "@shared/schema";
import BlockEditor from "./BlockEditor";

export default function ProjectPages() {
  const { projectId } = useParams<{ projectId: string }>();
  const { toast } = useToast();
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [showNewPageInput, setShowNewPageInput] = useState(false);
  const [newPageTitle, setNewPageTitle] = useState("");

  const { data: pages = [], isLoading } = useQuery<Page[]>({
    queryKey: ["/api/projects", projectId, "pages"],
    queryFn: async () => {
      return await fetch(`/api/projects/${projectId}/pages`, {
        credentials: "include",
      }).then((res) => res.json());
    },
    enabled: !!projectId,
  });

  const [localPages, setLocalPages] = useState<Page[]>([]);

  useEffect(() => {
    setLocalPages(pages);
    if (pages.length > 0 && !selectedPageId) {
      setSelectedPageId(pages[0].id);
    }
  }, [pages, selectedPageId]);

  const createPageMutation = useMutation({
    mutationFn: async (title: string) => {
      const order = localPages.length;
      const res = await apiRequest("POST", `/api/projects/${projectId}/pages`, {
        title,
        order,
      });
      return await res.json();
    },
    onMutate: async (title: string) => {
      await queryClient.cancelQueries({ queryKey: ["/api/projects", projectId, "pages"] });
      const previousPages = queryClient.getQueryData<Page[]>(["/api/projects", projectId, "pages"]);
      
      const tempPage: Page = {
        id: `temp-${Date.now()}`,
        projectId: projectId!,
        title,
        order: localPages.length,
        createdAt: new Date(),
        updatedAt: new Date(),
        settings: null,
      };
      
      queryClient.setQueryData<Page[]>(
        ["/api/projects", projectId, "pages"],
        (old = []) => [...old, tempPage]
      );
      
      return { previousPages, tempPage };
    },
    onSuccess: (newPage: Page, _variables, context) => {
      queryClient.setQueryData<Page[]>(
        ["/api/projects", projectId, "pages"],
        (old = []) => old.map(p => p.id === context?.tempPage.id ? newPage : p)
      );
      setSelectedPageId(newPage.id);
      setShowNewPageInput(false);
      setNewPageTitle("");
      toast({
        title: "Page created",
        description: "Your new page has been added.",
      });
    },
    onError: (_err, _variables, context) => {
      queryClient.setQueryData(["/api/projects", projectId, "pages"], context?.previousPages);
      toast({
        title: "Error creating page",
        description: "Failed to create the page. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deletePageMutation = useMutation({
    mutationFn: async (pageId: string) => {
      return await apiRequest("DELETE", `/api/pages/${pageId}`);
    },
    onMutate: async (pageId: string) => {
      await queryClient.cancelQueries({ queryKey: ["/api/projects", projectId, "pages"] });
      const previousPages = queryClient.getQueryData<Page[]>(["/api/projects", projectId, "pages"]);
      
      queryClient.setQueryData<Page[]>(
        ["/api/projects", projectId, "pages"],
        (old = []) => old.filter(p => p.id !== pageId)
      );
      
      if (selectedPageId === pageId && previousPages && previousPages.length > 1) {
        const currentIndex = previousPages.findIndex((p) => p.id === pageId);
        const nextPage = previousPages[currentIndex + 1] || previousPages[currentIndex - 1];
        setSelectedPageId(nextPage?.id || null);
      } else if (selectedPageId === pageId) {
        setSelectedPageId(null);
      }
      
      return { previousPages, deletedPageId: pageId };
    },
    onSuccess: () => {
      toast({
        title: "Page deleted",
        description: "The page has been removed.",
      });
    },
    onError: (_err, variables, context) => {
      queryClient.setQueryData(["/api/projects", projectId, "pages"], context?.previousPages);
      
      if (context?.deletedPageId && context?.previousPages) {
        const deletedPage = context.previousPages.find(p => p.id === context.deletedPageId);
        if (deletedPage) {
          setSelectedPageId(deletedPage.id);
        }
      }
      
      toast({
        title: "Error deleting page",
        description: "Failed to delete the page. Please try again.",
        variant: "destructive",
      });
    },
  });

  const duplicatePageMutation = useMutation({
    mutationFn: async (pageId: string) => {
      const res = await apiRequest("POST", `/api/pages/${pageId}/duplicate`);
      return await res.json();
    },
    onMutate: async (pageId: string) => {
      await queryClient.cancelQueries({ queryKey: ["/api/projects", projectId, "pages"] });
      const previousPages = queryClient.getQueryData<Page[]>(["/api/projects", projectId, "pages"]);
      const sourcePage = previousPages?.find(p => p.id === pageId);
      
      if (sourcePage) {
        const tempPage: Page = {
          ...sourcePage,
          id: `temp-${Date.now()}`,
          title: `${sourcePage.title} (Copy)`,
          order: localPages.length,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        queryClient.setQueryData<Page[]>(
          ["/api/projects", projectId, "pages"],
          (old = []) => [...old, tempPage]
        );
        
        return { previousPages, tempPage };
      }
      
      return { previousPages };
    },
    onSuccess: (duplicatedPage: Page, _variables, context) => {
      queryClient.setQueryData<Page[]>(
        ["/api/projects", projectId, "pages"],
        (old = []) => old.map(p => p.id === context?.tempPage?.id ? duplicatedPage : p)
      );
      setSelectedPageId(duplicatedPage.id);
      toast({
        title: "Page duplicated",
        description: "A copy of the page has been created.",
      });
    },
    onError: (_err, _variables, context) => {
      queryClient.setQueryData(["/api/projects", projectId, "pages"], context?.previousPages);
      toast({
        title: "Error duplicating page",
        description: "Failed to duplicate the page. Please try again.",
        variant: "destructive",
      });
    },
  });

  const reorderPagesMutation = useMutation({
    mutationFn: async (pageIds: string[]) => {
      return await apiRequest("POST", `/api/pages/reorder`, { projectId, pageIds });
    },
  });

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(localPages);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setLocalPages(items);
    reorderPagesMutation.mutate(items.map((page) => page.id));
  };

  const handleCreatePage = () => {
    if (newPageTitle.trim()) {
      createPageMutation.mutate(newPageTitle.trim());
    }
  };

  const handleDeletePage = (pageId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (localPages.length === 1) {
      toast({
        title: "Cannot delete",
        description: "You must have at least one page.",
        variant: "destructive",
      });
      return;
    }
    deletePageMutation.mutate(pageId);
  };

  const handleDuplicatePage = (pageId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    duplicatePageMutation.mutate(pageId);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Loading pages...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      {/* Pages Sidebar */}
      <div className="w-64 border-r bg-muted/20 flex flex-col">
        <div className="p-4 border-b">
          <h2 className="font-semibold text-lg mb-2">Pages</h2>
          {!showNewPageInput ? (
            <Button
              onClick={() => setShowNewPageInput(true)}
              className="w-full"
              size="sm"
              data-testid="button-new-page"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Page
            </Button>
          ) : (
            <div className="space-y-2">
              <Input
                value={newPageTitle}
                onChange={(e) => setNewPageTitle(e.target.value)}
                placeholder="Page title"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreatePage();
                  if (e.key === "Escape") {
                    setShowNewPageInput(false);
                    setNewPageTitle("");
                  }
                }}
                autoFocus
                data-testid="input-new-page-title"
              />
              <div className="flex gap-2">
                <Button
                  onClick={handleCreatePage}
                  size="sm"
                  className="flex-1"
                  disabled={!newPageTitle.trim()}
                  data-testid="button-create-page"
                >
                  Create
                </Button>
                <Button
                  onClick={() => {
                    setShowNewPageInput(false);
                    setNewPageTitle("");
                  }}
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  data-testid="button-cancel-new-page"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>

        <ScrollArea className="flex-1">
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="pages">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="p-2 space-y-1"
                >
                  {localPages.map((page, index) => (
                    <Draggable key={page.id} draggableId={page.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`group relative ${
                            snapshot.isDragging ? "opacity-50" : ""
                          }`}
                        >
                          <div
                            className={`flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors ${
                              selectedPageId === page.id
                                ? "bg-primary/10 text-primary"
                                : "hover-elevate"
                            }`}
                            onClick={() => setSelectedPageId(page.id)}
                            data-testid={`page-item-${page.id}`}
                          >
                            <div
                              {...provided.dragHandleProps}
                              className="cursor-grab active:cursor-grabbing"
                            >
                              <GripVertical className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <FileText className="h-4 w-4 flex-shrink-0" />
                            <span className="flex-1 text-sm truncate">{page.title}</span>
                            
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={(e) => handleDuplicatePage(page.id, e)}
                                className="h-6 w-6"
                                data-testid={`button-duplicate-page-${page.id}`}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={(e) => handleDeletePage(page.id, e)}
                                className="h-6 w-6"
                                disabled={localPages.length === 1}
                                data-testid={`button-delete-page-${page.id}`}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
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

      {/* Block Editor Area */}
      <div className="flex-1 flex flex-col">
        {selectedPageId ? (
          <BlockEditor key={selectedPageId} projectId={projectId!} pageId={selectedPageId} />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No pages yet. Create your first page to get started.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
