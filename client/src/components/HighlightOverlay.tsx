import { useEffect, useRef, useState } from 'react';
import type { Highlight } from '@shared/schema';
import { denormalizeCoordinates } from '@/lib/pdfHelpers';

interface HighlightOverlayProps {
  highlights: Highlight[];
  pageNumber: number;
  canvasWidth: number;
  canvasHeight: number;
  isDrawing: boolean;
  selectedColor: string;
  onAddHighlight: (highlight: Omit<Highlight, 'id' | 'timestamp' | 'originalCanvasWidth' | 'originalCanvasHeight'>) => void;
}

export function HighlightOverlay({
  highlights,
  pageNumber,
  canvasWidth,
  canvasHeight,
  isDrawing,
  selectedColor,
  onAddHighlight,
}: HighlightOverlayProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [currentRect, setCurrentRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  const pageHighlights = highlights.filter(h => h.pageNumber === pageNumber);

  useEffect(() => {
    if (!isDrawing) {
      setIsMouseDown(false);
      setStartPos(null);
      setCurrentRect(null);
    }
  }, [isDrawing]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isDrawing || !overlayRef.current) return;
    
    const rect = overlayRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setIsMouseDown(true);
    setStartPos({ x, y });
    setCurrentRect({ x, y, width: 0, height: 0 });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing || !isMouseDown || !startPos || !overlayRef.current) return;
    
    const rect = overlayRef.current.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;
    
    const x = Math.min(startPos.x, currentX);
    const y = Math.min(startPos.y, currentY);
    const width = Math.abs(currentX - startPos.x);
    const height = Math.abs(currentY - startPos.y);
    
    setCurrentRect({ x, y, width, height });
  };

  const handleMouseUp = () => {
    if (!isDrawing || !isMouseDown || !currentRect || !overlayRef.current) return;
    
    if (currentRect.width > 5 && currentRect.height > 5) {
      onAddHighlight({
        pageNumber,
        x: currentRect.x / canvasWidth,
        y: currentRect.y / canvasHeight,
        width: currentRect.width / canvasWidth,
        height: currentRect.height / canvasHeight,
        color: selectedColor,
      });
    }
    
    setIsMouseDown(false);
    setStartPos(null);
    setCurrentRect(null);
  };

  return (
    <div
      ref={overlayRef}
      className="absolute inset-0 pointer-events-auto"
      style={{
        cursor: isDrawing ? 'crosshair' : 'default',
        width: canvasWidth,
        height: canvasHeight,
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      data-testid="highlight-overlay"
    >
      {pageHighlights.map((highlight) => {
        const coords = denormalizeCoordinates(
          highlight,
          canvasWidth,
          canvasHeight
        );
        
        return (
          <div
            key={highlight.id}
            className="absolute pointer-events-none"
            style={{
              left: coords.x,
              top: coords.y,
              width: coords.width,
              height: coords.height,
              backgroundColor: highlight.color,
              opacity: 0.3,
            }}
            data-testid={`highlight-${highlight.id}`}
          />
        );
      })}
      
      {currentRect && isMouseDown && (
        <div
          className="absolute pointer-events-none border-2 border-dashed"
          style={{
            left: currentRect.x,
            top: currentRect.y,
            width: currentRect.width,
            height: currentRect.height,
            backgroundColor: selectedColor,
            opacity: 0.2,
            borderColor: selectedColor,
          }}
          data-testid="drawing-preview"
        />
      )}
    </div>
  );
}
