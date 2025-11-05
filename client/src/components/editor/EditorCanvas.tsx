/**
 * Editor Canvas
 * Main canvas area with smooth zoom, pan, alignment guides, and performance optimization
 */

import { useRef, useState, useEffect, useCallback, memo } from 'react';
import { useEditorStore } from '@/stores/editorStore';
import type { Layer } from '@/types/editor';
import { LayerRenderer } from './LayerRenderer';
import { AlignmentGuides } from './AlignmentGuides';
import { FPSMeter } from './FPSMeter';
import { MiniMap } from './MiniMap';

export const EditorCanvas = memo(function EditorCanvas() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState({ x: 0, y: 0 });
  const [alignmentLines, setAlignmentLines] = useState<Array<{ type: 'vertical' | 'horizontal'; position: number }>>([]);

  const {
    layers,
    selectedLayerIds,
    selectLayer,
    selectLayers,
    clearSelection,
    zoom,
    pan,
    setPan,
    gridEnabled,
    snapEnabled,
    tool,
    showFPS,
    selectionBox,
    setSelectionBox,
  } = useEditorStore();

  // Smooth zoom with easing
  const smoothZoom = useCallback((delta: number, clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    // Calculate new zoom
    const newZoom = Math.max(0.1, Math.min(5, zoom + delta));
    
    // Calculate new pan to zoom towards cursor
    const zoomRatio = newZoom / zoom;
    const newPan = {
      x: x - (x - pan.x) * zoomRatio,
      y: y - (y - pan.y) * zoomRatio,
    };

    // Use RAF for smooth animation
    requestAnimationFrame(() => {
      useEditorStore.setState({ zoom: newZoom, pan: newPan });
    });
  }, [zoom, pan]);

  // Handle mouse wheel for zoom
  const handleWheel = useCallback((e: WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.05 : 0.05;
      smoothZoom(delta, e.clientX, e.clientY);
    }
  }, [smoothZoom]);

  // Handle canvas click
  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget || e.currentTarget.contains(e.target as Node)) {
      clearSelection();
    }
  }, [clearSelection]);

  // Pan with middle mouse or hand tool
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Selection box with select tool
    if (tool === 'select' && e.button === 0 && e.target === e.currentTarget) {
      e.preventDefault();
      setIsSelecting(true);
      const rect = canvas.getBoundingClientRect();
      setSelectionStart({
        x: (e.clientX - rect.left - pan.x) / zoom,
        y: (e.clientY - rect.top - pan.y) / zoom,
      });
      return;
    }

    // Pan with middle mouse or hand tool
    if (e.button === 1 || (tool === 'hand' && e.button === 0)) {
      e.preventDefault();
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  }, [tool, pan, zoom]);

  // Handle mouse move
  const handleMouseMove = useCallback((e: MouseEvent) => {
    // Panning
    if (isPanning) {
      requestAnimationFrame(() => {
        setPan({
          x: e.clientX - panStart.x,
          y: e.clientY - panStart.y,
        });
      });
    }

    // Selection box
    if (isSelecting) {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const currentX = (e.clientX - rect.left - pan.x) / zoom;
      const currentY = (e.clientY - rect.top - pan.y) / zoom;

      const box = {
        x: Math.min(selectionStart.x, currentX),
        y: Math.min(selectionStart.y, currentY),
        width: Math.abs(currentX - selectionStart.x),
        height: Math.abs(currentY - selectionStart.y),
      };

      setSelectionBox(box);

      // Find layers within selection box
      const selectedIds = layers
        .filter(layer => {
          const layerRight = layer.x + layer.width;
          const layerBottom = layer.y + layer.height;
          const boxRight = box.x + box.width;
          const boxBottom = box.y + box.height;

          return (
            layer.x < boxRight &&
            layerRight > box.x &&
            layer.y < boxBottom &&
            layerBottom > box.y
          );
        })
        .map(layer => layer.id);

      if (selectedIds.length > 0) {
        selectLayers(selectedIds);
      }
    }
  }, [isPanning, isSelecting, panStart, selectionStart, pan, zoom, layers, setPan, setSelectionBox, selectLayers]);

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
    if (isSelecting) {
      setIsSelecting(false);
      setSelectionBox(null);
    }
  }, [isSelecting, setSelectionBox]);

  // Attach event listeners
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.addEventListener('wheel', handleWheel, { passive: false });
    
    return () => {
      canvas.removeEventListener('wheel', handleWheel);
    };
  }, [handleWheel]);

  useEffect(() => {
    if (isPanning || isSelecting) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);

      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isPanning, isSelecting, handleMouseMove, handleMouseUp]);

  // Sort layers by z-index
  const sortedLayers = [...layers].sort((a, b) => a.zIndex - b.zIndex);

  return (
    <div
      ref={canvasRef}
      className={`flex-1 relative overflow-hidden ${
        isPanning || tool === 'hand' ? 'cursor-grab' : isSelecting ? 'cursor-crosshair' : 'cursor-default'
      } ${isPanning ? 'cursor-grabbing' : ''}`}
      onClick={handleCanvasClick}
      onMouseDown={handleMouseDown}
    >
      {/* Canvas Background with Grid */}
      <div
        className="absolute inset-0 transition-all duration-200"
        style={{
          backgroundColor: 'hsl(var(--background))',
          backgroundImage: gridEnabled
            ? `
              linear-gradient(to right, hsl(var(--border) / 0.3) 1px, transparent 1px),
              linear-gradient(to bottom, hsl(var(--border) / 0.3) 1px, transparent 1px)
            `
            : 'none',
          backgroundSize: gridEnabled ? `${20 * zoom}px ${20 * zoom}px` : 'auto',
          backgroundPosition: `${pan.x}px ${pan.y}px`,
        }}
      />

      {/* Layers Container */}
      <div
        className="absolute pointer-events-none"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
          left: '50%',
          top: '50%',
          marginLeft: '-500px',
          marginTop: '-500px',
          transition: isPanning ? 'none' : 'transform 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <div className="pointer-events-auto" style={{ width: '1000px', height: '1000px' }}>
          {sortedLayers.map((layer) => (
            <LayerRenderer
              key={layer.id}
              layer={layer}
              isSelected={selectedLayerIds.includes(layer.id)}
              onSelect={(id, addToSelection) => selectLayer(id, addToSelection)}
              onShowAlignmentLines={setAlignmentLines}
            />
          ))}

          {/* Empty canvas message */}
          {layers.length === 0 && (
            <div
              className="absolute flex items-center justify-center text-center pointer-events-none"
              style={{
                width: '1000px',
                height: '1000px',
              }}
            >
              <div className="animate-in fade-in duration-500">
                <p className="text-2xl font-semibold text-muted-foreground mb-2">
                  Your canvas is empty
                </p>
                <p className="text-sm text-muted-foreground">
                  Select a tool from the left panel and click to add elements
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Alignment Guides */}
      {snapEnabled && alignmentLines.length > 0 && (
        <AlignmentGuides lines={alignmentLines} zoom={zoom} pan={pan} />
      )}

      {/* Selection Box */}
      {selectionBox && (
        <div
          className="absolute border-2 border-primary bg-primary/10 pointer-events-none animate-in fade-in duration-100"
          style={{
            left: pan.x + selectionBox.x * zoom,
            top: pan.y + selectionBox.y * zoom,
            width: selectionBox.width * zoom,
            height: selectionBox.height * zoom,
          }}
        />
      )}

      {/* FPS Meter */}
      {showFPS && <FPSMeter />}

      {/* Mini Map */}
      <MiniMap layers={layers} zoom={zoom} pan={pan} />
    </div>
  );
});
