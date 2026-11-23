import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Volume2, RotateCcw, ArrowRight, Star, Sparkles, Check, X } from 'lucide-react';
import { speakTamil } from '../lib/speech';

interface LetterTracingCanvasProps {
  letter: string;
  transliteration?: string;
  category?: string;
  onNext?: () => void;
  onClose?: () => void;
  onTraced?: (letter: string) => void;
}

const CRAYON_COLORS = [
  { name: 'Vermilion', hex: '#C8452D' },
  { name: 'Ocean Blue', hex: '#2563EB' },
  { name: 'Emerald', hex: '#059669' },
  { name: 'Golden Sun', hex: '#D97706' },
  { name: 'Royal Plum', hex: '#7C3AED' },
];

export const LetterTracingCanvas: React.FC<LetterTracingCanvasProps> = ({
  letter,
  transliteration,
  category,
  onNext,
  onClose,
  onTraced,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [selectedColor, setSelectedColor] = useState<string>(CRAYON_COLORS[0].hex);
  const [strokeWidth, setStrokeWidth] = useState<number>(18);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [coverage, setCoverage] = useState<number>(0);
  const [stars, setStars] = useState<number>(0);
  const [praise, setPraise] = useState<string | null>(null);
  const [hasTraced, setHasTraced] = useState<boolean>(false);

  // Ghost letter pixel map for computing coverage
  const templatePixelsRef = useRef<Uint8Array | null>(null);
  const totalTemplatePixelsRef = useRef<number>(0);

  // Initialize and draw ghost template
  const drawTemplate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw lined notebook guides
    ctx.save();
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 6]);

    // Top guide line
    ctx.beginPath();
    ctx.moveTo(30, height * 0.22);
    ctx.lineTo(width - 30, height * 0.22);
    ctx.stroke();

    // Baseline guide
    ctx.beginPath();
    ctx.moveTo(30, height * 0.78);
    ctx.lineTo(width - 30, height * 0.78);
    ctx.stroke();

    // Center dotted crosshair
    ctx.beginPath();
    ctx.moveTo(width / 2, 30);
    ctx.lineTo(width / 2, height - 30);
    ctx.stroke();
    ctx.restore();

    // Draw ghost letter template (light gray stroke outline & faint fill)
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 180px "Mukta Malar", "Noto Sans Tamil", sans-serif';

    // Faint fill
    ctx.fillStyle = 'rgba(203, 213, 225, 0.35)';
    ctx.fillText(letter, width / 2, height / 2 + 10);

    // Dotted guide stroke
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.6)';
    ctx.setLineDash([4, 4]);
    ctx.strokeText(letter, width / 2, height / 2 + 10);
    ctx.restore();

    // Sample the template mask to compute coverage later
    const offCanvas = document.createElement('canvas');
    offCanvas.width = width;
    offCanvas.height = height;
    const offCtx = offCanvas.getContext('2d', { willReadFrequently: true });
    if (offCtx) {
      offCtx.textAlign = 'center';
      offCtx.textBaseline = 'middle';
      offCtx.font = 'bold 180px "Mukta Malar", "Noto Sans Tamil", sans-serif';
      offCtx.fillStyle = '#000000';
      offCtx.fillText(letter, width / 2, height / 2 + 10);

      const imgData = offCtx.getImageData(0, 0, width, height);
      const data = imgData.data;
      const mask = new Uint8Array(width * height);
      let count = 0;
      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] > 60) {
          mask[i / 4] = 1;
          count++;
        }
      }
      templatePixelsRef.current = mask;
      totalTemplatePixelsRef.current = Math.max(count, 1);
    }

    setCoverage(0);
    setStars(0);
    setPraise(null);
  }, [letter]);

  useEffect(() => {
    drawTemplate();
  }, [drawTemplate]);

  // Check coverage after each stroke
  const evaluateCoverage = () => {
    const canvas = canvasRef.current;
    if (!canvas || !templatePixelsRef.current) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;
    const mask = templatePixelsRef.current;
    const totalTarget = totalTemplatePixelsRef.current;

    let covered = 0;
    for (let i = 0; i < data.length; i += 4) {
      const idx = i / 4;
      // If user drew here (non-transparent) and it overlaps with letter template
      if (mask[idx] === 1 && data[i + 3] > 200) {
        covered++;
      }
    }

    const pct = Math.min(100, Math.round((covered / totalTarget) * 100));
    setCoverage(pct);

    let earnedStars = 0;
    let praiseMsg = null;
    if (pct >= 75) {
      earnedStars = 3;
      praiseMsg = 'Super! / அற்புதம்!';
    } else if (pct >= 50) {
      earnedStars = 2;
      praiseMsg = 'Well done! / நன்று!';
    } else if (pct >= 25) {
      earnedStars = 1;
      praiseMsg = 'Good start! / தொடருங்கள்!';
    }

    setStars(earnedStars);
    setPraise(praiseMsg);

    if (pct >= 70 && !hasTraced) {
      setHasTraced(true);
      // Save to localStorage
      try {
        const stored = JSON.parse(localStorage.getItem('ilt-letters-traced') || '[]');
        if (!stored.includes(letter)) {
          stored.push(letter);
          localStorage.setItem('ilt-letters-traced', JSON.stringify(stored));
        }
      } catch (e) {
        console.error('Storage error:', e);
      }
      if (onTraced) onTraced(letter);
    }
  };

  // Drawing event handlers
  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = selectedColor;
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    setIsDrawing(true);
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    setIsDrawing(false);
    evaluateCoverage();
  };

  return (
    <div className="flex flex-col items-center bg-paper-surface rounded-3xl border border-border-subtle p-5 shadow-lg max-w-md w-full mx-auto relative select-none">
      {/* Top Header */}
      <div className="w-full flex items-center justify-between pb-3 border-b border-border-subtle">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold font-serif-tamil text-vermilion">{letter}</span>
          <div>
            <h3 className="text-sm font-bold text-ink-primary">Trace &amp; Master</h3>
            <p className="text-[11px] text-ink-tertiary">
              {transliteration ? `'${transliteration}'` : ''} {category ? `· ${category}` : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => speakTamil(letter)}
            className="p-2 rounded-xl bg-paper-muted hover:bg-paper-muted/80 text-ink-secondary hover:text-vermilion transition-colors"
            title="Hear letter sound"
          >
            <Volume2 className="w-4 h-4" />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-paper-muted text-ink-tertiary hover:text-ink-primary transition-colors"
              title="Close tracing"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Star Rating & Progress Bar */}
      <div className="w-full py-3 flex items-center justify-between">
        <div className="flex items-center gap-1">
          {[1, 2, 3].map((starIdx) => (
            <Star
              key={starIdx}
              className={`w-5 h-5 transition-all ${
                stars >= starIdx ? 'fill-amber-400 text-amber-400 scale-110' : 'text-slate-300'
              }`}
            />
          ))}
          <span className="text-xs font-bold text-ink-secondary ml-1.5">{coverage}%</span>
        </div>

        {praise && (
          <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-bold animate-bounce">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{praise}</span>
          </div>
        )}
      </div>

      {/* Tracing Canvas */}
      <div className="relative rounded-2xl overflow-hidden border-2 border-dashed border-border-subtle bg-slate-50/50 shadow-inner my-2 touch-none">
        <canvas
          ref={canvasRef}
          width={360}
          height={360}
          onPointerDown={startDrawing}
          onPointerMove={draw}
          onPointerUp={stopDrawing}
          onPointerCancel={stopDrawing}
          className="cursor-crosshair w-[320px] h-[320px] sm:w-[360px] sm:h-[360px]"
        />

        {hasTraced && (
          <div className="absolute top-3 right-3 bg-emerald-500 text-white rounded-full p-1.5 shadow-md flex items-center gap-1 text-[10px] font-bold px-2.5">
            <Check className="w-3.5 h-3.5" />
            <span>Mastered</span>
          </div>
        )}
      </div>

      {/* Crayon Color Palette & Controls */}
      <div className="w-full flex items-center justify-between pt-3 gap-2">
        <div className="flex items-center gap-1.5">
          {CRAYON_COLORS.map((c) => (
            <button
              key={c.hex}
              onClick={() => setSelectedColor(c.hex)}
              className={`w-7 h-7 rounded-full transition-transform ${
                selectedColor === c.hex ? 'scale-125 ring-2 ring-offset-2 ring-ink-primary' : 'hover:scale-110'
              }`}
              style={{ backgroundColor: c.hex }}
              title={c.name}
            />
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={drawTemplate}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-border-subtle hover:bg-paper-muted text-ink-secondary text-xs font-semibold transition-colors"
            title="Clear and try again"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>

          {onNext && (
            <button
              onClick={() => {
                setHasTraced(false);
                onNext();
              }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-vermilion hover:bg-vermilion-hover text-white text-xs font-semibold shadow-sm transition-all"
            >
              <span>Next</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
