import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DrawingCanvas } from '../components/DrawingCanvas';
import { StrokePoint, QualityScoreResult } from '../types';
import { useAppStore } from '../store/useAppStore';
import { Button, Card, Badge, ProgressRing } from '../components/ui';
import { Award, Flame, ArrowRight, RotateCcw, Volume2, CheckCircle2, Feather } from 'lucide-react';
import { speakTamilText } from '../lib/speech';

interface Lesson {
  id: number;
  classId: number;
  char: string;
  transliteration: string;
  strokes: number;
  meaning: string;
  // SVG path approximation for ghost stroke tracing
  ghostPath?: string;
}

const lessons: Lesson[] = [
  {
    id: 0,
    classId: 0,
    char: 'அ',
    transliteration: 'a',
    strokes: 2,
    meaning: "Short 'a' vowel (அகரம்)",
    ghostPath: "M 110 90 C 130 70, 160 70, 180 90 C 200 115, 175 145, 140 145 C 105 145, 95 190, 140 210 C 180 225, 230 190, 240 145 M 140 145 L 240 145 M 210 90 L 210 260"
  },
  {
    id: 1,
    classId: 1,
    char: 'ஆ',
    transliteration: 'aa',
    strokes: 3,
    meaning: "Long 'aa' vowel (ஆகாரம்)",
    ghostPath: "M 100 90 C 120 70, 150 70, 170 90 C 190 115, 165 145, 130 145 C 95 145, 85 190, 130 210 C 170 225, 220 190, 230 145 M 130 145 L 230 145 M 200 90 L 200 250 C 200 270, 240 270, 260 240"
  },
  {
    id: 2,
    classId: 2,
    char: 'இ',
    transliteration: 'i',
    strokes: 3,
    meaning: "Short 'i' vowel (இகரம்)",
    ghostPath: "M 100 100 C 120 80, 150 80, 160 100 C 170 125, 140 145, 110 145 C 80 145, 80 200, 130 210 C 190 220, 220 160, 220 120 C 220 80, 170 80, 140 100"
  },
  {
    id: 3,
    classId: 31,
    char: 'க',
    transliteration: 'ka',
    strokes: 2,
    meaning: "Velar stop 'ka' (ககரம்)",
    ghostPath: "M 90 90 L 220 90 M 150 90 L 150 250 M 150 160 C 210 160, 240 180, 240 215 C 240 250, 180 260, 150 250"
  },
  {
    id: 4,
    classId: 39,
    char: 'ப',
    transliteration: 'pa',
    strokes: 1,
    meaning: "Labial stop 'pa' (பகரம்)",
    ghostPath: "M 90 90 L 90 240 L 220 240 L 220 90"
  },
  {
    id: 5,
    classId: 40,
    char: 'ம',
    transliteration: 'ma',
    strokes: 2,
    meaning: "Nasal 'ma' (மகரம்)",
    ghostPath: "M 90 90 L 90 240 L 220 240 L 220 90 M 90 170 L 220 170"
  },
  {
    id: 6,
    classId: 45,
    char: 'ழ',
    transliteration: 'zha',
    strokes: 3,
    meaning: "Retroflex 'zha' (சிறப்பு ழகரம்)",
    ghostPath: "M 90 90 L 190 90 M 135 90 L 135 240 M 135 155 C 190 155, 220 180, 220 210 C 220 250, 170 255, 140 245 C 120 240, 110 210, 140 200 L 230 200"
  }
];

export const CoachPage: React.FC = () => {
  const { streakDays, xp, addXP, currentLang } = useAppStore();

  const [currentLessonIdx, setCurrentLessonIdx] = useState<number>(0);
  const currentLesson = lessons[currentLessonIdx];

  const [scoreResult, setScoreResult] = useState<QualityScoreResult | null>(null);
  const [evaluating, setEvaluating] = useState<boolean>(false);
  const [showGhost, setShowGhost] = useState<boolean>(true);
  const [splashActive, setSplashActive] = useState<boolean>(false);

  const handleStrokeUpdate = async (strokes: StrokePoint[], b64: string) => {
    if (strokes.length < 5) return;
    setEvaluating(true);
    try {
      const res = await fetch('/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_class_id: currentLesson.classId,
          user_image_base64: b64
        })
      });
      if (res.ok) {
        const data: QualityScoreResult = await res.json();
        setScoreResult(data);

        // Award XP & trigger ink-splash on passing score
        if (data.overall_score >= 75) {
          addXP(25);
          setSplashActive(true);
          setTimeout(() => setSplashActive(false), 1400);
        }
      }
    } catch (e) {
      console.error("Coach scoring error:", e);
    } finally {
      setEvaluating(false);
    }
  };

  const nextLesson = () => {
    setCurrentLessonIdx((prev) => (prev + 1) % lessons.length);
    setScoreResult(null);
    setSplashActive(false);
  };

  return (
    <div className="space-y-6">
      {/* Studio Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border-subtle pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-serif-tamil font-bold text-ink-primary tracking-tight">
              {currentLang === 'ta' ? 'எழுத்துக்கலை பயிற்சி கூடம்' : 'Handwriting Practice Coach'}
            </h1>
            <Badge variant="gold">
              Siamese Evaluator
            </Badge>
          </div>
          <p className="text-sm text-ink-secondary mt-1">
            {currentLang === 'ta'
              ? 'விகிதாசாரம், வளைவுகள் மற்றும் நேர்க்கோடுகளுக்கான நிகழ்நேர நரம்பியல் வழிகாட்டி.'
              : 'Trace the animated ghost stroke or write freehand. Instant neural feedback on proportions and curves.'}
          </p>
        </div>

        {/* Scribe Stats */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-paper-surface border border-border-subtle text-xs font-mono font-medium text-ink-secondary">
            <Flame className="w-3.5 h-3.5 text-vermilion fill-vermilion" />
            <span>{streakDays}d Streak</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-paper-surface border border-border-subtle text-xs font-mono font-bold text-gold">
            <Award className="w-3.5 h-3.5" />
            <span>{xp} XP</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Studio Practice Canvas (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="p-5 sm:p-6 space-y-5 relative overflow-hidden">
            {/* Top Lesson Selector & Audio */}
            <div className="flex items-center justify-between pb-4 border-b border-border-subtle">
              <div className="flex items-center gap-4">
                {/* Letter Seal */}
                <div className="w-16 h-16 rounded-2xl bg-paper-muted border border-border-subtle flex items-center justify-center font-serif-tamil text-3xl font-bold text-ink-primary shadow-paper-sm">
                  {currentLesson.char}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-ink-primary font-sans">
                      {currentLesson.transliteration}
                    </span>
                    <button
                      type="button"
                      onClick={() => speakTamilText(currentLesson.char)}
                      className="p-1 rounded-lg text-ink-secondary hover:text-vermilion hover:bg-paper-muted transition-colors"
                      title="Pronounce"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-ink-secondary">{currentLesson.meaning}</p>
                  <p className="text-[11px] font-mono text-ink-tertiary mt-0.5">
                    {currentLesson.strokes} stroke sequence
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Ghost Stroke Toggle */}
                <button
                  type="button"
                  onClick={() => setShowGhost(!showGhost)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                    showGhost
                      ? 'bg-vermilion/10 text-vermilion border-vermilion/30'
                      : 'bg-paper-surface text-ink-secondary border-border-subtle hover:text-ink-primary'
                  }`}
                  title="Toggle ghost stroke guide"
                >
                  {showGhost ? 'Guide: On' : 'Guide: Off'}
                </button>

                <Button variant="secondary" size="sm" onClick={nextLesson}>
                  <span>Next</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>
            </div>

            {/* Drawing Canvas with Animated Ghost Stroke & Ruled Guidelines */}
            <div className="relative flex flex-col items-center justify-center p-3 rounded-2xl bg-paper-canvas border border-border-subtle">
              {/* Ruled Guidelines Layer */}
              <div className="relative w-[340px] h-[340px] sm:w-[360px] sm:h-[360px] rounded-xl overflow-hidden canvas-ruled shadow-inner">
                {/* Animated Ghost Stroke Trace Guide */}
                {showGhost && currentLesson.ghostPath && (
                  <svg
                    viewBox="0 0 340 340"
                    className="absolute inset-0 w-full h-full pointer-events-none z-0"
                  >
                    {/* Background faint guide */}
                    <path
                      d={currentLesson.ghostPath}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="22"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-vermilion/15"
                    />
                    {/* Animated moving trace stroke */}
                    <motion.path
                      d={currentLesson.ghostPath}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeDasharray="8 12"
                      className="text-vermilion/60"
                      initial={{ pathOffset: 0 }}
                      animate={{ pathOffset: [0, 1] }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
                    />
                  </svg>
                )}

                {/* Actual Drawing Canvas */}
                <div className="relative z-10 w-full h-full">
                  <DrawingCanvas
                    onStrokeUpdate={handleStrokeUpdate}
                    width={360}
                    height={360}
                  />
                </div>

                {/* Ink Splash Animation on Success (Score >= 75) */}
                <AnimatePresence>
                  {splashActive && (
                    <motion.div
                      className="absolute inset-0 pointer-events-none flex items-center justify-center z-20"
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 1.2 }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                    >
                      <svg width="240" height="240" viewBox="0 0 200 200" className="text-vermilion/80">
                        {/* Central droplet burst */}
                        <circle cx="100" cy="100" r="14" fill="currentColor" />
                        {/* Organic ink droplets */}
                        <circle cx="65" cy="70" r="5" fill="currentColor" />
                        <circle cx="140" cy="65" r="4.5" fill="currentColor" />
                        <circle cx="145" cy="135" r="6" fill="currentColor" />
                        <circle cx="70" cy="140" r="4" fill="currentColor" />
                        <circle cx="100" cy="45" r="3.5" fill="currentColor" />
                        <circle cx="160" cy="100" r="4" fill="currentColor" />
                        <circle cx="40" cy="105" r="3.5" fill="currentColor" />
                        <circle cx="95" cy="165" r="5" fill="currentColor" />
                        {/* Splatter ring */}
                        <motion.circle
                          cx="100"
                          cy="100"
                          r="50"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeDasharray="4 8"
                          initial={{ scale: 0.4, opacity: 0.9 }}
                          animate={{ scale: 1.4, opacity: 0 }}
                          transition={{ duration: 0.8, ease: 'easeOut' }}
                        />
                      </svg>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Status footer below canvas */}
              <div className="w-full mt-3 flex items-center justify-between text-xs text-ink-secondary">
                <span>Draw continuously along the ruled baseline</span>
                {evaluating && (
                  <span className="font-mono text-vermilion animate-pulse">
                    Evaluating stroke...
                  </span>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Right: Scribe Evaluation Card (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <h2 className="text-sm font-semibold text-ink-primary uppercase tracking-wider font-sans">
                AI Diagnostic Scorecard
              </h2>
              {scoreResult && (
                <Badge variant={scoreResult.pass_status ? 'sage' : 'vermilion'}>
                  {scoreResult.pass_status ? 'Mastered' : 'In Practice'}
                </Badge>
              )}
            </div>

            {scoreResult ? (
              <div className="space-y-5">
                {/* Main Progress Ring & Score */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-paper-muted border border-border-subtle">
                  <div>
                    <span className="text-xs text-ink-secondary font-medium">Quality Rating</span>
                    <div className="text-3xl font-serif-tamil font-bold text-ink-primary mt-0.5">
                      {scoreResult.overall_score.toFixed(0)}
                      <span className="text-sm font-sans font-normal text-ink-tertiary"> / 100</span>
                    </div>
                  </div>
                  <ProgressRing
                    value={scoreResult.overall_score}
                    size={72}
                    strokeWidth={6}
                    colorClass={scoreResult.pass_status ? 'text-sage' : 'text-vermilion'}
                  />
                </div>

                {/* Sub-Metric Bars */}
                <div className="space-y-3.5">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-ink-secondary">Loop Closure &amp; Curves</span>
                      <span className="font-mono text-ink-primary">{scoreResult.loops_score.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-paper-canvas rounded-full h-2 border border-border-subtle overflow-hidden">
                      <div
                        className="bg-vermilion h-2 rounded-full transition-all duration-300"
                        style={{ width: `${scoreResult.loops_score}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-ink-secondary">Proportional Balance</span>
                      <span className="font-mono text-ink-primary">{scoreResult.proportions_score.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-paper-canvas rounded-full h-2 border border-border-subtle overflow-hidden">
                      <div
                        className="bg-gold h-2 rounded-full transition-all duration-300"
                        style={{ width: `${scoreResult.proportions_score}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-ink-secondary">Stroke Smoothness</span>
                      <span className="font-mono text-ink-primary">{scoreResult.smoothness_score.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-paper-canvas rounded-full h-2 border border-border-subtle overflow-hidden">
                      <div
                        className="bg-sage h-2 rounded-full transition-all duration-300"
                        style={{ width: `${scoreResult.smoothness_score}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* AI Coach Diagnostic Note */}
                <div className="p-4 rounded-xl bg-paper-muted border border-border-subtle text-xs text-ink-secondary leading-relaxed">
                  <span className="font-bold text-ink-primary block mb-1">Scribe Mentor Observation:</span>
                  {scoreResult.feedback_text}
                </div>
              </div>
            ) : (
              <div className="py-12 px-4 text-center text-ink-tertiary space-y-3">
                <Feather className="w-8 h-8 mx-auto opacity-40 text-vermilion" />
                <p className="text-xs leading-relaxed max-w-xs mx-auto">
                  Trace the letter on the ruled paper canvas to receive real-time Siamese neural scoring on stroke alignment.
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CoachPage;
