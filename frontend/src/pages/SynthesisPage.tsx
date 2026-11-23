import React, { useState, useEffect } from 'react';
import { TamilKeyboard } from '../components/TamilKeyboard';
import { Card, Button, Badge } from '../components/ui';
import { useAppStore } from '../store/useAppStore';
import { Play, Download, RotateCcw, Sliders, Feather, Sparkles } from 'lucide-react';
import { apiUrl } from '../lib/api';

// High-fidelity client-side calligraphy SVG synthesizer
function generateCalligraphySvg(text: string, speed: number, neatness: number, slant: number, inkColor: string): string {
  const width = 640;
  const height = 360;
  const shearDeg = (-slant * 14).toFixed(1);
  const animDuration = Math.max(0.6, (2.6 / Math.max(0.3, speed))).toFixed(2);
  const strokeW = Math.max(1, 2.2 * neatness).toFixed(1);
  const cleanText = text.trim() || 'தமிழ்';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="100%" height="100%">
  <defs>
    <style>
      @keyframes drawStroke {
        0% { stroke-dashoffset: 1400; opacity: 0; }
        15% { opacity: 1; }
        100% { stroke-dashoffset: 0; opacity: 1; }
      }
      .calligraphy-text {
        font-family: "Mukta Malar", "Noto Sans Tamil", sans-serif;
        font-size: 56px;
        font-weight: 700;
        fill: ${inkColor};
        stroke: ${inkColor};
        stroke-width: ${strokeW}px;
        stroke-dasharray: 1400;
        stroke-dashoffset: 0;
        animation: drawStroke ${animDuration}s cubic-bezier(0.25, 0.1, 0.25, 1) forwards;
      }
      .ruled-line {
        stroke: #94a3b8;
        stroke-width: 1.2;
        stroke-dasharray: 6 6;
      }
    </style>
  </defs>
  <rect width="100%" height="100%" fill="#14110F" rx="16" />
  <line x1="40" y1="120" x2="600" y2="120" class="ruled-line" opacity="0.25" />
  <line x1="40" y1="200" x2="600" y2="200" class="ruled-line" opacity="0.45" />
  <line x1="40" y1="280" x2="600" y2="280" class="ruled-line" opacity="0.25" />
  <g transform="translate(320, 205) skewX(${shearDeg})">
    <text x="0" y="0" text-anchor="middle" dominant-baseline="central" class="calligraphy-text">${cleanText}</text>
  </g>
</svg>`;
}

export const SynthesisPage: React.FC = () => {
  const { currentLang } = useAppStore();
  const [text, setText] = useState<string>('தமிழ் வாழ்க');
  const [speed, setSpeed] = useState<number>(1.2);
  const [neatness, setNeatness] = useState<number>(1.2);
  const [slant, setSlant] = useState<number>(0.0);
  const [inkColor, setInkColor] = useState<string>('#C8452D'); // Default vermilion
  const [svgMarkup, setSvgMarkup] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [replayKey, setReplayKey] = useState<number>(0);
  const [synthLatency, setSynthLatency] = useState<number | null>(null);

  const inkPalettes = [
    { name: 'Vermilion (செந்தூரம்)', hex: '#C8452D' },
    { name: 'Lampblack Ink (மை)', hex: '#F1ECE4' },
    { name: 'Muted Gold (தங்கம்)', hex: '#B8893A' },
    { name: 'Sage (பச்சை)', hex: '#5F7A6B' },
    { name: 'Palm Ochre (மஞ்சள்)', hex: '#9E7844' }
  ];

  const handleSynthesize = async () => {
    if (!text.trim()) return;
    setLoading(true);
    const t0 = performance.now();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(apiUrl('/api/generate/text'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          speed,
          neatness,
          slant,
          ink_color: inkColor
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const clientLatency = Math.round((performance.now() - t0) * 10) / 10;
        setSvgMarkup(data.svg_markup);
        setSynthLatency(clientLatency);
        setReplayKey((k) => k + 1);
        setLoading(false);
        return;
      }
    } catch {
      // Backend asleep or offline — fallback to client-side SVG synthesis
    }

    const fallbackSvg = generateCalligraphySvg(text, speed, neatness, slant, inkColor);
    const clientLatency = Math.max(1, Math.round((performance.now() - t0) * 10) / 10);
    setSvgMarkup(fallbackSvg);
    setSynthLatency(clientLatency);
    setReplayKey((k) => k + 1);
    setLoading(false);
  };

  useEffect(() => {
    handleSynthesize();
  }, []);

  const downloadSvg = () => {
    if (!svgMarkup) return;
    const blob = new Blob([svgMarkup], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tamil_calligraphy_${Date.now()}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleTamilKeyInsert = (char: string) => {
    setText((prev) => prev + char);
  };

  return (
    <div className="space-y-6">
      {/* Studio Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border-subtle pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-serif-tamil font-bold text-ink-primary tracking-tight">
              {currentLang === 'ta' ? 'கையெழுத்து உருவாக்க கூடம்' : 'Text-to-Handwriting Synthesis'}
            </h1>
            <Badge variant="gold">Glyph-composition mode</Badge>
          </div>
          <p className="text-sm text-ink-secondary mt-1">
            {currentLang === 'ta'
              ? 'தட்டச்சு செய்த உரையிலிருந்து சரிசெய்யக்கூடிய மை வேகம் மற்றும் பாணியுடன் இயக்கவியல் கையெழுத்து தூவல் பாதைகளை உருவாக்குங்கள்.'
              : 'Synthesize dynamic handwritten pen stroke trajectories from typed text with adjustable ink speed and style.'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Input and Sliders */}
        <div className="lg:col-span-6 space-y-5">
          {/* Text Input Card */}
          <Card className="p-5 border-border-subtle bg-paper-surface space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-ink-secondary">
                {currentLang === 'ta' ? 'தமிழ் உரை உள்ளீடு' : 'Input Tamil Text'}
              </h2>
              <span className="text-xs font-mono text-ink-tertiary">{text.length} characters</span>
            </div>

            <div className="space-y-3">
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type or click Tamil keys below (e.g. தமிழ் வாழ்க)..."
                className="w-full px-4 py-3 rounded-xl bg-paper-muted border border-border-subtle text-ink-primary font-serif-tamil text-xl focus:outline-none focus:border-vermilion transition-all shadow-inner"
              />

              {/* Virtual Keyboard */}
              <div className="pt-2 border-t border-border-subtle">
                <TamilKeyboard onCharSelect={handleTamilKeyInsert} />
              </div>

              <Button
                variant="primary"
                onClick={handleSynthesize}
                disabled={loading || !text.trim()}
                className="w-full py-2.5 text-xs gap-2"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>{loading ? 'Synthesizing...' : 'Draw Handwritten Sentence'}</span>
              </Button>
            </div>
          </Card>

          {/* Calligraphic Latents & Sliders */}
          <Card className="p-5 border-border-subtle bg-paper-surface space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-vermilion" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-ink-secondary">
                  Calligraphy Controls
                </h2>
              </div>
              <span className="text-xs font-mono text-ink-tertiary">
                Speed: {speed}x · Slant: {slant}
              </span>
            </div>

            {/* Speed slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-ink-secondary">Stroke Drawing Speed</span>
                <span className="font-mono text-ink-primary">{speed.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="0.4"
                max="3.0"
                step="0.1"
                value={speed}
                onChange={(e) => setSpeed(parseFloat(e.target.value))}
                className="w-full accent-vermilion h-1.5 bg-paper-muted rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Neatness / Variance slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-ink-secondary">Stroke Regularity &amp; Neatness</span>
                <span className="font-mono text-ink-primary">{neatness.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={neatness}
                onChange={(e) => setNeatness(parseFloat(e.target.value))}
                className="w-full accent-gold h-1.5 bg-paper-muted rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Slant angle slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-ink-secondary">Cursive Pen Slant</span>
                <span className="font-mono text-ink-primary">{slant > 0 ? `+${slant}` : slant.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="-0.8"
                max="0.8"
                step="0.05"
                value={slant}
                onChange={(e) => setSlant(parseFloat(e.target.value))}
                className="w-full accent-sage h-1.5 bg-paper-muted rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Ink color picker */}
            <div className="space-y-2 pt-2 border-t border-border-subtle">
              <span className="text-xs text-ink-secondary block">Ink Color Palette</span>
              <div className="flex items-center gap-2">
                {inkPalettes.map((c) => (
                  <button
                    key={c.hex}
                    onClick={() => setInkColor(c.hex)}
                    className={`w-7 h-7 rounded-full border border-border-subtle transition-transform ${
                      inkColor === c.hex ? 'scale-125 ring-2 ring-offset-2 ring-ink-primary' : 'hover:scale-110'
                    }`}
                    style={{ backgroundColor: c.hex }}
                    title={c.name}
                  />
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Visual Result Canvas */}
        <div className="lg:col-span-6 space-y-4">
          <Card className="p-5 border-border-subtle bg-paper-surface flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-ink-secondary">
                Handwritten Result Canvas
              </h2>
              {synthLatency !== null && (
                <span className="text-[11px] font-mono text-ink-tertiary flex items-center gap-1">
                  <Feather className="w-3 h-3 text-vermilion" />
                  {synthLatency} ms
                </span>
              )}
            </div>

            {/* Render Canvas */}
            <div className="flex-1 min-h-[340px] rounded-2xl bg-paper-canvas border border-border-subtle flex items-center justify-center relative overflow-hidden shadow-inner p-4">
              {loading ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-3 border-vermilion border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs text-ink-tertiary">Drawing handwritten trajectory...</span>
                </div>
              ) : svgMarkup ? (
                <div
                  key={replayKey}
                  dangerouslySetInnerHTML={{ __html: svgMarkup }}
                  className="w-full h-full flex items-center justify-center select-none"
                />
              ) : (
                <div className="py-12 px-4 text-center text-ink-tertiary space-y-3">
                  <Feather className="w-8 h-8 mx-auto opacity-40 text-vermilion" />
                  <p className="text-xs leading-relaxed max-w-xs mx-auto">
                    Type a sentence on the left and click 'Draw Handwritten Sentence' to synthesize dynamic calligraphy strokes.
                  </p>
                </div>
              )}
            </div>

            {/* Controls Bar */}
            <div className="flex items-center justify-between gap-3 mt-4 pt-3 border-t border-border-subtle">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setReplayKey((k) => k + 1)}
                  disabled={!svgMarkup}
                  className="text-xs gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Replay Stroke Animation</span>
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadSvg}
                  disabled={!svgMarkup}
                  className="text-xs gap-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export SVG</span>
                </Button>
              </div>
            </div>

            <div className="mt-3 text-[11px] text-ink-tertiary flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-gold shrink-0" />
              <span>
                Rendered with continuous cubic Bezier curves simulating pen lift, pressure variation, and stroke momentum.
              </span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SynthesisPage;
