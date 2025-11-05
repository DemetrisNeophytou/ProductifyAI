/**
 * Properties Panel
 * Right sidebar showing selected layer's properties
 */

import { useEditorStore } from '@/stores/editorStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  ArrowUp,
  ArrowDown,
  Copy,
  Trash2,
} from 'lucide-react';

const fontFamilies = ['Inter', 'Arial', 'Georgia', 'Courier New', 'Verdana'];
const fontWeights = ['normal', 'medium', 'semibold', 'bold'];

export function PropertiesPanel() {
  const {
    layers,
    selectedLayerIds,
    updateLayer,
    deleteLayer,
    duplicateLayer,
    bringToFront,
    sendToBack,
  } = useEditorStore();

  const selectedLayer = layers.find((l) => l.id === selectedLayerIds[0]);

  if (!selectedLayer) {
    return (
      <div className="h-full flex items-center justify-center p-6 text-center">
        <div>
          <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
            <Copy className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">
            Select a layer to edit its properties
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <h3 className="font-semibold mb-1">Properties</h3>
        <p className="text-xs text-muted-foreground">{selectedLayer.name}</p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Layer Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => duplicateLayer(selectedLayer.id)}
            >
              <Copy className="h-3 w-3 mr-2" />
              Duplicate
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-destructive"
              onClick={() => deleteLayer(selectedLayer.id)}
            >
              <Trash2 className="h-3 w-3 mr-2" />
              Delete
            </Button>
          </div>

          <Separator />

          <Accordion type="multiple" defaultValue={['position', 'style', 'layer']} className="w-full">
            {/* Position & Size */}
            <AccordionItem value="position">
              <AccordionTrigger className="text-sm font-medium">
                Position & Size
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="x" className="text-xs">X</Label>
                    <Input
                      id="x"
                      type="number"
                      value={Math.round(selectedLayer.x)}
                      onChange={(e) => updateLayer(selectedLayer.id, { x: Number(e.target.value) })}
                      className="h-8"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="y" className="text-xs">Y</Label>
                    <Input
                      id="y"
                      type="number"
                      value={Math.round(selectedLayer.y)}
                      onChange={(e) => updateLayer(selectedLayer.id, { y: Number(e.target.value) })}
                      className="h-8"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="width" className="text-xs">Width</Label>
                    <Input
                      id="width"
                      type="number"
                      value={Math.round(selectedLayer.width)}
                      onChange={(e) => updateLayer(selectedLayer.id, { width: Number(e.target.value) })}
                      className="h-8"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="height" className="text-xs">Height</Label>
                    <Input
                      id="height"
                      type="number"
                      value={Math.round(selectedLayer.height)}
                      onChange={(e) => updateLayer(selectedLayer.id, { height: Number(e.target.value) })}
                      className="h-8"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rotation" className="text-xs">
                    Rotation: {selectedLayer.rotation || 0}°
                  </Label>
                  <Slider
                    id="rotation"
                    value={[selectedLayer.rotation || 0]}
                    onValueChange={([value]) => updateLayer(selectedLayer.id, { rotation: value })}
                    min={0}
                    max={360}
                    step={1}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="opacity" className="text-xs">
                    Opacity: {Math.round((selectedLayer.opacity ?? 1) * 100)}%
                  </Label>
                  <Slider
                    id="opacity"
                    value={[(selectedLayer.opacity ?? 1) * 100]}
                    onValueChange={([value]) => updateLayer(selectedLayer.id, { opacity: value / 100 })}
                    min={0}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Style */}
            <AccordionItem value="style">
              <AccordionTrigger className="text-sm font-medium">
                Style
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-2">
                {/* Background */}
                <div className="space-y-2">
                  <Label htmlFor="background" className="text-xs">Background</Label>
                  <div className="flex gap-2">
                    <Input
                      id="background"
                      type="color"
                      value={selectedLayer.style?.background || '#ffffff'}
                      onChange={(e) =>
                        updateLayer(selectedLayer.id, {
                          style: { ...selectedLayer.style, background: e.target.value },
                        })
                      }
                      className="h-8 w-16"
                    />
                    <Input
                      type="text"
                      value={selectedLayer.style?.background || '#ffffff'}
                      onChange={(e) =>
                        updateLayer(selectedLayer.id, {
                          style: { ...selectedLayer.style, background: e.target.value },
                        })
                      }
                      className="h-8 flex-1 font-mono text-xs"
                    />
                  </div>
                </div>

                {/* Border Radius */}
                <div className="space-y-2">
                  <Label htmlFor="borderRadius" className="text-xs">
                    Border Radius: {selectedLayer.style?.borderRadius || 0}px
                  </Label>
                  <Slider
                    id="borderRadius"
                    value={[selectedLayer.style?.borderRadius || 0]}
                    onValueChange={([value]) =>
                      updateLayer(selectedLayer.id, {
                        style: { ...selectedLayer.style, borderRadius: value },
                      })
                    }
                    min={0}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                </div>

                {/* Text-specific properties */}
                {selectedLayer.type === 'text' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="fontSize" className="text-xs">
                        Font Size: {selectedLayer.style?.fontSize || 16}px
                      </Label>
                      <Slider
                        id="fontSize"
                        value={[selectedLayer.style?.fontSize || 16]}
                        onValueChange={([value]) =>
                          updateLayer(selectedLayer.id, {
                            style: { ...selectedLayer.style, fontSize: value },
                          })
                        }
                        min={8}
                        max={72}
                        step={1}
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="fontFamily" className="text-xs">Font Family</Label>
                      <Select
                        value={selectedLayer.style?.fontFamily || 'Inter'}
                        onValueChange={(value) =>
                          updateLayer(selectedLayer.id, {
                            style: { ...selectedLayer.style, fontFamily: value },
                          })
                        }
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {fontFamilies.map((font) => (
                            <SelectItem key={font} value={font}>
                              {font}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="fontWeight" className="text-xs">Font Weight</Label>
                      <Select
                        value={selectedLayer.style?.fontWeight || 'normal'}
                        onValueChange={(value) =>
                          updateLayer(selectedLayer.id, {
                            style: { ...selectedLayer.style, fontWeight: value },
                          })
                        }
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {fontWeights.map((weight) => (
                            <SelectItem key={weight} value={weight}>
                              {weight}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="textColor" className="text-xs">Text Color</Label>
                      <div className="flex gap-2">
                        <Input
                          id="textColor"
                          type="color"
                          value={selectedLayer.style?.color || '#000000'}
                          onChange={(e) =>
                            updateLayer(selectedLayer.id, {
                              style: { ...selectedLayer.style, color: e.target.value },
                            })
                          }
                          className="h-8 w-16"
                        />
                        <Input
                          type="text"
                          value={selectedLayer.style?.color || '#000000'}
                          onChange={(e) =>
                            updateLayer(selectedLayer.id, {
                              style: { ...selectedLayer.style, color: e.target.value },
                            })
                          }
                          className="h-8 flex-1 font-mono text-xs"
                        />
                      </div>
                    </div>
                  </>
                )}
              </AccordionContent>
            </AccordionItem>

            {/* Layer Order */}
            <AccordionItem value="layer">
              <AccordionTrigger className="text-sm font-medium">
                Layer Order
              </AccordionTrigger>
              <AccordionContent className="space-y-2 pt-2">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => bringToFront(selectedLayer.id)}
                  >
                    <ArrowUp className="h-3 w-3 mr-2" />
                    Bring Forward
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => sendToBack(selectedLayer.id)}
                  >
                    <ArrowDown className="h-3 w-3 mr-2" />
                    Send Backward
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground text-center">
                  Z-Index: {selectedLayer.zIndex}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </ScrollArea>
    </div>
  );
}

