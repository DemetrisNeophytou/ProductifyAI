/**
 * Layer Renderer
 * Renders individual layers with smooth drag, resize, and alignment snapping
 */

import { useRef, useState, useCallback, useEffect, memo } from 'react';
import { useEditorStore } from '@/stores/editorStore';
import type { Layer } from '@/types/editor';

interface LayerRendererProps {
  layer: Layer;
  isSelected: boolean;
  onSelect: (id: string, addToSelection: boolean) => void;
  onShowAlignmentLines?: (lines: Array<{ type: 'vertical' | 'horizontal'; position: number }>) => void;
}

const SNAP_THRESHOLD = 5;

export const LayerRenderer = memo(function LayerRenderer({ 
  layer, 
  isSelected, 
  onSelect,
  onShowAlignmentLines 
}: LayerRendererProps) {
  const layerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  const { updateLayer, saveHistory, zoom, layers, snapEnabled } = useEditorStore();

  // Snap to grid
  const snapToGrid = useCallback((value: number, gridSize: number = 20): number => {
    if (!snapEnabled) return value;
    return Math.round(value / gridSize) * gridSize;
  }, [snapEnabled]);

  // Find alignment lines
  const findAlignmentLines = useCallback((currentLayer: Layer) => {
    if (!snapEnabled || !onShowAlignmentLines) return;

    const lines: Array<{ type: 'vertical' | 'horizontal'; position: number }> = [];
    const threshold = SNAP_THRESHOLD / zoom;

    layers.forEach(otherLayer => {
      if (otherLayer.id === currentLayer.id) return;

      // Vertical alignment
      if (Math.abs(currentLayer.x - otherLayer.x) < threshold) {
        lines.push({ type: 'vertical', position: otherLayer.x });
      }
      if (Math.abs((currentLayer.x + currentLayer.width) - (otherLayer.x + otherLayer.width)) < threshold) {
        lines.push({ type: 'vertical', position: otherLayer.x + otherLayer.width });
      }
      if (Math.abs(currentLayer.x + currentLayer.width / 2 - (otherLayer.x + otherLayer.width / 2)) < threshold) {
        lines.push({ type: 'vertical', position: otherLayer.x + otherLayer.width / 2 });
      }

      // Horizontal alignment
      if (Math.abs(currentLayer.y - otherLayer.y) < threshold) {
        lines.push({ type: 'horizontal', position: otherLayer.y });
      }
      if (Math.abs((currentLayer.y + currentLayer.height) - (otherLayer.y + otherLayer.height)) < threshold) {
        lines.push({ type: 'horizontal', position: otherLayer.y + otherLayer.height });
      }
      if (Math.abs(currentLayer.y + currentLayer.height / 2 - (otherLayer.y + otherLayer.height / 2)) < threshold) {
        lines.push({ type: 'horizontal', position: otherLayer.y + otherLayer.height / 2 });
      }
    });

    onShowAlignmentLines(lines);
  }, [layers, snapEnabled, zoom, onShowAlignmentLines]);

  // Handle layer click
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (layer.locked) return;
    
    e.stopPropagation();
    
    // Select layer
    onSelect(layer.id, e.shiftKey);

    // Start dragging
    if (!isResizing) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - layer.x * zoom,
        y: e.clientY - layer.y * zoom,
      });
    }
  }, [layer, onSelect, isResizing, zoom]);

  // Handle mouse move for drag
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging && !layer.locked) {
      const newX = (e.clientX - dragStart.x) / zoom;
      const newY = (e.clientY - dragStart.y) / zoom;
      
      const snappedX = snapToGrid(newX);
      const snappedY = snapToGrid(newY);

      // Use RAF for smooth updates
      requestAnimationFrame(() => {
        updateLayer(layer.id, { x: snappedX, y: snappedY });
        findAlignmentLines({ ...layer, x: snappedX, y: snappedY });
      });
    }

    if (isResizing && resizeHandle && !layer.locked) {
      const rect = layerRef.current?.getBoundingClientRect();
      if (!rect) return;

      let newWidth = layer.width;
      let newHeight = layer.height;
      let newX = layer.x;
      let newY = layer.y;

      const canvasX = (e.clientX - rect.left) / zoom;
      const canvasY = (e.clientY - rect.top) / zoom;

      if (resizeHandle.includes('e')) {
        newWidth = Math.max(20, layer.width + canvasX);
      }
      if (resizeHandle.includes('w')) {
        newWidth = Math.max(20, layer.width - canvasX);
        newX = layer.x + canvasX;
      }
      if (resizeHandle.includes('s')) {
        newHeight = Math.max(20, layer.height + canvasY);
      }
      if (resizeHandle.includes('n')) {
        newHeight = Math.max(20, layer.height - canvasY);
        newY = layer.y + canvasY;
      }

      // Snap dimensions
      const snappedWidth = snapToGrid(newWidth);
      const snappedHeight = snapToGrid(newHeight);
      const snappedX = snapToGrid(newX);
      const snappedY = snapToGrid(newY);

      requestAnimationFrame(() => {
        updateLayer(layer.id, { 
          width: snappedWidth, 
          height: snappedHeight, 
          x: snappedX, 
          y: snappedY 
        });
      });
    }
  }, [isDragging, isResizing, resizeHandle, layer, dragStart, zoom, updateLayer, snapToGrid, findAlignmentLines]);

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    if (isDragging || isResizing) {
      saveHistory();
      if (onShowAlignmentLines) {
        onShowAlignmentLines([]);
      }
    }
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle(null);
  }, [isDragging, isResizing, saveHistory, onShowAlignmentLines]);

  // Attach global mouse listeners when dragging
  useEffect(() => {
    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);

      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

  // Resize handle mouse down
  const handleResizeMouseDown = useCallback((e: React.MouseEvent, handle: string) => {
    e.stopPropagation();
    setIsResizing(true);
    setResizeHandle(handle);
  }, []);

  // Render layer content based on type
  const renderContent = () => {
    switch (layer.type) {
      case 'text':
        return (
          <div
            className="w-full h-full p-2 overflow-hidden select-none"
            style={{
              color: layer.style?.color || 'hsl(var(--foreground))',
              fontSize: layer.style?.fontSize || 16,
              fontWeight: layer.style?.fontWeight || 'normal',
              fontFamily: layer.style?.fontFamily || 'inherit',
              textAlign: layer.style?.textAlign || 'left',
              lineHeight: 1.5,
            }}
          >
            {layer.content || 'Double-click to edit'}
          </div>
        );
      
      case 'image':
        return layer.assetUrl ? (
          <img
            src={layer.assetUrl}
            alt={layer.name}
            className="w-full h-full object-cover select-none"
            draggable={false}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted/50 text-muted-foreground text-sm">
            Image
          </div>
        );
      
      case 'video':
        return layer.assetUrl ? (
          <video
            src={layer.assetUrl}
            className="w-full h-full object-cover select-none"
            controls
            preload="metadata"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted/50 text-muted-foreground text-sm">
            Video
          </div>
        );
      
      case 'shape':
        return <div className="w-full h-full" />;
      
      default:
        return null;
    }
  };

  if (layer.visible === false || layer.isHidden) return null;

  return (
    <div
      ref={layerRef}
      className={`absolute select-none transition-all duration-75 ${
        isDragging ? 'cursor-move shadow-lg' : 'cursor-pointer'
      } ${
        isHovered && !layer.locked ? 'ring-2 ring-primary/30' : ''
      } ${
        layer.locked ? 'pointer-events-none opacity-60' : ''
      }`}
      style={{
        left: layer.x,
        top: layer.y,
        width: layer.width,
        height: layer.height,
        transform: `rotate(${layer.rotation || 0}deg)`,
        opacity: layer.opacity ?? 1,
        zIndex: layer.zIndex,
        background: layer.style?.background || 'transparent',
        borderRadius: layer.style?.borderRadius || 0,
        border: layer.style?.borderWidth
          ? `${layer.style.borderWidth}px solid ${layer.style.borderColor || 'hsl(var(--border))'}`
          : 'none',
        boxShadow: layer.style?.shadow || (isSelected ? '0 0 0 2px hsl(var(--primary))' : 'none'),
        filter: layer.blur ? `blur(${layer.blur}px)` : 'none',
        willChange: isDragging || isResizing ? 'transform' : 'auto',
      }}
      onMouseDown={handleMouseDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {renderContent()}

      {/* Selection outline with animation */}
      {isSelected && !layer.locked && (
        <>
          <div className="absolute inset-0 pointer-events-none animate-in fade-in duration-200">
            <div className="absolute inset-0 border-2 border-primary rounded-[inherit]" />
          </div>
          
          {/* Resize handles with hover animation */}
          {['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'].map((handle) => (
            <div
              key={handle}
              className="absolute w-3 h-3 bg-primary border-2 border-background rounded-sm hover:scale-150 transition-all duration-150 shadow-sm"
              style={{
                cursor: `${handle}-resize`,
                ...(handle.includes('n') && { top: -6 }),
                ...(handle.includes('s') && { bottom: -6 }),
                ...(handle.includes('w') && { left: -6 }),
                ...(handle.includes('e') && { right: -6 }),
                ...(!handle.includes('n') && !handle.includes('s') && { 
                  top: '50%', 
                  transform: 'translateY(-50%)',
                }),
                ...(!handle.includes('w') && !handle.includes('e') && { 
                  left: '50%', 
                  transform: 'translateX(-50%)',
                }),
                ...(handle === 'n' || handle === 's' ? { 
                  left: '50%', 
                  transform: 'translateX(-50%)',
                } : {}),
                ...(handle === 'w' || handle === 'e' ? { 
                  top: '50%', 
                  transform: 'translateY(-50%)',
                } : {}),
              }}
              onMouseDown={(e) => handleResizeMouseDown(e, handle)}
            />
          ))}
        </>
      )}
    </div>
  );
});
