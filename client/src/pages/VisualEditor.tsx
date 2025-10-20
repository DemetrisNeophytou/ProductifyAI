/**
 * ProductifyAI Visual Editor
 * Professional canvas-based editor for creating digital products
 */

import { useEffect, useState, useCallback } from 'react';
import { useRoute } from 'wouter';
import { useEditorStore } from '@/stores/editorStore';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Grid3x3,
  Save,
  Play,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { EditorToolbar } from '@/components/editor/EditorToolbar';
import { EditorCanvas } from '@/components/editor/EditorCanvas';
import { LayersPanel } from '@/components/editor/LayersPanel';
import { PropertiesPanel } from '@/components/editor/PropertiesPanel';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function VisualEditor() {
  const [match, params] = useRoute('/editor/:projectId');
  const projectId = params?.projectId;
  const { toast } = useToast();
  
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saving, setSaving] = useState(false);

  const {
    zoom,
    setZoom,
    gridEnabled,
    toggleGrid,
    undo,
    redo,
    history,
    historyIndex,
  } = useEditorStore();

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Undo: Ctrl+Z
      if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      
      // Redo: Ctrl+Y or Ctrl+Shift+Z
      if ((e.ctrlKey && e.key === 'y') || (e.ctrlKey && e.shiftKey && e.key === 'z')) {
        e.preventDefault();
        redo();
      }
      
      // Toggle grid: Ctrl+G
      if (e.ctrlKey && e.key === 'g') {
        e.preventDefault();
        toggleGrid();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, toggleGrid]);

  // Autosave
  useEffect(() => {
    const interval = setInterval(() => {
      handleSave(true);
    }, 60000); // Autosave every minute

    return () => clearInterval(interval);
  }, []);

  const handleSave = useCallback(async (isAutosave = false) => {
    setSaving(true);
    try {
      // TODO: Implement actual save to backend
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      setLastSaved(new Date());
      
      if (!isAutosave) {
        toast({
          title: 'Project saved',
          description: 'Your changes have been saved successfully.',
        });
      }
    } catch (error) {
      toast({
        title: 'Save failed',
        description: 'Failed to save your project. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  }, [toast]);

  const handleZoomIn = () => setZoom(zoom + 0.1);
  const handleZoomOut = () => setZoom(zoom - 0.1);
  const handleResetZoom = () => setZoom(1);

  const getLastSavedText = () => {
    if (!lastSaved) return 'Not saved';
    if (saving) return 'Saving...';
    
    const now = new Date();
    const diffMs = now.getTime() - lastSaved.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins === 0) return 'Saved just now';
    if (diffMins === 1) return 'Saved 1 min ago';
    if (diffMins < 60) return `Saved ${diffMins} mins ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return 'Saved 1 hour ago';
    return `Saved ${diffHours} hours ago`;
  };

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Top Bar */}
      <header className="flex items-center justify-between px-4 py-2 border-b bg-background z-50">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold">Visual Editor</h1>
          <span className="text-sm text-muted-foreground">
            Project #{projectId}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Undo/Redo */}
          <Button
            variant="ghost"
            size="icon"
            onClick={undo}
            disabled={historyIndex <= 0}
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={redo}
            disabled={historyIndex >= history.length - 1}
            title="Redo (Ctrl+Y)"
          >
            <Redo2 className="h-4 w-4" />
          </Button>

          <div className="w-px h-6 bg-border mx-2" />

          {/* Zoom Controls */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleZoomOut}
            title="Zoom Out"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium min-w-[60px] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleZoomIn}
            title="Zoom In"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResetZoom}
            title="Reset Zoom"
          >
            Reset
          </Button>

          <div className="w-px h-6 bg-border mx-2" />

          {/* Grid Toggle */}
          <Button
            variant={gridEnabled ? "default" : "ghost"}
            size="icon"
            onClick={toggleGrid}
            title="Toggle Grid (Ctrl+G)"
          >
            <Grid3x3 className="h-4 w-4" />
          </Button>

          <div className="w-px h-6 bg-border mx-2" />

          {/* Save Status */}
          <span className="text-sm text-muted-foreground min-w-[120px]">
            {getLastSavedText()}
          </span>

          {/* Actions */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSave(false)}
            disabled={saving}
          >
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
          <Button size="sm">
            <Play className="h-4 w-4 mr-2" />
            Preview
          </Button>

          <ThemeToggle />
        </div>
      </header>

      {/* Main Editor Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Panel - Layers & Assets */}
        <div
          className={`flex-shrink-0 border-r bg-background transition-all duration-200 ${
            leftPanelOpen ? 'w-64' : 'w-0'
          } overflow-hidden`}
        >
          <LayersPanel />
        </div>

        {/* Left Panel Toggle */}
        <button
          onClick={() => setLeftPanelOpen(!leftPanelOpen)}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-6 h-16 bg-background border border-l-0 rounded-r-lg flex items-center justify-center hover:bg-muted transition-colors"
          style={{ left: leftPanelOpen ? '256px' : '0' }}
        >
          {leftPanelOpen ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>

        {/* Center Canvas Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <EditorToolbar />
          <EditorCanvas />
        </div>

        {/* Right Panel Toggle */}
        <button
          onClick={() => setRightPanelOpen(!rightPanelOpen)}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-6 h-16 bg-background border border-r-0 rounded-l-lg flex items-center justify-center hover:bg-muted transition-colors"
          style={{ right: rightPanelOpen ? '320px' : '0' }}
        >
          {rightPanelOpen ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>

        {/* Right Panel - Properties */}
        <div
          className={`flex-shrink-0 border-l bg-background transition-all duration-200 ${
            rightPanelOpen ? 'w-80' : 'w-0'
          } overflow-hidden`}
        >
          <PropertiesPanel />
        </div>
      </div>
    </div>
  );
}
