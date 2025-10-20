/**
 * ProductifyAI Visual Editor
 * Professional canvas-based editor with Figma/Framer quality UX
 */

import { useEffect, useState, useCallback } from 'react';
import { useRoute } from 'wouter';
import { useEditorStore } from '@/stores/editorStore';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { saveProjectState, loadProjectState } from '@/utils/storage';
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
  Maximize2,
  Activity,
  Download,
} from 'lucide-react';
import { EditorToolbar } from '@/components/editor/EditorToolbar';
import { EditorCanvas } from '@/components/editor/EditorCanvas';
import { LayersPanel } from '@/components/editor/LayersPanel';
import { PropertiesPanel } from '@/components/editor/PropertiesPanel';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function VisualEditor() {
  const [match, params] = useRoute('/editor/:projectId');
  const projectId = params?.projectId || '1';
  const { toast } = useToast();
  
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saving, setSaving] = useState(false);

  const {
    layers,
    zoom,
    pan,
    setZoom,
    setPan,
    gridEnabled,
    snapEnabled,
    toggleGrid,
    toggleSnap,
    toggleFPS,
    showFPS,
    undo,
    redo,
    history,
    historyIndex,
    selectedLayerIds,
    deleteLayer,
    duplicateSelection,
    centerOnSelection,
    zoomToFit,
    groupLayers,
  } = useEditorStore();

  // Load project from localStorage on mount
  useEffect(() => {
    const savedState = loadProjectState(projectId);
    
    if (savedState) {
      useEditorStore.setState({
        layers: savedState.layers,
        zoom: savedState.zoom,
        pan: savedState.pan,
      });
      setLastSaved(new Date(savedState.lastSaved));
      
      toast({
        title: 'Project restored',
        description: 'Your last session has been restored.',
      });
    }
  }, [projectId, toast]);

  // Autosave every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (layers.length > 0) {
        handleSave(true);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [layers]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in input
      if ((e.target as HTMLElement).tagName === 'INPUT' || 
          (e.target as HTMLElement).tagName === 'TEXTAREA') {
        return;
      }

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
      
      // Duplicate: Ctrl+D
      if (e.ctrlKey && e.key === 'd') {
        e.preventDefault();
        duplicateSelection();
      }
      
      // Delete: Delete or Backspace
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        selectedLayerIds.forEach(id => deleteLayer(id));
      }
      
      // Save: Ctrl+S
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        handleSave(false);
      }
      
      // Toggle grid: Ctrl+G
      if (e.ctrlKey && e.key === 'g') {
        e.preventDefault();
        toggleGrid();
      }
      
      // Deselect: Escape
      if (e.key === 'Escape') {
        e.preventDefault();
        useEditorStore.getState().clearSelection();
      }
      
      // Center on selection: F
      if (e.key === 'f') {
        e.preventDefault();
        centerOnSelection();
      }
      
      // Zoom to fit: Ctrl+0
      if (e.ctrlKey && e.key === '0') {
        e.preventDefault();
        zoomToFit();
      }
      
      // Group: Ctrl+G
      if (e.ctrlKey && e.key === 'g' && !e.shiftKey && selectedLayerIds.length > 1) {
        e.preventDefault();
        groupLayers(selectedLayerIds);
      }
      
      // Arrow key nudging
      const nudgeDistance = e.shiftKey ? 10 : 1;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        
        selectedLayerIds.forEach(id => {
          const layer = layers.find(l => l.id === id);
          if (!layer || layer.locked) return;

          const updates: Partial<typeof layer> = {};
          
          if (e.key === 'ArrowUp') updates.y = layer.y - nudgeDistance;
          if (e.key === 'ArrowDown') updates.y = layer.y + nudgeDistance;
          if (e.key === 'ArrowLeft') updates.x = layer.x - nudgeDistance;
          if (e.key === 'ArrowRight') updates.x = layer.x + nudgeDistance;
          
          useEditorStore.getState().updateLayer(id, updates);
        });
        
        // Save history after nudging
        setTimeout(() => useEditorStore.getState().saveHistory(), 100);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedLayerIds, layers]);

  const handleSave = useCallback(async (isAutosave = false) => {
    setSaving(true);
    try {
      // Save to localStorage
      saveProjectState(projectId, { layers, zoom, pan });
      
      // TODO: Save to backend
      await new Promise((resolve) => setTimeout(resolve, 300));
      
      const now = new Date();
      setLastSaved(now);
      
      if (!isAutosave) {
        toast({
          title: 'Project saved',
          description: 'Your changes have been saved successfully.',
        });
      }
    } catch (error) {
      if (!isAutosave) {
        toast({
          title: 'Save failed',
          description: 'Failed to save your project. Please try again.',
          variant: 'destructive',
        });
      }
    } finally {
      setSaving(false);
    }
  }, [projectId, layers, zoom, pan, toast]);

  const handleZoomIn = () => setZoom(Math.min(5, zoom + 0.1));
  const handleZoomOut = () => setZoom(Math.max(0.1, zoom - 0.1));
  const handleResetZoom = () => { setZoom(1); setPan({ x: 0, y: 0 }); };

  const getLastSavedText = () => {
    if (!lastSaved) return 'Not saved yet';
    if (saving) return 'Saving...';
    
    const now = new Date();
    const diffMs = now.getTime() - lastSaved.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    
    if (diffSecs < 10) return 'Saved just now';
    if (diffSecs < 60) return `Saved ${diffSecs}s ago`;
    
    const diffMins = Math.floor(diffSecs / 60);
    if (diffMins === 1) return 'Saved 1 min ago';
    if (diffMins < 60) return `Saved ${diffMins} mins ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return 'Saved 1 hour ago';
    return `Saved ${diffHours} hours ago`;
  };

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Top Bar */}
      <header className="flex items-center justify-between px-4 py-2.5 border-b bg-background/95 backdrop-blur-sm z-50 shadow-sm">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold">Visual Editor</h1>
          <span className="text-sm text-muted-foreground">
            Project #{projectId}
          </span>
          <div className="text-xs px-2 py-1 rounded-md bg-muted text-muted-foreground">
            {layers.length} {layers.length === 1 ? 'layer' : 'layers'}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Undo/Redo */}
          <Button
            variant="ghost"
            size="icon"
            onClick={undo}
            disabled={historyIndex <= 0}
            title="Undo (Ctrl+Z)"
            className="hover-elevate"
          >
            <Undo2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={redo}
            disabled={historyIndex >= history.length - 1}
            title="Redo (Ctrl+Y)"
            className="hover-elevate"
          >
            <Redo2 className="h-4 w-4" />
          </Button>

          <div className="w-px h-6 bg-border mx-1" />

          {/* Zoom Controls */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleZoomOut}
            title="Zoom Out"
            disabled={zoom <= 0.1}
            className="hover-elevate"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <button
            className="text-sm font-medium min-w-[70px] text-center px-2 py-1 rounded hover:bg-muted transition-colors"
            onClick={handleResetZoom}
            title="Reset Zoom (Click) | Zoom to Fit (Ctrl+0)"
          >
            {Math.round(zoom * 100)}%
          </button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleZoomIn}
            title="Zoom In"
            disabled={zoom >= 5}
            className="hover-elevate"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={zoomToFit}
            title="Zoom to Fit (Ctrl+0)"
            className="hover-elevate"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>

          <div className="w-px h-6 bg-border mx-1" />

          {/* Grid & Snap Toggle */}
          <Button
            variant={gridEnabled ? "default" : "ghost"}
            size="icon"
            onClick={toggleGrid}
            title="Toggle Grid (Ctrl+G)"
            className="hover-elevate"
          >
            <Grid3x3 className="h-4 w-4" />
          </Button>
          <Button
            variant={showFPS ? "default" : "ghost"}
            size="icon"
            onClick={toggleFPS}
            title="Toggle FPS Meter"
            className="hover-elevate"
          >
            <Activity className="h-4 w-4" />
          </Button>

          <div className="w-px h-6 bg-border mx-1" />

          {/* Save Status */}
          <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-muted/50 min-w-[140px]">
            <div className={`w-2 h-2 rounded-full ${saving ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`} />
            <span className="text-xs text-muted-foreground">
              {getLastSavedText()}
            </span>
          </div>

          {/* Actions */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSave(false)}
            disabled={saving}
            className="hover-elevate"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save'}
          </Button>
          <Button size="sm" className="hover-elevate">
            <Play className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button variant="outline" size="sm" className="hover-elevate" title="Export project">
            <Download className="h-4 w-4" />
          </Button>

          <ThemeToggle />
        </div>
      </header>

      {/* Main Editor Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Panel - Layers & Assets */}
        <div
          className={`flex-shrink-0 border-r bg-background/50 backdrop-blur-sm transition-all duration-200 ease-in-out ${
            leftPanelOpen ? 'w-64' : 'w-0'
          } overflow-hidden shadow-sm`}
        >
          <LayersPanel />
        </div>

        {/* Left Panel Toggle */}
        <button
          onClick={() => setLeftPanelOpen(!leftPanelOpen)}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-7 h-20 bg-background/95 backdrop-blur-sm border border-l-0 rounded-r-lg flex items-center justify-center hover:bg-muted transition-all duration-200 shadow-md hover:shadow-lg hover:w-8"
          style={{ left: leftPanelOpen ? '256px' : '0' }}
          title={leftPanelOpen ? 'Collapse left panel' : 'Expand left panel'}
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
          className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-7 h-20 bg-background/95 backdrop-blur-sm border border-r-0 rounded-l-lg flex items-center justify-center hover:bg-muted transition-all duration-200 shadow-md hover:shadow-lg hover:w-8"
          style={{ right: rightPanelOpen ? '320px' : '0' }}
          title={rightPanelOpen ? 'Collapse right panel' : 'Expand right panel'}
        >
          {rightPanelOpen ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>

        {/* Right Panel - Properties */}
        <div
          className={`flex-shrink-0 border-l bg-background/50 backdrop-blur-sm transition-all duration-200 ease-in-out ${
            rightPanelOpen ? 'w-80' : 'w-0'
          } overflow-hidden shadow-sm`}
        >
          <PropertiesPanel />
        </div>
      </div>

      {/* Keyboard Shortcuts Help (Hidden, for reference) */}
      <div className="sr-only" aria-live="polite">
        Keyboard shortcuts: Ctrl+Z (Undo), Ctrl+Y (Redo), Ctrl+D (Duplicate), 
        Delete (Remove), Ctrl+S (Save), Ctrl+G (Toggle Grid), Escape (Deselect),
        F (Center), Ctrl+0 (Zoom to Fit), Arrow Keys (Nudge)
      </div>
    </div>
  );
});
