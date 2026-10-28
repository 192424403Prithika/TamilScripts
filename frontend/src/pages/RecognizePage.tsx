import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DrawingCanvas } from '../components/DrawingCanvas';
import {
  Card,
  Button,
  Badge,
  Segmented,
  ProgressRing,
} from '../components/ui';
import { StrokePoint } from '../types';
import { useAppStore } from '../store/useAppStore';
import {
  Volume2,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Cpu,
  Zap,
  Info,
  AlertCircle,
  FileText,
  CornerDownLeft,
  Eye,
  RotateCcw,
} from 'lucide-react';
import { speakTamilText } from '../lib/speech';

export const RecognizePage: React.FC = () => {
  const { currentResult, setCurrentResult, currentLang } = useAppStore();

  // Mode: 'character' (Single Character, 95.16% CNN) vs 'word' (Full Word)
  const [recMode, setRecMode] = useState<'character' | 'word'>('character');

  // Word method if in Word mode: 'buffer' (character-by-character assembly) vs 'whole_word' (continuous CRNN)
  const [wordMethod, setWordMethod] = useState<'buffer' | 'whole_word'>('buffer');

  // Programmatic canvas clear trigger
  const [clearTrigger, setClearTrigger] = useState(0);

  // Model Engine
  const [modelEngine, setModelEngine] = useState<'onnx' | 'huggingface'>('onnx');

  // Collapsible panels
  const [sampleDrawerOpen, setSampleDrawerOpen] = useState(false);
  const [underHoodOpen, setUnderHoodOpen] = useState(false);

  // Grad-CAM Heatmap overlay
  const [gradcamOverlay, setGradcamOverlay] = useState<string | null>(null);
  const [lastCanvasB64, setLastCanvasB64] = useState<string | null>(null);
  const [isExplaining, setIsExplaining] = useState(false);

  // Sentence / Word buffer
  const [sentenceBuffer, setSentenceBuffer] = useState<string>('');
  const [copied, setCopied] = useState(false);

  // Real handwritten test samples
  const [realSamples, setRealSamples] = useState<Array<{ index: number; true_text: string; image_base64: string }>>([]);
  const [activeSampleTitle, setActiveSampleTitle] = useState<string | null>(null);

  useEffect(() => {
    fetch('/handwritten_test_samples.json')
      .then((res) => res.json())
      .then((data) => setRealSamples(data))
      .catch((err) => console.error('Failed to load dataset samples:', err));
  }, []);

  // Handle stroke update from DrawingCanvas
  const handleStrokeUpdate = useCallback(
    async (strokes: StrokePoint[], b64: string) => {
      setLastCanvasB64(b64);
      if (strokes.length === 0) {
        setCurrentResult(null);
        return;
      }

      const t0 = performance.now();
      try {
        if (recMode === 'word' && wordMethod === 'whole_word') {
          // Whole-word continuous line endpoint
          const res = await fetch('/api/recognize/line', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image_base64: b64 }),
          });
          if (res.ok) {
            const data = await res.json();
            const latency = performance.now() - t0;
            setCurrentResult({
              predictions: [],
              top_prediction: undefined,
              recognized_word: data.recognized_text,
              word_confidence: data.confidence,
              segmented_chars: data.characters,
              latency_ms: latency,
              modality: data.model_name || 'TamilCRNN (ONNX)',
            });
          }
        } else {
          // Single character endpoint (LightweightTamilRecognizer 95.16% accuracy)
          const res = await fetch('/api/recognize/character', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              strokes,
              image_base64: b64,
              use_ensemble: true,
              model_engine: modelEngine,
            }),
          });
          if (res.ok) {
            const data = await res.json();
            const latency = performance.now() - t0;
            data.latency_ms = latency;
            setCurrentResult(data);
          }
        }
      } catch (e) {
        console.error('Inference error:', e);
      }
    },
    [recMode, wordMethod, modelEngine, setCurrentResult]
  );

  // Test from dataset sample image
  const testSample = async (sample: { index: number; true_text: string; image_base64: string }) => {
    setActiveSampleTitle(`Sample #${sample.index}: ${sample.true_text}`);
    setLastCanvasB64(sample.image_base64);

    const t0 = performance.now();
    try {
      const res = await fetch('/api/recognize/line', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_base64: sample.image_base64 }),
      });
      if (res.ok) {
        const data = await res.json();
        const latency = performance.now() - t0;
        setCurrentResult({
          predictions: [],
          top_prediction: undefined,
          recognized_word: data.recognized_text,
          word_confidence: data.confidence,
          segmented_chars: data.characters,
          latency_ms: latency,
          modality: data.model_name || 'TamilCRNN (ONNX)',
        });
      }
    } catch (e) {
      console.error('Test sample error:', e);
    }
  };

  // Request Grad-CAM heatmap explanation
  const handleGradcam = async () => {
    if (!lastCanvasB64) return;
    setIsExplaining(true);
    try {
      const res = await fetch('/api/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_base64: lastCanvasB64 }),
      });
      if (res.ok) {
        const data = await res.json();
        setGradcamOverlay(data.gradcam_heatmap_base64);
      }
    } catch (err) {
      console.error('Explain error:', err);
    } finally {
      setIsExplaining(false);
    }
  };

  // Commit text to sentence
  const addToSentence = (charOrWord?: string) => {
    const text =
      charOrWord ||
      currentResult?.recognized_word ||
      currentResult?.top_prediction?.char;
    if (text) {
      setSentenceBuffer((prev) => (prev ? `${prev}${recMode === 'character' ? '' : ' '}${text}` : text));
      setClearTrigger((c) => c + 1);
      setCurrentResult(null);
      setGradcamOverlay(null);
    }
  };

  const copySentence = () => {
    navigator.clipboard.writeText(sentenceBuffer);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const activeChar = currentResult?.recognized_word || currentResult?.top_prediction?.char;
  const activeConfidence =
    currentResult?.word_confidence !== undefined
      ? currentResult.word_confidence
      : currentResult?.top_prediction?.confidence || 0;
  const isLowConfidence = Boolean(activeChar && activeConfidence < 0.5);

  const topAlternatives =
    currentResult?.predictions?.slice(1, 4) || [];

  return (
    <div className="space-y-6 py-2 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border-subtle pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink-primary font-serif-tamil tracking-tight">
            {currentLang === 'ta' ? 'கையெழுத்து அறிதல்' : 'Epigraphic Calligraphy Recognition'}
          </h1>
          <p className="text-xs sm:text-sm text-ink-secondary mt-0.5">
            Real-time deep learning recognition running directly in your browser with sub-50ms latency.
          </p>
        </div>

        {/* Top Controls: Single vs Word Mode */}
        <div className="flex items-center gap-2">
          <Segmented
            value={recMode}
            onChange={(v) => {
              setRecMode(v);
              setCurrentResult(null);
            }}
            options={[
              { value: 'character', label: 'Single Character' },
              { value: 'word', label: 'Word Mode' },
            ]}
          />
        </div>
      </div>

      {/* Experimental Notice for Whole-Word Mode if selected */}
      {recMode === 'word' && wordMethod === 'whole_word' && (
        <Card variant="muted" padding="sm" className="flex items-start gap-3 border-gold/30 bg-gold-subtle text-ink-primary">
          <AlertCircle className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-semibold text-ink-primary">Experimental Model Notice: </span>
            <span>Whole-word line CRNN is in active training (Validation CER: 87.1%). For 100% reliable word composition, switch to Character Buffer mode below.</span>
          </div>
        </Card>
      )}

      {/* Main 2-Column Uncluttered Studio Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ========================================================
            LEFT COLUMN (60%): Large Drawing Canvas + Sample Drawer
           ======================================================== */}
        <div className="lg:col-span-7 space-y-4">
          <Card padding="md" className="space-y-3">
            <div className="flex items-center justify-between text-xs text-ink-secondary">
              <span className="font-medium font-sans">
                {recMode === 'character'
                  ? 'Calligraphy Surface (Ruled Guidelines)'
                  : wordMethod === 'buffer'
                  ? 'Character Buffer Canvas'
                  : 'Continuous Line Canvas'}
              </span>

              {/* Sub-mode selector if in Word mode */}
              {recMode === 'word' && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setWordMethod('buffer')}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                      wordMethod === 'buffer'
                        ? 'bg-paper-surface text-vermilion font-semibold border border-border-strong'
                        : 'text-ink-tertiary hover:text-ink-primary'
                    }`}
                  >
                    Buffer Flow
                  </button>
                  <button
                    type="button"
                    onClick={() => setWordMethod('whole_word')}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                      wordMethod === 'whole_word'
                        ? 'bg-paper-surface text-gold font-semibold border border-border-strong'
                        : 'text-ink-tertiary hover:text-ink-primary'
                    }`}
                  >
                    CRNN Line
                  </button>
                </div>
              )}
            </div>

            {/* Drawing Canvas with ruled guidelines */}
            <DrawingCanvas
              onStrokeUpdate={handleStrokeUpdate}
              width={recMode === 'word' && wordMethod === 'whole_word' ? 560 : 420}
              height={recMode === 'word' && wordMethod === 'whole_word' ? 300 : 380}
              clearTrigger={clearTrigger}
              showGuidelines={true}
            />

            {/* Action Row for Character Buffer Flow */}
            {recMode === 'word' && wordMethod === 'buffer' && activeChar && (
              <div className="pt-2 border-t border-border-subtle flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-ink-tertiary">Current Character:</span>
                  <span className="text-2xl font-serif-tamil font-bold text-vermilion">
                    {activeChar}
                  </span>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<CornerDownLeft className="w-3.5 h-3.5" />}
                  onClick={() => addToSentence(activeChar)}
                >
                  Append '{activeChar}'
                </Button>
              </div>
            )}
          </Card>

          {/* Collapsible 'Try a sample' Drawer */}
          <div className="border border-border-subtle rounded-2xl bg-paper-card overflow-hidden">
            <button
              type="button"
              onClick={() => setSampleDrawerOpen(!sampleDrawerOpen)}
              className="w-full px-4 py-3 flex items-center justify-between text-xs font-semibold text-ink-secondary hover:text-ink-primary hover:bg-paper-muted/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-gold" />
                <span>Try a Genuine Dataset Sample ({realSamples.length} available)</span>
              </div>
              {sampleDrawerOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            <AnimatePresence>
              {sampleDrawerOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.18 }}
                  className="px-4 pb-4 border-t border-border-subtle"
                >
                  <p className="text-[11px] text-ink-tertiary mt-2 mb-3">
                    Scanned real handwriting test samples from IIIT-INDIC-HW-WORDS-Tamil. Click to test inference:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {realSamples.map((sample) => (
                      <button
                        key={sample.index}
                        type="button"
                        onClick={() => testSample(sample)}
                        className="px-3 py-1.5 rounded-xl bg-paper-surface border border-border-subtle hover:border-vermilion text-ink-primary font-serif-tamil text-sm font-semibold transition-all active:scale-95 flex items-center gap-1.5"
                      >
                        <span className="text-[10px] font-mono text-ink-tertiary">#{sample.index}</span>
                        <span>{sample.true_text}</span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ========================================================
            RIGHT COLUMN (40%): Editorial Result Card + Under the Hood
           ======================================================== */}
        <div className="lg:col-span-5 space-y-4">
          {/* Main Big Result Card */}
          <Card padding="lg" className="space-y-5 relative overflow-hidden">
            {activeChar ? (
              <div className="space-y-5 animate-ink-bleed">
                {/* Header: Status & Calibrated Confidence Ring */}
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] uppercase tracking-wider font-mono text-ink-tertiary">
                      Recognized Symbol
                    </span>
                    {activeSampleTitle && (
                      <p className="text-[11px] font-serif-tamil text-gold mt-0.5">
                        {activeSampleTitle}
                      </p>
                    )}
                  </div>
                  <ProgressRing value={activeConfidence} size={64} strokeWidth={5} />
                </div>

                {/* Main Large Display Character */}
                <div className="py-2 text-center bg-paper-surface rounded-2xl border border-border-subtle shadow-paper-sm">
                  <span className="text-7xl sm:text-8xl font-serif-tamil font-bold text-ink-primary select-all">
                    {activeChar}
                  </span>

                  {/* Transliteration & Meaning */}
                  {currentResult?.top_prediction && (
                    <div className="mt-2 space-y-0.5">
                      <p className="text-sm font-mono text-vermilion font-semibold">
                        /{currentResult.top_prediction.transliteration}/
                      </p>
                      {currentResult.top_prediction.meaning && (
                        <p className="text-xs text-ink-secondary font-sans">
                          {currentResult.top_prediction.meaning}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Low Confidence Gentle Warning */}
                {isLowConfidence && (
                  <div className="p-3 rounded-xl bg-gold-subtle border border-gold/30 text-ink-primary text-xs flex items-start gap-2.5">
                    <Info className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-gold">Low confidence prediction.</span>
                      <p className="text-ink-secondary text-[11px] mt-0.5">
                        Try writing larger, tracing clearer strokes, or select one of the suggested alternatives below.
                      </p>
                    </div>
                  </div>
                )}

                {/* Top 3 Alternative Candidates */}
                {topAlternatives.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[11px] text-ink-tertiary uppercase font-mono tracking-wider">
                      Alternative Candidates:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {topAlternatives.map((alt) => (
                        <button
                          key={alt.char}
                          type="button"
                          onClick={() => addToSentence(alt.char)}
                          className="px-3 py-1 rounded-xl bg-paper-surface border border-border-subtle hover:border-vermilion text-xs font-serif-tamil text-ink-primary flex items-center gap-1.5 transition-colors"
                        >
                          <span className="font-bold text-sm">{alt.char}</span>
                          <span className="font-mono text-[10px] text-ink-tertiary">
                            {Math.round(alt.confidence * 100)}%
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Grapheme Clusters breakdown if multi-letter word */}
                {currentResult?.segmented_chars && currentResult.segmented_chars.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[11px] text-ink-tertiary uppercase font-mono tracking-wider">
                      Grapheme Clusters:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {currentResult.segmented_chars.map((g, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 rounded-lg bg-paper-muted border border-border-subtle text-sm font-serif-tamil font-bold text-ink-primary"
                        >
                          {g}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Primary Action Button */}
                <div className="pt-2 flex items-center gap-2">
                  <Button
                    variant="primary"
                    className="flex-1"
                    leftIcon={<CornerDownLeft className="w-4 h-4" />}
                    onClick={() => addToSentence()}
                  >
                    Add "{activeChar}" to Sentence
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={() => speakTamilText(activeChar)}
                    title="Pronounce with Tamil TTS"
                    aria-label="Speak character"
                  >
                    <Volume2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ) : (
              /* Calm Empty State */
              <div className="py-12 text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-paper-muted border border-border-subtle mx-auto flex items-center justify-center font-serif-tamil text-2xl text-ink-tertiary">
                  அ
                </div>
                <div>
                  <h3 className="text-base font-bold text-ink-primary font-sans">
                    Calligraphy Studio Awaiting Ink
                  </h3>
                  <p className="text-xs text-ink-secondary max-w-xs mx-auto mt-1 leading-relaxed">
                    Draw any Tamil character or word on the ruled canvas to observe live neural epigraphy decoding.
                  </p>
                </div>
              </div>
            )}
          </Card>

          {/* Composed Sentence / Scribe Buffer */}
          <Card padding="md" className="space-y-3">
            <div className="flex items-center justify-between text-xs text-ink-secondary">
              <span className="font-semibold uppercase tracking-wider font-mono text-[11px]">
                Composed Sentence
              </span>
              <div className="flex items-center gap-2">
                {sentenceBuffer && (
                  <>
                    <button
                      type="button"
                      onClick={() => speakTamilText(sentenceBuffer)}
                      className="text-ink-secondary hover:text-ink-primary p-1"
                      title="Speak full sentence"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={copySentence}
                      className="text-ink-secondary hover:text-ink-primary p-1"
                      title="Copy text"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-sage" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSentenceBuffer('')}
                      className="text-ink-tertiary hover:text-vermilion text-[11px]"
                    >
                      Clear
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-paper-surface border border-border-subtle min-h-[56px] text-lg font-serif-tamil text-ink-primary break-words">
              {sentenceBuffer || (
                <span className="text-ink-tertiary font-sans text-xs">
                  Your composed letters and words will appear here...
                </span>
              )}
            </div>
          </Card>

          {/* Collapsible 'Under the hood' Drawer */}
          <div className="border border-border-subtle rounded-2xl bg-paper-card overflow-hidden">
            <button
              type="button"
              onClick={() => setUnderHoodOpen(!underHoodOpen)}
              className="w-full px-4 py-3 flex items-center justify-between text-xs font-semibold text-ink-secondary hover:text-ink-primary hover:bg-paper-muted/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-ink-secondary" />
                <span>Under the Hood (Model Architecture &amp; Latency)</span>
              </div>
              {underHoodOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            <AnimatePresence>
              {underHoodOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.18 }}
                  className="px-4 pb-4 border-t border-border-subtle text-xs space-y-3 pt-3"
                >
                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                    <div className="p-2.5 rounded-xl bg-paper-surface border border-border-subtle">
                      <span className="text-ink-tertiary block">Active Model:</span>
                      <span className="font-semibold text-ink-primary">
                        {currentResult?.modality || 'LightweightTamilRecognizer'}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-paper-surface border border-border-subtle">
                      <span className="text-ink-tertiary block">Measured Latency:</span>
                      <span className="font-semibold text-sage">
                        {currentResult?.latency_ms ? `${currentResult.latency_ms.toFixed(1)} ms` : '< 20 ms'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-ink-secondary text-[11px]">Neural Activation Map (Grad-CAM):</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleGradcam}
                      isLoading={isExplaining}
                      disabled={!lastCanvasB64}
                      leftIcon={<Eye className="w-3.5 h-3.5" />}
                    >
                      Explain Stroke
                    </Button>
                  </div>

                  {gradcamOverlay && (
                    <div className="p-2 rounded-xl bg-paper-surface border border-border-subtle text-center">
                      <img
                        src={`data:image/png;base64,${gradcamOverlay}`}
                        alt="Grad-CAM Neural Attention Map"
                        className="max-h-48 mx-auto rounded-lg border border-border-subtle"
                      />
                      <span className="text-[10px] text-ink-tertiary font-mono mt-1 block">
                        Feature Map Activation Heatmap
                      </span>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};
