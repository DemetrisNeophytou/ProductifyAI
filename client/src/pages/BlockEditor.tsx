import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  GripVertical,
  Plus,
  Trash2,
  Type,
  AlignLeft,
  Image as ImageIcon,
  MousePointer,
  List,
  Quote,
  Table,
} from "lucide-react";
import type {
  Page,
  Block,
  BlockType,
  HeadingContent,
  ParagraphContent,
  ImageContent,
  CTAContent,
  ListContent,
  QuoteContent,
  TableContent,
} from "@shared/schema";
import { HeadingBlock } from "@/components/blocks/HeadingBlock";
import { ParagraphBlock } from "@/components/blocks/ParagraphBlock";
import { ImageBlock } from "@/components/blocks/ImageBlock";
import { CTABlock } from "@/components/blocks/CTABlock";
import { ListBlock } from "@/components/blocks/ListBlock";
import { QuoteBlock } from "@/components/blocks/QuoteBlock";
import { TableBlock } from "@/components/blocks/TableBlock";

const blockTypeConfig = {
  heading: { icon: Type, label: "Heading" },
  paragraph: { icon: AlignLeft, label: "Paragraph" },
  image: { icon: ImageIcon, label: "Image" },
  cta: { icon: MousePointer, label: "Call to Action" },
  list: { icon: List, label: "List" },
  quote: { icon: Quote, label: "Quote" },
  table: { icon: Table, label: "Table" },
};

export default function BlockEditor() {
  const { projectId, pageId } = useParams<{ projectId: string; pageId: string }>();
  const { toast } = useToast();
  const [showBlockSelector, setShowBlockSelector] = useState(false);

  const { data: page } = useQuery<Page>({
    queryKey: ["/api/pages", pageId],
    enabled: !!pageId,
  });

  const { data: blocks = [], isLoading } = useQuery<Block[]>({
    queryKey: ["/api/pages", pageId, "blocks"],
    queryFn: async () => {
      return await fetch(`/api/pages/${pageId}/blocks`, {
        credentials: "include",
      }).then((res) => res.json());
    },
    enabled: !!pageId,
  });

  const [localBlocks, setLocalBlocks] = useState<Block[]>([]);

  useEffect(() => {
    setLocalBlocks(blocks);
  }, [blocks]);

  const updateBlockMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Block> }) => {
      return await apiRequest("PATCH", `/api/blocks/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pages", pageId, "blocks"] });
    },
  });

  const deleteBlockMutation = useMutation({
    mutationFn: async (blockId: string) => {
      return await apiRequest("DELETE", `/api/blocks/${blockId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pages", pageId, "blocks"] });
      toast({
        title: "Block deleted",
        description: "The block has been removed from your page.",
      });
    },
  });

  const createBlockMutation = useMutation({
    mutationFn: async (blockType: BlockType) => {
      const order = localBlocks.length;
      const defaultContent = getDefaultContent(blockType);
      
      return await apiRequest("POST", `/api/pages/${pageId}/blocks`, {
        type: blockType,
        content: defaultContent,
        order,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pages", pageId, "blocks"] });
      setShowBlockSelector(false);
      toast({
        title: "Block added",
        description: "Your new block has been added to the page.",
      });
    },
  });

  const reorderBlocksMutation = useMutation({
    mutationFn: async (blockIds: string[]) => {
      return await apiRequest("POST", `/api/blocks/reorder`, { pageId, blockIds });
    },
  });

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(localBlocks);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setLocalBlocks(items);
    reorderBlocksMutation.mutate(items.map((block) => block.id));
  };

  const handleBlockUpdate = (blockId: string, content: any) => {
    updateBlockMutation.mutate({ id: blockId, data: { content } });
  };

  const handleBlockDelete = (blockId: string) => {
    deleteBlockMutation.mutate(blockId);
  };

  const handleAddBlock = (blockType: BlockType) => {
    createBlockMutation.mutate(blockType);
  };

  function getDefaultContent(blockType: BlockType) {
    switch (blockType) {
      case "heading":
        return { text: "New Heading", level: 2 };
      case "paragraph":
        return { text: "Start typing..." };
      case "image":
        return { url: "", alt: "", caption: "" };
      case "cta":
        return { text: "Click Here", buttonUrl: "#", buttonText: "Get Started" };
      case "list":
        return { items: [{ text: "Item 1" }, { text: "Item 2" }], style: "bullet" };
      case "quote":
        return { text: "Quote text", author: "" };
      case "table":
        return {
          headers: ["Column 1", "Column 2"],
          rows: [["Cell 1", "Cell 2"]],
        };
      default:
        return {};
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Loading blocks...</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto p-4">
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="blocks">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-4"
              >
                {localBlocks.map((block, index) => (
                  <Draggable key={block.id} draggableId={block.id} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`group relative ${
                          snapshot.isDragging ? "opacity-50" : ""
                        }`}
                      >
                        <Card className="p-4">
                          <div className="flex items-start gap-2">
                            <div
                              {...provided.dragHandleProps}
                              className="cursor-grab active:cursor-grabbing pt-2"
                            >
                              <GripVertical className="h-5 w-5 text-muted-foreground" />
                            </div>
                            
                            <div className="flex-1">
                              {block.type === "heading" && (
                                <HeadingBlock
                                  content={block.content as HeadingContent}
                                  onChange={(content: HeadingContent) => handleBlockUpdate(block.id, content)}
                                />
                              )}
                              {block.type === "paragraph" && (
                                <ParagraphBlock
                                  content={block.content as ParagraphContent}
                                  onChange={(content: ParagraphContent) => handleBlockUpdate(block.id, content)}
                                />
                              )}
                              {block.type === "image" && (
                                <ImageBlock
                                  content={block.content as ImageContent}
                                  onChange={(content: ImageContent) => handleBlockUpdate(block.id, content)}
                                />
                              )}
                              {block.type === "cta" && (
                                <CTABlock
                                  content={block.content as CTAContent}
                                  onChange={(content: CTAContent) => handleBlockUpdate(block.id, content)}
                                />
                              )}
                              {block.type === "list" && (
                                <ListBlock
                                  content={block.content as ListContent}
                                  onChange={(content: ListContent) => handleBlockUpdate(block.id, content)}
                                />
                              )}
                              {block.type === "quote" && (
                                <QuoteBlock
                                  content={block.content as QuoteContent}
                                  onChange={(content: QuoteContent) => handleBlockUpdate(block.id, content)}
                                />
                              )}
                              {block.type === "table" && (
                                <TableBlock
                                  content={block.content as TableContent}
                                  onChange={(content: TableContent) => handleBlockUpdate(block.id, content)}
                                />
                              )}
                            </div>

                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleBlockDelete(block.id)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                              data-testid={`button-delete-block-${block.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </Card>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

        {localBlocks.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No blocks yet. Add your first block to get started.</p>
          </div>
        )}
      </div>

      <div className="border-t p-4">
        {!showBlockSelector ? (
          <Button
            onClick={() => setShowBlockSelector(true)}
            className="w-full"
            data-testid="button-add-block"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Block
          </Button>
        ) : (
          <div className="space-y-2">
            <p className="text-sm font-medium mb-2">Choose a block type:</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {(Object.entries(blockTypeConfig) as [BlockType, typeof blockTypeConfig[BlockType]][]).map(([type, config]) => {
                const Icon = config.icon;
                return (
                  <Button
                    key={type}
                    variant="outline"
                    onClick={() => handleAddBlock(type)}
                    className="flex flex-col items-center gap-2 h-auto py-3"
                    data-testid={`button-add-${type}`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-xs">{config.label}</span>
                  </Button>
                );
              })}
            </div>
            <Button
              variant="ghost"
              onClick={() => setShowBlockSelector(false)}
              className="w-full"
              data-testid="button-cancel-add-block"
            >
              Cancel
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
