/**
 * Editor Toolbar
 * Tool selection and quick actions
 */

import { useEditorStore } from '@/stores/editorStore';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  MousePointer2,
  Type,
  Image,
  Video,
  Square,
  Hand,
} from 'lucide-react';
import type { Tool } from '@/types/editor';

const tools: { id: Tool; label: string; icon: React.ElementType }[] = [
  { id: 'select', label: 'Select', icon: MousePointer2 },
  { id: 'text', label: 'Text', icon: Type },
  { id: 'image', label: 'Image', icon: Image },
  { id: 'video', label: 'Video', icon: Video },
  { id: 'shape', label: 'Shape', icon: Square },
  { id: 'hand', label: 'Pan', icon: Hand },
];

export function EditorToolbar() {
  const { tool, setTool } = useEditorStore();

  return (
    <div className="flex items-center gap-1 px-4 py-2 border-b bg-background">
      <div className="flex items-center gap-1">
        {tools.map((t) => {
          const Icon = t.icon;
          return (
            <Button
              key={t.id}
              variant={tool === t.id ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setTool(t.id)}
              title={t.label}
              className="w-9 h-9 p-0"
            >
              <Icon className="h-4 w-4" />
            </Button>
          );
        })}
      </div>

      <Separator orientation="vertical" className="h-6 mx-2" />

      <span className="text-sm text-muted-foreground">
        Select a tool or press a key to get started
      </span>
    </div>
  );
}

