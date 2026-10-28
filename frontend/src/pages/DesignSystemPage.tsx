import React from 'react';
import { Button, Card, Badge, Segmented, ProgressRing, Skeleton } from '../components/ui';
import { PenTool, Check, Sparkles, AlertCircle, Compass, Layers } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export const DesignSystemPage: React.FC = () => {
  const { theme, toggleTheme } = useAppStore();
  const [segmentedVal, setSegmentedVal] = React.useState<'single' | 'word'>('single');
  const [ringVal, setRingVal] = React.useState<number>(85);

  return (
    <div className="space-y-10 py-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="border-b border-border-subtle pb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Badge variant="vermilion" className="mb-2">DESIGN SYSTEM • v2.0</Badge>
          <h1 className="text-3xl font-extrabold text-ink-primary font-serif-tamil tracking-tight">
            Ink &amp; Palm-Leaf Studio
          </h1>
          <p className="text-ink-secondary text-sm mt-1">
            Calm, editorial, typography-first component library for classical Tamil epigraphy and deep learning.
          </p>
        </div>
        <Button variant="secondary" onClick={toggleTheme} size="sm">
          Active Theme: {theme === 'light' ? 'Warm Paper' : 'Night Ink'}
        </Button>
      </div>

      {/* 1. Palette & Surface Tokens */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-ink-primary font-sans flex items-center gap-2">
          <Layers className="w-4 h-4 text-vermilion" />
          <span>Color &amp; Surface Tokens</span>
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          <div className="p-4 rounded-xl bg-paper-canvas border border-border-strong text-xs space-y-1">
            <div className="h-8 rounded bg-paper-canvas border border-border-subtle mb-2" />
            <p className="font-semibold text-ink-primary">Paper Canvas</p>
            <p className="text-ink-tertiary font-mono">#F7F1E5 / #0F0E0D</p>
          </div>
          <div className="p-4 rounded-xl bg-paper-surface border border-border-subtle text-xs space-y-1">
            <div className="h-8 rounded bg-paper-surface border border-border-subtle mb-2" />
            <p className="font-semibold text-ink-primary">Paper Surface</p>
            <p className="text-ink-tertiary font-mono">#FFFFFF / #161513</p>
          </div>
          <div className="p-4 rounded-xl bg-paper-card border border-border-subtle text-xs space-y-1">
            <div className="h-8 rounded bg-paper-card border border-border-subtle mb-2" />
            <p className="font-semibold text-ink-primary">Paper Card</p>
            <p className="text-ink-tertiary font-mono">#FAF6ED / #1A1816</p>
          </div>
          <div className="p-4 rounded-xl bg-paper-card border border-border-subtle text-xs space-y-1">
            <div className="h-8 rounded bg-vermilion mb-2" />
            <p className="font-semibold text-ink-primary">Vermilion</p>
            <p className="text-ink-tertiary font-mono">#C8452D / #D9533B</p>
          </div>
          <div className="p-4 rounded-xl bg-paper-card border border-border-subtle text-xs space-y-1">
            <div className="h-8 rounded bg-gold mb-2" />
            <p className="font-semibold text-ink-primary">Muted Gold</p>
            <p className="text-ink-tertiary font-mono">#B8893A / #C89B4C</p>
          </div>
          <div className="p-4 rounded-xl bg-paper-card border border-border-subtle text-xs space-y-1">
            <div className="h-8 rounded bg-sage mb-2" />
            <p className="font-semibold text-ink-primary">Sage</p>
            <p className="text-ink-tertiary font-mono">#5F7A6B / #749282</p>
          </div>
        </div>
      </section>

      {/* 2. Typography Specimens */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-ink-primary font-sans flex items-center gap-2">
          <Compass className="w-4 h-4 text-gold" />
          <span>Editorial Typography</span>
        </h2>
        <Card className="space-y-4">
          <div>
            <span className="text-xs text-ink-tertiary uppercase font-mono tracking-wider">Tamil Display (Noto Serif Tamil)</span>
            <p className="text-4xl sm:text-5xl font-serif-tamil font-bold text-ink-primary mt-1">
              தமிழ் எழுத்துக்களின் தூய கையெழுத்து
            </p>
          </div>
          <div className="pt-2 border-t border-border-subtle">
            <span className="text-xs text-ink-tertiary uppercase font-mono tracking-wider">UI Sans (Manrope)</span>
            <p className="text-base font-sans text-ink-secondary mt-1">
              Pure deep learning handwritten Tamil character recognition, continuous synthesis, and epigraphic intelligence.
            </p>
          </div>
          <div className="pt-2 border-t border-border-subtle">
            <span className="text-xs text-ink-tertiary uppercase font-mono tracking-wider">Metrics (JetBrains Mono)</span>
            <p className="text-sm font-mono text-ink-primary mt-1">
              LATENCY: 18.11 ms | TOP-1 ACC: 95.16% | VAL CER: 87.12%
            </p>
          </div>
        </Card>
      </section>

      {/* 3. Buttons & Actions */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-ink-primary font-sans">Buttons &amp; Interactions</h2>
        <Card className="flex flex-wrap items-center gap-3">
          <Button variant="primary" leftIcon={<PenTool className="w-4 h-4" />}>
            Primary Vermilion
          </Button>
          <Button variant="secondary">Secondary Paper</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost Button</Button>
          <Button variant="sage" leftIcon={<Check className="w-4 h-4" />}>
            Sage Success
          </Button>
          <Button variant="vermilion">Subtle Vermilion</Button>
          <Button variant="secondary" size="sm">Small</Button>
          <Button variant="primary" size="lg">Large Action</Button>
          <Button variant="secondary" size="icon" aria-label="Icon">
            <Sparkles className="w-4 h-4" />
          </Button>
          <Button variant="primary" isLoading>Loading</Button>
          <Button variant="primary" disabled>Disabled</Button>
        </Card>
      </section>

      {/* 4. Segmented, Badges & Progress Rings */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="space-y-4">
          <h3 className="font-bold text-sm text-ink-primary">Segmented Controls &amp; Badges</h3>
          <div>
            <Segmented
              value={segmentedVal}
              onChange={setSegmentedVal}
              options={[
                { value: 'single', label: 'Single Character' },
                { value: 'word', label: 'Continuous Word' },
              ]}
            />
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            <Badge variant="default">Default Ink</Badge>
            <Badge variant="sage">95.16% Accuracy</Badge>
            <Badge variant="gold">TamilCRNN</Badge>
            <Badge variant="vermilion">Experimental</Badge>
            <Badge variant="outline">ONNX Web</Badge>
          </div>
        </Card>

        <Card className="space-y-4">
          <h3 className="font-bold text-sm text-ink-primary">Calibrated Confidence Rings</h3>
          <div className="flex items-center gap-6">
            <ProgressRing value={96} label="Conf" />
            <ProgressRing value={64} label="Conf" />
            <ProgressRing value={35} label="Low" />
          </div>
          <div className="flex items-center gap-3 pt-2">
            <input
              type="range"
              min="0"
              max="100"
              value={ringVal}
              onChange={(e) => setRingVal(Number(e.target.value))}
              className="w-full accent-vermilion"
            />
            <span className="font-mono text-xs text-ink-secondary w-10">{ringVal}%</span>
          </div>
        </Card>
      </section>

      {/* 5. Skeleton Loaders */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-ink-primary font-sans">Skeleton Loaders</h2>
        <Card className="space-y-3">
          <Skeleton variant="text" width="40%" height={24} />
          <Skeleton variant="text" width="85%" height={16} />
          <Skeleton variant="rectangular" width="100%" height={80} />
        </Card>
      </section>
    </div>
  );
};
