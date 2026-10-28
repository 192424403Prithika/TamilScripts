import React, { useState, useEffect } from 'react';
import { Card, Button, Badge } from '../components/ui';
import { useAppStore } from '../store/useAppStore';
import { Download, RefreshCw, Sliders, Sparkles, Feather } from 'lucide-react';

export const GeneratePage: React.FC = () => {
  const { currentLang } = useAppStore();
  const [selectedClassId, setSelectedClassId] = useState<number>(0);
  const [slant, setSlant] = useState<number>(0.0);
  const [thickness, setThickness] = useState<number>(0.0);
  const [seed, setSeed] = useState<number>(1337);
  const [generatedImg, setGeneratedImg] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [genTime, setGenTime] = useState<number>(0);

  // Curated character palette
  const samplePalette = [
    { id: 0, char: 'அ', name: 'a' },
    { id: 1, char: 'ஆ', name: 'aa' },
    { id: 2, char: 'இ', name: 'i' },
    { id: 3, char: 'ஈ', name: 'ii' },
    { id: 4, char: 'உ', name: 'u' },
    { id: 5, char: 'ஊ', name: 'uu' },
    { id: 13, char: 'க்', name: 'k' },
    { id: 14, char: 'ங்', name: 'ng' },
    { id: 15, char: 'ச்', name: 'c' },
    { id: 31, char: 'க', name: 'ka' },
    { id: 33, char: 'ச', name: 'sa' },
    { id: 37, char: 'த', name: 'ta' },
    { id: 39, char: 'ப', name: 'pa' },
    { id: 40, char: 'ம', name: 'ma' },
    { id: 45, char: 'ழ', name: 'zha' }
  ];

  const handleGenerate = async (newSeed?: number) => {
    setLoading(true);
    const activeSeed = newSeed !== undefined ? newSeed : seed;
    try {
      const res = await fetch('/api/generate/character', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          class_id: selectedClassId,
          style: { slant, thickness },
          seed: activeSeed
        })
      });
      if (res.ok) {
        const data = await res.json();
        setGeneratedImg(data.image_base64);
        setGenTime(data.generation_time_ms);
      }
    } catch (e) {
      console.error("Generation error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleGenerate();
  }, [selectedClassId, slant, thickness]);

  const randomizeSeed = () => {
    const nextSeed = Math.floor(Math.random() * 100000);
    setSeed(nextSeed);
    handleGenerate(nextSeed);
  };

  const downloadImage = () => {
    if (!generatedImg) return;
    const a = document.createElement('a');
    a.href = generatedImg;
    a.download = `tamil_glyph_${selectedClassId}_seed_${seed}.png`;
    a.click();
  };

  const activeChar = samplePalette.find((p) => p.id === selectedClassId)?.char || 'அ';

  return (
    <div className="space-y-6">
      {/* Studio Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border-subtle pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-serif-tamil font-bold text-ink-primary tracking-tight">
              {currentLang === 'ta' ? 'எழுத்து உருவாக்க கூடம்' : 'Character Generation Studio'}
            </h1>
            <Badge variant="gold">
              Conditional cGAN
            </Badge>
          </div>
          <p className="text-sm text-ink-secondary mt-1">
            {currentLang === 'ta'
              ? 'வடிவவியல் மற்றும் பேனா பாணி அளவுகோல்களைக் கொண்டு கைவினை எழுத்துக்களை உருவாக்குங்கள்.'
              : 'Synthesize isolated handwritten Tamil glyphs conditioned on class, continuous pen style, and latent seed.'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Character Palette & Style Sliders (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Target Glyph Selection Grid */}
          <Card className="p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-border-subtle pb-2.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-ink-secondary">
                {currentLang === 'ta' ? 'எழுத்து தேர்வு' : 'Select Target Glyph'}
              </span>
              <span className="text-xs font-serif-tamil font-bold text-vermilion">
                Current: {activeChar}
              </span>
            </div>

            <div className="grid grid-cols-5 sm:grid-cols-8 gap-2 pt-1">
              {samplePalette.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedClassId(item.id)}
                  className={`h-12 rounded-xl flex flex-col items-center justify-center border transition-all ${
                    selectedClassId === item.id
                      ? 'bg-vermilion text-white border-vermilion shadow-paper-sm scale-105'
                      : 'bg-paper-surface hover:bg-paper-muted text-ink-primary border-border-subtle'
                  }`}
                >
                  <span className="font-serif-tamil text-xl font-bold leading-tight">
                    {item.char}
                  </span>
                  <span className="text-[9px] font-mono opacity-80 leading-none">
                    {item.name}
                  </span>
                </button>
              ))}
            </div>
          </Card>

          {/* Continuous Style Parameters */}
          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-ink-secondary flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-vermilion" />
                <span>Continuous Calligraphic Latents</span>
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={randomizeSeed}
                title="Randomize latent seed"
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1" />
                <span>Random Seed</span>
              </Button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Slant Parameter */}
              <div>
                <div className="flex justify-between mb-1.5">
                  <span className="text-ink-secondary">Stroke Slant (Angle)</span>
                  <span className="font-mono text-ink-primary">{slant > 0 ? `+${slant.toFixed(2)}` : slant.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="-0.6"
                  max="0.6"
                  step="0.05"
                  value={slant}
                  onChange={(e) => setSlant(parseFloat(e.target.value))}
                  className="w-full accent-vermilion cursor-pointer"
                />
              </div>

              {/* Stroke Thickness */}
              <div>
                <div className="flex justify-between mb-1.5">
                  <span className="text-ink-secondary">Nib Pressure &amp; Thickness</span>
                  <span className="font-mono text-ink-primary">{thickness > 0 ? `+${thickness.toFixed(2)}` : thickness.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="-0.5"
                  max="0.5"
                  step="0.05"
                  value={thickness}
                  onChange={(e) => setThickness(parseFloat(e.target.value))}
                  className="w-full accent-gold cursor-pointer"
                />
              </div>

              {/* Seed Display */}
              <div className="flex items-center justify-between pt-2 border-t border-border-subtle">
                <span className="text-ink-secondary">Latent Style Seed</span>
                <span className="font-mono text-xs text-ink-primary bg-paper-muted px-2.5 py-1 rounded-lg border border-border-subtle">
                  {seed}
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* Right: Synthesis Canvas Preview & Download (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-ink-secondary">
                Generated Glyph
              </span>
              {genTime > 0 && (
                <span className="font-mono text-[11px] text-ink-tertiary">
                  Latency: {genTime.toFixed(1)} ms
                </span>
              )}
            </div>

            {/* Glyph Stage */}
            <div className="w-full aspect-square max-w-[320px] mx-auto rounded-2xl bg-paper-canvas canvas-ruled border border-border-subtle flex items-center justify-center p-6 relative overflow-hidden shadow-inner">
              {loading ? (
                <div className="flex flex-col items-center gap-2 text-ink-tertiary animate-pulse">
                  <Feather className="w-8 h-8 text-vermilion" />
                  <span className="text-xs font-mono">Neural Forward Pass...</span>
                </div>
              ) : generatedImg ? (
                <img
                  src={generatedImg}
                  alt={`Generated glyph for class ${selectedClassId}`}
                  className="w-full h-full object-contain filter drop-shadow-sm select-none"
                />
              ) : (
                <div className="text-center text-ink-tertiary space-y-2">
                  <Sparkles className="w-8 h-8 mx-auto opacity-30 text-vermilion" />
                  <p className="text-xs">Select glyph and adjust sliders</p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <Button
                variant="primary"
                className="flex-1"
                onClick={() => handleGenerate()}
                disabled={loading}
              >
                <RefreshCw className={`w-3.5 h-3.5 mr-2 ${loading ? 'animate-spin' : ''}`} />
                <span>Regenerate</span>
              </Button>

              <Button
                variant="secondary"
                onClick={downloadImage}
                disabled={!generatedImg}
              >
                <Download className="w-3.5 h-3.5 mr-1.5" />
                <span>PNG</span>
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default GeneratePage;
