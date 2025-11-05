/**
 * Layers Panel
 * Left sidebar showing layer hierarchy and assets
 */

import { useState } from 'react';
import { useEditorStore } from '@/stores/editorStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plus,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Type,
  Image,
  Video,
  Square,
  Trash2,
  Copy,
} from 'lucide-react';
import type { Layer } from '@/types/editor';

export function LayersPanel() {
  const {
    layers,
    selectedLayerIds,
    addLayer,
    selectLayer,
    deleteLayer,
    duplicateLayer,
    updateLayer,
  } = useEditorStore();

  const [searchQuery, setSearchQuery] = useState('');

  // Create new layer
  const createLayer = (type: Layer['type']) => {
    const newLayer: Layer = {
      id: `layer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      name: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
      x: 100,
      y: 100,
      width: type === 'text' ? 200 : 150,
      height: type === 'text' ? 50 : 150,
      zIndex: layers.length,
      opacity: 1,
      visible: true,
      locked: false,
      style: type === 'text' ? {
        fontSize: 16,
        color: '#000000',
        fontWeight: 'normal',
      } : type === 'shape' ? {
        background: '#A855F7',
        borderRadius: 8,
      } : {},
      content: type === 'text' ? 'New text layer' : undefined,
    };

    addLayer(newLayer);
    selectLayer(newLayer.id);
  };

  // Get icon for layer type
  const getLayerIcon = (type: Layer['type']) => {
    switch (type) {
      case 'text': return Type;
      case 'image': return Image;
      case 'video': return Video;
      case 'shape': return Square;
      default: return Square;
    }
  };

  // Filter layers
  const filteredLayers = layers.filter((layer) =>
    layer.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sort by z-index descending (top layers first in list)
  const sortedLayers = [...filteredLayers].sort((a, b) => b.zIndex - a.zIndex);

  return (
    <div className="h-full flex flex-col">
      <Tabs defaultValue="layers" className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-2 m-2">
          <TabsTrigger value="layers">Layers</TabsTrigger>
          <TabsTrigger value="assets">Assets</TabsTrigger>
        </TabsList>

        <TabsContent value="layers" className="flex-1 flex flex-col mt-0 p-2 space-y-2">
          {/* Search */}
          <Input
            placeholder="Search layers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8"
          />

          {/* Add Layer Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => createLayer('text')}
              className="justify-start"
            >
              <Type className="h-3 w-3 mr-2" />
              Text
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => createLayer('image')}
              className="justify-start"
            >
              <Image className="h-3 w-3 mr-2" />
              Image
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => createLayer('video')}
              className="justify-start"
            >
              <Video className="h-3 w-3 mr-2" />
              Video
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => createLayer('shape')}
              className="justify-start"
            >
              <Square className="h-3 w-3 mr-2" />
              Shape
            </Button>
          </div>

          {/* Layers List */}
          <ScrollArea className="flex-1">
            <div className="space-y-1">
              {sortedLayers.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  No layers yet. Add one to get started.
                </div>
              ) : (
                sortedLayers.map((layer) => {
                  const Icon = getLayerIcon(layer.type);
                  const isSelected = selectedLayerIds.includes(layer.id);

                  return (
                    <div
                      key={layer.id}
                      className={`group flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-muted'
                      }`}
                      onClick={() => selectLayer(layer.id)}
                    >
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      <span className="flex-1 text-sm truncate">{layer.name}</span>
                      
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation();
                            updateLayer(layer.id, { visible: !layer.visible });
                          }}
                        >
                          {layer.visible ? (
                            <Eye className="h-3 w-3" />
                          ) : (
                            <EyeOff className="h-3 w-3" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation();
                            updateLayer(layer.id, { locked: !layer.locked });
                          }}
                        >
                          {layer.locked ? (
                            <Lock className="h-3 w-3" />
                          ) : (
                            <Unlock className="h-3 w-3" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation();
                            duplicateLayer(layer.id);
                          }}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteLayer(layer.id);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="assets" className="flex-1 flex flex-col mt-0 p-2 space-y-2">
          <Button variant="outline" size="sm">
            <Plus className="h-3 w-3 mr-2" />
            Upload Assets
          </Button>

          <ScrollArea className="flex-1">
            <div className="grid grid-cols-2 gap-2">
              {/* Placeholder for uploaded assets */}
              <div className="aspect-square bg-muted rounded-lg flex items-center justify-center text-xs text-muted-foreground">
                No assets
              </div>
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}

