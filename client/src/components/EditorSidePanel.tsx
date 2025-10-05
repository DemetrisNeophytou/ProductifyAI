import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Image, Palette, Type, X } from "lucide-react";
import { PhotosTab } from "./editor-tabs/PhotosTab";
import { GraphicsTab } from "./editor-tabs/GraphicsTab";
import { BrandKitTab } from "./editor-tabs/BrandKitTab";

interface EditorSidePanelProps {
  projectId: string;
  onInsertPhoto?: (url: string, source: string) => void;
  onInsertGraphic?: (svg: string, color: string) => void;
  onBrandKitChange?: (brandKit: { fonts: { heading: string; body: string }; colors: string[] }) => void;
  currentBrandKit?: { fonts: { heading: string; body: string }; colors: string[] };
}

export function EditorSidePanel({
  projectId,
  onInsertPhoto,
  onInsertGraphic,
  onBrandKitChange,
  currentBrandKit,
}: EditorSidePanelProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("photos");

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="default"
          className="fixed right-0 top-1/2 -translate-y-1/2 rounded-l-lg rounded-r-none z-40"
          data-testid="button-open-asset-panel"
        >
          <Palette className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:w-[400px] p-0">
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold">Content Library</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setOpen(false)}
              data-testid="button-close-asset-panel"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <TabsList className="w-full rounded-none border-b grid grid-cols-3">
              <TabsTrigger value="photos" className="gap-2" data-testid="tab-photos">
                <Image className="h-4 w-4" />
                <span className="hidden sm:inline">Photos</span>
              </TabsTrigger>
              <TabsTrigger value="graphics" className="gap-2" data-testid="tab-graphics">
                <Palette className="h-4 w-4" />
                <span className="hidden sm:inline">Graphics</span>
              </TabsTrigger>
              <TabsTrigger value="brand" className="gap-2" data-testid="tab-brand">
                <Type className="h-4 w-4" />
                <span className="hidden sm:inline">Brand Kit</span>
              </TabsTrigger>
            </TabsList>

            <ScrollArea className="flex-1">
              <TabsContent value="photos" className="m-0 p-4">
                <PhotosTab
                  projectId={projectId}
                  onInsert={onInsertPhoto}
                />
              </TabsContent>

              <TabsContent value="graphics" className="m-0 p-4">
                <GraphicsTab
                  onInsert={onInsertGraphic}
                />
              </TabsContent>

              <TabsContent value="brand" className="m-0 p-4">
                <BrandKitTab
                  projectId={projectId}
                  currentBrandKit={currentBrandKit}
                  onChange={onBrandKitChange}
                />
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}
