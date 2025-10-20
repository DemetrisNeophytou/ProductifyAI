/**
 * Editor Canvas
 * Main canvas area with zoom, pan, and layer rendering
 */

import { useRef, useState, useEffect, useCallback } from 'react';
import { useEditorStore } from '@/stores/editorStore';
import type { Layer } from '@/types/editor';
import { LayerRenderer } from './LayerRenderer';

export function EditorCanvas() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  const {
    layers,
    selectedLayerIds,
    selectLayer,
    clearSelection,
    zoom,
    pan,
    setPan,
    gridEnabled,
    tool,
  } = useEditorStore();

  // Handle canvas click
  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      clearSelection();
    }
  }, [clearSelection]);

  // Handle mouse wheel for zoom
  const handleWheel = useCallback((e: WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      useEditorStore.getState().setZoom(zoom + delta);
    }
  }, [zoom]);

  // Pan with middle mouse button or spacebar + drag
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 1 || (tool === 'hand' && e.button === 0)) {
      e.preventDefault();
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  }, [tool, pan]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    }
  }, [isPanning, panStart, setPan]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  // Attach mouse events
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.addEventListener('wheel', handleWheel, { passive: false });
    
    if (isPanning) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      canvas.removeEventListener('wheel', handleWheel);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleWheel, handleMouseMove, handleMouseUp, isPanning]);

  // Sort layers by z-index
  const sortedLayers = [...layers].sort((a, b) => a.zIndex - b.zIndex);

  return (
    <div
      ref={canvasRef}
      className={`flex-1 relative overflow-hidden ${
        isPanning || tool === 'hand' ? 'cursor-grab' : 'cursor-default'
      } ${isPanning ? 'cursor-grabbing' : ''}`}
      onClick={handleCanvasClick}
      onMouseDown={handleMouseDown}
    >
      {/* Canvas Background */}
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: 'var(--background)',
          backgroundImage: gridEnabled
            ? `
              linear-gradient(to right, hsl(var(--border)) 1px, transparent 1px),
              linear-gradient(to bottom, hsl(var(--border)) 1px, transparent 1px)
            `
            : 'none',
          backgroundSize: gridEnabled ? `${20 * zoom}px ${20 * zoom}px` : 'auto',
          backgroundPosition: `${pan.x}px ${pan.y}px`,
        }}
      />

      {/* Layers Container */}
      <div
        className="absolute"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
          left: '50%',
          top: '50%',
          marginLeft: '-500px', // Half of default canvas width
          marginTop: '-500px', // Half of default canvas height
        }}
      >
        {sortedLayers.map((layer) => (
          <LayerRenderer
            key={layer.id}
            layer={layer}
            isSelected={selectedLayerIds.includes(layer.id)}
            onSelect={(id, addToSelection) => selectLayer(id, addToSelection)}
          />
        ))}

        {/* Empty canvas message */}
        {layers.length === 0 && (
          <div
            className="absolute flex items-center justify-center text-center"
            style={{
              width: '1000px',
              height: '1000px',
              pointerEvents: 'none',
            }}
          >
            <div>
              <p className="text-2xl font-semibold text-muted-foreground mb-2">
                Your canvas is empty
              </p>
              <p className="text-sm text-muted-foreground">
                Select a tool from the toolbar and click to add elements
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

