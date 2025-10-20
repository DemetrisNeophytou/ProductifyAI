/**
 * Alignment Guides
 * Visual guides for snapping and alignment
 */

import { memo } from 'react';

interface AlignmentGuidesProps {
  lines: Array<{ type: 'vertical' | 'horizontal'; position: number }>;
  zoom: number;
  pan: { x: number; y: number };
}

export const AlignmentGuides = memo(function AlignmentGuides({ lines, zoom, pan }: AlignmentGuidesProps) {
  return (
    <>
      {lines.map((line, index) => (
        <div
          key={index}
          className="absolute bg-pink-500 pointer-events-none animate-in fade-in duration-100"
          style={
            line.type === 'vertical'
              ? {
                  left: pan.x + line.position * zoom + 500 * zoom,
                  top: 0,
                  width: '1px',
                  height: '100%',
                  boxShadow: '0 0 4px rgba(236, 72, 153, 0.5)',
                }
              : {
                  left: 0,
                  top: pan.y + line.position * zoom + 500 * zoom,
                  width: '100%',
                  height: '1px',
                  boxShadow: '0 0 4px rgba(236, 72, 153, 0.5)',
                }
          }
        />
      ))}
    </>
  );
});

