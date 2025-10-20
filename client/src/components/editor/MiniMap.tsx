/**
 * Mini Map
 * Overview map showing all layers and current viewport
 */

import { memo } from 'react';
import type { Layer } from '@/types/editor';

interface MiniMapProps {
  layers: Layer[];
  zoom: number;
  pan: { x: number; y: number };
}

export const MiniMap = memo(function MiniMap({ layers, zoom, pan }: MiniMapProps) {
  if (layers.length === 0) return null;

  const MINIMAP_SIZE = 150;
  const CANVAS_SIZE = 1000;
  const scale = MINIMAP_SIZE / CANVAS_SIZE;

  return (
    <div className="absolute bottom-4 right-4 bg-background/90 backdrop-blur-sm border rounded-lg shadow-lg overflow-hidden">
      <div
        className="relative"
        style={{
          width: MINIMAP_SIZE,
          height: MINIMAP_SIZE,
        }}
      >
        {/* Layers */}
        {layers.map((layer) => (
          <div
            key={layer.id}
            className="absolute bg-primary/30 border border-primary/50"
            style={{
              left: layer.x * scale,
              top: layer.y * scale,
              width: layer.width * scale,
              height: layer.height * scale,
            }}
          />
        ))}

        {/* Viewport indicator */}
        <div
          className="absolute border-2 border-blue-500 bg-blue-500/10 pointer-events-none"
          style={{
            left: (-pan.x / zoom) * scale + MINIMAP_SIZE / 2,
            top: (-pan.y / zoom) * scale + MINIMAP_SIZE / 2,
            width: (window.innerWidth / zoom) * scale,
            height: (window.innerHeight / zoom) * scale,
          }}
        />
      </div>
    </div>
  );
});

