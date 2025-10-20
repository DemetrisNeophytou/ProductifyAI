/**
 * AI Command Palette
 * Quick access to AI-powered canvas commands (Ctrl+K)
 */

import { useState, useEffect } from 'react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Sparkles,
  AlignCenter,
  Grid3x3,
  FileText,
  Palette,
  Wand2,
  ArrowLeftRight,
  ArrowUpDown,
  Maximize2,
  Target,
} from 'lucide-react';
import { useEditorStore } from '@/stores/editorStore';
import { useToast } from '@/hooks/use-toast';
import {
  generateLayoutFromPrompt,
  autoNameLayers,
  autoAlignLayers,
  analyzeDesign,
  describeLayout,
  distributeLayersEvenly,
} from '@/utils/aiMock';

interface AICommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AICommandPalette({ open, onOpenChange }: AICommandPaletteProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  const {
    layers,
    selectedLayerIds,
    addLayer,
    updateLayerBatch,
    saveHistory,
    centerOnSelection,
    zoomToFit,
  } = useEditorStore();

  const selectedLayers = layers.filter(l => selectedLayerIds.includes(l.id));

  const runCommand = async (command: () => Promise<void>) => {
    setLoading(true);
    try {
      await command();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Command failed',
        description: 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const commands = [
    {
      group: 'AI Generate',
      items: [
        {
          icon: Wand2,
          label: 'Generate pricing section',
          keywords: ['pricing', 'cards', 'plans'],
          action: () => runCommand(async () => {
            const newLayers = await generateLayoutFromPrompt('pricing section');
            newLayers.forEach(layer => addLayer(layer));
            toast({ title: 'Pricing section created', description: `Added ${newLayers.length} layers.` });
          }),
        },
        {
          icon: Wand2,
          label: 'Generate hero section',
          keywords: ['hero', 'banner', 'header'],
          action: () => runCommand(async () => {
            const newLayers = await generateLayoutFromPrompt('hero section');
            newLayers.forEach(layer => addLayer(layer));
            toast({ title: 'Hero section created', description: `Added ${newLayers.length} layers.` });
          }),
        },
        {
          icon: Wand2,
          label: 'Generate testimonial section',
          keywords: ['testimonial', 'reviews', 'quotes'],
          action: () => runCommand(async () => {
            const newLayers = await generateLayoutFromPrompt('testimonial section');
            newLayers.forEach(layer => addLayer(layer));
            toast({ title: 'Testimonial section created', description: `Added ${newLayers.length} layers.` });
          }),
        },
      ],
    },
    {
      group: 'AI Actions',
      items: [
        {
          icon: Grid3x3,
          label: 'Align all layers to grid',
          keywords: ['align', 'grid', 'snap'],
          action: () => runCommand(async () => {
            const alignments = await autoAlignLayers(layers);
            updateLayerBatch(alignments);
            saveHistory();
            toast({ title: 'Layers aligned', description: 'All layers snapped to grid.' });
          }),
          disabled: layers.length === 0,
        },
        {
          icon: FileText,
          label: 'Auto-name all layers',
          keywords: ['name', 'rename', 'label'],
          action: () => runCommand(async () => {
            const renames = await autoNameLayers(layers);
            const updates = renames.map(r => ({ id: r.id, updates: { name: r.name } }));
            updateLayerBatch(updates);
            saveHistory();
            toast({ title: 'Layers renamed', description: `Renamed ${renames.length} layers.` });
          }),
          disabled: layers.length === 0,
        },
        {
          icon: ArrowLeftRight,
          label: 'Distribute horizontally',
          keywords: ['distribute', 'space', 'horizontal'],
          action: () => runCommand(async () => {
            const updates = await distributeLayersEvenly(selectedLayers, 'horizontal');
            updateLayerBatch(updates);
            saveHistory();
            toast({ title: 'Layers distributed', description: 'Evenly spaced horizontally.' });
          }),
          disabled: selectedLayers.length < 2,
        },
        {
          icon: ArrowUpDown,
          label: 'Distribute vertically',
          keywords: ['distribute', 'space', 'vertical'],
          action: () => runCommand(async () => {
            const updates = await distributeLayersEvenly(selectedLayers, 'vertical');
            updateLayerBatch(updates);
            saveHistory();
            toast({ title: 'Layers distributed', description: 'Evenly spaced vertically.' });
          }),
          disabled: selectedLayers.length < 2,
        },
        {
          icon: Sparkles,
          label: 'Describe current layout',
          keywords: ['describe', 'explain', 'summary'],
          action: () => runCommand(async () => {
            const description = await describeLayout(layers);
            toast({ title: 'Layout Description', description });
          }),
          disabled: layers.length === 0,
        },
        {
          icon: Palette,
          label: 'Analyze design quality',
          keywords: ['analyze', 'check', 'quality'],
          action: () => runCommand(async () => {
            const analysis = await analyzeDesign(layers);
            toast({ 
              title: `Design Score: ${analysis.score}/100`, 
              description: analysis.issues.length === 0 ? 'Looks great!' : `Found ${analysis.issues.length} issues.`
            });
          }),
          disabled: layers.length === 0,
        },
      ],
    },
    {
      group: 'Navigation',
      items: [
        {
          icon: Target,
          label: 'Center on selection',
          keywords: ['center', 'focus', 'view'],
          action: () => {
            centerOnSelection();
            onOpenChange(false);
            toast({ title: 'Centered', description: 'Viewport centered on selection.' });
          },
          disabled: selectedLayers.length === 0,
        },
        {
          icon: Maximize2,
          label: 'Zoom to fit all layers',
          keywords: ['zoom', 'fit', 'view'],
          action: () => {
            zoomToFit();
            onOpenChange(false);
            toast({ title: 'Zoomed to fit', description: 'All layers visible.' });
          },
          disabled: layers.length === 0,
        },
      ],
    },
  ];

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No commands found.</CommandEmpty>
        
        {commands.map((group, groupIndex) => (
          <div key={groupIndex}>
            <CommandGroup heading={group.group}>
              {group.items.map((item, itemIndex) => {
                const Icon = item.icon;
                return (
                  <CommandItem
                    key={itemIndex}
                    onSelect={item.action}
                    disabled={item.disabled || loading}
                    keywords={item.keywords}
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    <span>{item.label}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
            {groupIndex < commands.length - 1 && <CommandSeparator />}
          </div>
        ))}
      </CommandList>
    </CommandDialog>
  );
}

