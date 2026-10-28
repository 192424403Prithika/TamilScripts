import React, { useState } from 'react';
import { TamilKeyboard } from '../components/TamilKeyboard';
import { Card, Button, Badge } from '../components/ui';
import { useAppStore } from '../store/useAppStore';
import { Play, Download, RotateCcw, Sliders, Feather, Sparkles } from 'lucide-react';

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

  const inkPalettes = [
    { name: 'Vermilion (செந்தூரம்)', hex: '#C8452D' },
    { name: 'Lampblack Ink (மை)', hex: '#14110F' },
    { name: 'Muted Gold (தங்கம்)', hex: '#B8893A' },
    { name: 'Sage (பச்சை)', hex: '#5F7A6B' },
    { name: 'Palm Ochre (மஞ்சள்)', hex: '#9E7844' }
  ];

  const handleSynthesize = async () => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/generate/text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          speed,
          neatness,
          slant,
          ink_color: inkColor
        })
      });
      if (res.ok) {
        const data = await res.json();
        setSvgMarkup(data.svg_markup);
        setReplayKey((k) => k + 1);
      }
    } catch (e) {
      console.error("Synthesis error:", e);
    } finally {
      setLoading(false);
    }
  };

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
              {currentLang === 'ta' ? 'கையெழுத்து எழுத்துருவாக்கம்' : 'Text-to-Handwriting Synthesis'}
            </h1>
            <Badge variant="gold">
              Graves LSTM-MDN
            </Badge>
          </div>
          <p className="text-sm text-ink-secondary mt-1">
            {currentLang === 'ta'
              ? 'தட்டச்சு செய்யும் தமிழ் சொற்களை இயல்பான பேனா அசைவுகளாகவும் கோடுகளாகவும் மாற்றுகிறது.'
              : 'Synthesize dynamic handwritten pen stroke trajectories from typed text with adjustable ink speed and style.'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Input, Controls & Tamil Keyboard (6 cols) */}
        <div className="lg:col-span-6 space-y-5">
          {/* Text Input Card */}
          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-ink-secondary">
                {currentLang === 'ta' ? 'உள்ளீட்டு உரை' : 'Input Tamil Text'}
              </label>
              <span className="text-xs font-mono text-ink-tertiary">
                {text.length} characters
              </span>
            </div>

            <div className="relative">
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type or click Tamil keys below..."
                className="w-full px-4 py-3 rounded-xl bg-paper-canvas border border-border-subtle font-serif-tamil text-xl text-ink-primary focus:outline-none focus:border-vermilion transition-colors placeholder:text-ink-tertiary"
              />
            </div>

            {/* Quick Scribe Button */}
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={handleSynthesize}
              disabled={loading || !text.trim()}
            >
              <Play className="w-4 h-4 mr-2" />
              <span>{loading ? 'Synthesizing...' : 'Draw Handwritten Sentence'}</span>
            </Button>
          </Card>

          {/* Scribe Sliders & Ink Color */}
          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-ink-secondary flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-vermilion" />
                <span>Calligraphy Controls</span>
              </span>
              <span className="text-[11px] font-mono text-ink-tertiary">
                Speed: {speed}x • Slant: {slant > 0 ? `+${slant}` : slant}
              </span>
            </div>

            <div className="space-y-4 text-xs">
              {/* Drawing Speed */}
              <div>
                <div className="flex justify-between mb-1.5">
                  <span className="text-ink-secondary">Stroke Drawing Speed</span>
                  <span className="font-mono text-ink-primary">{speed.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="3.0"
                  step="0.1"
                  value={speed}
                  onChange={(e) => setSpeed(parseFloat(e.target.value))}
                  className="w-full accent-vermilion cursor-pointer"
                />
              </div>

              {/* Neatness / Regularity */}
              <div>
                <div className="flex justify-between mb-1.5">
                  <span className="text-ink-secondary">Stroke Regularity &amp; Neatness</span>
                  <span className="font-mono text-ink-primary">{neatness.toFixed(1)}</span>
                </div>
                <input
                  type="range"
                  min="0.6"
                  max="2.5"
                  step="0.1"
                  value={neatness}
                  onChange={(e) => setNeatness(parseFloat(e.target.value))}
                  className="w-full accent-gold cursor-pointer"
                />
              </div>

              {/* Slant */}
              <div>
                <div className="flex justify-between mb-1.5">
                  <span className="text-ink-secondary">Cursive Pen Slant</span>
                  <span className="font-mono text-ink-primary">{slant.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="-0.8"
                  max="0.8"
                  step="0.05"
                  value={slant}
                  onChange={(e) => setSlant(parseFloat(e.target.value))}
                  className="w-full accent-sage cursor-pointer"
                />
              </div>

              {/* Ink Palette */}
              <div className="pt-2">
                <span className="text-ink-secondary block mb-2">Ink Color Palette</span>
                <div className="flex items-center gap-2.5">
                  {inkPalettes.map((p) => (
                    <button
                      key={p.hex}
                      type="button"
                      onClick={() => setInkColor(p.hex)}
                      className={`w-7 h-7 rounded-full border-2 transition-transform ${
                        inkColor === p.hex
                          ? 'border-ink-primary scale-110 shadow-paper-sm'
                          : 'border-transparent hover:scale-105'
                      }`}
                      style={{ backgroundColor: p.hex }}
                      title={p.name}
                    />
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Virtual Tamil Keyboard Drawer */}
          <Card className="p-4">
            <TamilKeyboard onCharSelect={handleTamilKeyInsert} />
          </Card>
        </div>

        {/* Right: Synthesis Canvas Preview & Export (6 cols) */}
        <div className="lg:col-span-6 space-y-5">
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-ink-secondary">
                Handwritten Result Canvas
              </span>

              {svgMarkup && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setReplayKey((k) => k + 1)}
                    title="Replay stroke drawing"
                  >
                    <RotateCcw className="w-3.5 h-3.5 mr-1" />
                    <span>Replay</span>
                  </Button>

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={downloadSvg}
                    title="Export vector SVG"
                  >
                    <Download className="w-3.5 h-3.5 mr-1" />
                    <span>Export SVG</span>
                  </Button>
                </div>
              )}
            </div>

            {/* Ruled Paper Stage */}
            <div className="min-h-[300px] rounded-2xl bg-paper-canvas canvas-ruled border border-border-subtle p-6 flex items-center justify-center relative overflow-hidden shadow-inner">
              {svgMarkup ? (
                <div
                  key={replayKey}
                  dangerouslySetInnerHTML={{ __html: svgMarkup }}
                  className="w-full flex justify-center items-center overflow-x-auto py-4"
                  style={{
                    // Apply user-defined playback speed scale via CSS animation duration
                    filter: 'drop-shadow(0 1px 2px rgba(20, 17, 15, 0.15))'
                  }}
                />
              ) : (
                <div className="text-center py-12 text-ink-tertiary space-y-3">
                  <Feather className="w-9 h-9 mx-auto opacity-40 text-vermilion" />
                  <p className="text-xs leading-relaxed max-w-xs mx-auto">
                    Type a sentence on the left and tap &quot;Draw Handwritten Sentence&quot; to synthesize continuous pen trajectories.
                  </p>
                </div>
              )}
            </div>

            {/* Editorial Footer Note */}
            <div className="p-3.5 rounded-xl bg-paper-muted border border-border-subtle flex items-start gap-2.5 text-xs text-ink-secondary leading-relaxed">
              <Sparkles className="w-4 h-4 text-vermilion flex-shrink-0 mt-0.5" />
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
