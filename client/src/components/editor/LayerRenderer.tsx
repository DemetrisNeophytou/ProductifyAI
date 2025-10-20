/**
 * Layer Renderer
 * Renders individual layers with drag, resize, and selection
 */

import { useRef, useState, useCallback, useEffect } from 'react';
import { useEditorStore } from '@/stores/editorStore';
import type { Layer } from '@/types/editor';

interface LayerRendererProps {
  layer: Layer;
  isSelected: boolean;
  onSelect: (id: string, addToSelection: boolean) => void;
}

export function LayerRenderer({ layer, isSelected, onSelect }: LayerRendererProps) {
  const layerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);

  const { updateLayer, saveHistory, zoom } = useEditorStore();

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
      
      updateLayer(layer.id, { x: newX, y: newY });
    }

    if (isResizing && resizeHandle && !layer.locked) {
      const rect = layerRef.current?.getBoundingClientRect();
      if (!rect) return;

      let newWidth = layer.width;
      let newHeight = layer.height;
      let newX = layer.x;
      let newY = layer.y;

      if (resizeHandle.includes('e')) {
        newWidth = Math.max(20, (e.clientX - rect.left) / zoom);
      }
      if (resizeHandle.includes('w')) {
        const deltaX = (e.clientX - rect.left) / zoom;
        newWidth = Math.max(20, layer.width - deltaX);
        newX = layer.x + deltaX;
      }
      if (resizeHandle.includes('s')) {
        newHeight = Math.max(20, (e.clientY - rect.top) / zoom);
      }
      if (resizeHandle.includes('n')) {
        const deltaY = (e.clientY - rect.top) / zoom;
        newHeight = Math.max(20, layer.height - deltaY);
        newY = layer.y + deltaY;
      }

      updateLayer(layer.id, { width: newWidth, height: newHeight, x: newX, y: newY });
    }
  }, [isDragging, isResizing, resizeHandle, layer, dragStart, zoom, updateLayer]);

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    if (isDragging || isResizing) {
      saveHistory();
    }
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle(null);
  }, [isDragging, isResizing, saveHistory]);

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
            className="w-full h-full p-2 overflow-hidden"
            style={{
              color: layer.style?.color || 'currentColor',
              fontSize: layer.style?.fontSize || 16,
              fontWeight: layer.style?.fontWeight || 'normal',
              fontFamily: layer.style?.fontFamily || 'inherit',
              textAlign: layer.style?.textAlign || 'left',
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
            className="w-full h-full object-cover"
            draggable={false}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground text-sm">
            Image
          </div>
        );
      
      case 'video':
        return layer.assetUrl ? (
          <video
            src={layer.assetUrl}
            className="w-full h-full object-cover"
            controls
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground text-sm">
            Video
          </div>
        );
      
      case 'shape':
        return (
          <div className="w-full h-full" />
        );
      
      default:
        return null;
    }
  };

  if (!layer.visible) return null;

  return (
    <div
      ref={layerRef}
      className={`absolute ${isDragging ? 'cursor-move' : 'cursor-pointer'} ${
        layer.locked ? 'pointer-events-none' : ''
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
          ? `${layer.style.borderWidth}px solid ${layer.style.borderColor || '#000'}`
          : 'none',
      }}
      onMouseDown={handleMouseDown}
    >
      {renderContent()}

      {/* Selection outline and handles */}
      {isSelected && !layer.locked && (
        <>
          <div className="absolute inset-0 border-2 border-primary pointer-events-none" />
          
          {/* Resize handles */}
          {['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'].map((handle) => (
            <div
              key={handle}
              className="absolute w-3 h-3 bg-primary border border-primary-foreground rounded-sm hover:scale-125 transition-transform"
              style={{
                cursor: `${handle}-resize`,
                ...(handle.includes('n') && { top: -6 }),
                ...(handle.includes('s') && { bottom: -6 }),
                ...(handle.includes('w') && { left: -6 }),
                ...(handle.includes('e') && { right: -6 }),
                ...(!handle.includes('n') && !handle.includes('s') && { top: '50%', transform: 'translateY(-50%)' }),
                ...(!handle.includes('w') && !handle.includes('e') && { left: '50%', transform: 'translateX(-50%)' }),
              }}
              onMouseDown={(e) => handleResizeMouseDown(e, handle)}
            />
          ))}
        </>
      )}
    </div>
  );
}

