import React, { useRef, useState, useEffect, useCallback } from 'react';
import { StrokePoint } from '../types';
import {
  RotateCcw,
  RotateCw,
  Trash2,
  Pen,
  Eraser,
  Grid,
} from 'lucide-react';

interface DrawingCanvasProps {
  onStrokeUpdate: (strokes: StrokePoint[], canvasImageBase64: string) => void;
  width?: number;
  height?: number;
  clearTrigger?: number;
  className?: string;
  showGuidelines?: boolean;
}

export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({
  onStrokeUpdate,
  width = 540,
  height = 360,
  clearTrigger,
  className = '',
  showGuidelines = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
  const [brushSize, setBrushSize] = useState<number>(7);
  const [guidelines, setGuidelines] = useState<boolean>(showGuidelines);

  // Stroke points for sequence models
  const [strokes, setStrokes] = useState<StrokePoint[]>([]);
  const [history, setHistory] = useState<ImageData[]>([]);
  const [redoStack, setRedoStack] = useState<ImageData[]>([]);

  // Intermediate points for quadratic curve smoothing
  const lastPointRef = useRef<{ x: number; y: number; pressure: number } | null>(null);

  // Initialize and clear canvas to neural standard (black background, white/bright ink)
  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    // Neural standard: black background for real-time models
    ctx.fillStyle = '#0F0E0D';
    ctx.fillRect(0, 0, width, height);

    // Draw ruled epigraphic calligraphy guidelines if enabled
    if (guidelines) {
      ctx.save();
      ctx.strokeStyle = 'rgba(245, 240, 230, 0.08)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);

      // Baseline and meanline
      const lineY1 = height * 0.35;
      const lineY2 = height * 0.65;

      ctx.beginPath();
      ctx.moveTo(0, lineY1);
      ctx.lineTo(width, lineY1);
      ctx.moveTo(0, lineY2);
      ctx.lineTo(width, lineY2);
      ctx.stroke();

      // Center vertical guide
      ctx.beginPath();
      ctx.moveTo(width / 2, 0);
      ctx.lineTo(width / 2, height);
      ctx.stroke();

      ctx.restore();
    }

    setHistory([ctx.getImageData(0, 0, width, height)]);
  }, [width, height, guidelines]);

  useEffect(() => {
    initCanvas();
  }, [initCanvas]);

  // Watch clearTrigger from parent
  useEffect(() => {
    if (clearTrigger && clearTrigger > 0) {
      clearCanvas();
    }
  }, [clearTrigger]);

  // Emit stroke updates
  const emitStrokeData = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const b64 = canvas.toDataURL('image/png');
    onStrokeUpdate(strokes, b64);
  }, [strokes, onStrokeUpdate]);

  useEffect(() => {
    if (strokes.length > 1) {
      const timer = setTimeout(() => {
        emitStrokeData();
      }, 40);
      return () => clearTimeout(timer);
    }
  }, [strokes, emitStrokeData]);

  // Coordinate normalizer
  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0, pressure: 0.5 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let clientX = 0;
    let clientY = 0;
    let pressure = 0.5;

    if ('touches' in e) {
      if (e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
        // Pointer pressure API if supported on stylus
        if ((e.touches[0] as any).force) {
          pressure = (e.touches[0] as any).force;
        }
      }
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
      if (e.buttons === 1) pressure = 0.6;
    }

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
      pressure: Math.min(1.0, Math.max(0.2, pressure)),
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    setIsDrawing(true);
    const { x, y, pressure } = getCanvasCoords(e);
    lastPointRef.current = { x, y, pressure };

    // Record stroke
    setStrokes((prev) => [
      ...prev,
      {
        x: x / width,
        y: y / height,
        pen_down: 1,
        dt: prev.length === 0 ? 0 : 20,
      },
    ]);

    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, (brushSize * pressure) / 2, 0, Math.PI * 2);
    ctx.fillStyle = tool === 'pen' ? '#FFFFFF' : '#0F0E0D';
    ctx.fill();
    ctx.restore();
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas || !lastPointRef.current) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const currentPoint = getCanvasCoords(e);
    const prevPoint = lastPointRef.current;

    // Quadratic bezier curve interpolation for smooth pressure-aware calligraphy ink
    const midX = (prevPoint.x + currentPoint.x) / 2;
    const midY = (prevPoint.y + currentPoint.y) / 2;
    const dynamicWidth =
      tool === 'pen'
        ? Math.max(2, brushSize * currentPoint.pressure * 1.2)
        : brushSize * 2.5;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(prevPoint.x, prevPoint.y);
    ctx.quadraticCurveTo(prevPoint.x, prevPoint.y, midX, midY);
    ctx.strokeStyle = tool === 'pen' ? '#FFFFFF' : '#0F0E0D';
    ctx.lineWidth = dynamicWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.restore();

    lastPointRef.current = currentPoint;

    // Append to sequence model stroke buffer
    setStrokes((prev) => [
      ...prev,
      {
        x: currentPoint.x / width,
        y: currentPoint.y / height,
        pen_down: 1,
        dt: 15,
      },
    ]);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    lastPointRef.current = null;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    // Append pen_up point
    setStrokes((prev) => {
      const copy = [...prev];
      if (copy.length > 0) {
        copy[copy.length - 1].pen_down = 0;
      }
      return copy;
    });

    // Save to undo history (keep last 20)
    setHistory((prev) => [...prev.slice(-19), ctx.getImageData(0, 0, width, height)]);
    setRedoStack([]);
    emitStrokeData();
  };

  const clearCanvas = () => {
    initCanvas();
    setStrokes([]);
    setRedoStack([]);
    emitStrokeData();
  };

  const undo = () => {
    if (history.length <= 1) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const currentImg = history[history.length - 1];
    setRedoStack((prev) => [...prev, currentImg]);

    const prevHistory = history.slice(0, history.length - 1);
    setHistory(prevHistory);

    const restoreImg = prevHistory[prevHistory.length - 1];
    ctx.putImageData(restoreImg, 0, 0);

    setStrokes((prev) => prev.slice(0, Math.max(0, prev.length - 30)));
    emitStrokeData();
  };

  const redo = () => {
    if (redoStack.length === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const imgToRestore = redoStack[redoStack.length - 1];
    setRedoStack((prev) => prev.slice(0, prev.length - 1));
    setHistory((prev) => [...prev, imgToRestore]);

    ctx.putImageData(imgToRestore, 0, 0);
    emitStrokeData();
  };

  return (
    <div className={`flex flex-col items-center w-full select-none ${className}`}>
      {/* Canvas Paper Container */}
      <div className="relative w-full rounded-2xl overflow-hidden border border-border-strong shadow-paper bg-paper-surface">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full h-auto block cursor-crosshair touch-none"
        />
      </div>

      {/* Floating Canvas Scribe Toolbar */}
      <div className="w-full mt-3 flex flex-wrap items-center justify-between gap-2 px-1 text-xs">
        {/* Tool Modes: Pen vs Eraser */}
        <div className="flex items-center gap-1 bg-paper-muted p-1 rounded-xl border border-border-subtle">
          <button
            type="button"
            onClick={() => setTool('pen')}
            className={`p-1.5 rounded-lg flex items-center gap-1.5 font-medium transition-colors ${
              tool === 'pen'
                ? 'bg-paper-surface text-vermilion shadow-paper-sm font-semibold'
                : 'text-ink-secondary hover:text-ink-primary'
            }`}
            title="Ink Pen"
          >
            <Pen className="w-4 h-4" />
            <span className="hidden sm:inline">Ink</span>
          </button>
          <button
            type="button"
            onClick={() => setTool('eraser')}
            className={`p-1.5 rounded-lg flex items-center gap-1.5 font-medium transition-colors ${
              tool === 'eraser'
                ? 'bg-paper-surface text-ink-primary shadow-paper-sm font-semibold'
                : 'text-ink-secondary hover:text-ink-primary'
            }`}
            title="Eraser"
          >
            <Eraser className="w-4 h-4" />
            <span className="hidden sm:inline">Erase</span>
          </button>
        </div>

        {/* Brush Size Slider */}
        <div className="flex items-center gap-2 bg-paper-muted px-2.5 py-1 rounded-xl border border-border-subtle">
          <span className="text-ink-tertiary font-mono text-[11px]">Size</span>
          <input
            type="range"
            min={3}
            max={18}
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
            className="w-20 sm:w-28 accent-vermilion cursor-pointer"
            title={`Brush size: ${brushSize}px`}
          />
          <span className="font-mono text-ink-secondary text-[11px] w-4">{brushSize}</span>
        </div>

        {/* Canvas Controls: Guidelines, Undo, Redo, Clear */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setGuidelines(!guidelines)}
            className={`p-2 rounded-xl border transition-colors ${
              guidelines
                ? 'bg-gold/15 text-gold border-gold/30'
                : 'bg-paper-muted text-ink-secondary border-border-subtle hover:text-ink-primary'
            }`}
            title="Toggle ruled calligraphy guidelines"
            aria-label="Toggle guidelines"
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={undo}
            disabled={history.length <= 1}
            className="p-2 rounded-xl bg-paper-muted border border-border-subtle text-ink-secondary hover:text-ink-primary disabled:opacity-40 transition-colors"
            title="Undo stroke"
            aria-label="Undo"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={redo}
            disabled={redoStack.length === 0}
            className="p-2 rounded-xl bg-paper-muted border border-border-subtle text-ink-secondary hover:text-ink-primary disabled:opacity-40 transition-colors"
            title="Redo stroke"
            aria-label="Redo"
          >
            <RotateCw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={clearCanvas}
            className="p-2 rounded-xl bg-paper-muted border border-border-subtle text-ink-secondary hover:text-vermilion transition-colors"
            title="Clear canvas"
            aria-label="Clear canvas"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
