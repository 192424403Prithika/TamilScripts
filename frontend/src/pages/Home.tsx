import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';
import { Card, Button, Badge } from '../components/ui';
import {
  PenTool,
  Sparkles,
  Edit3,
  ArrowRight,
  ShieldCheck,
  Zap,
  BookOpen,
  Play,
  Pause,
  Volume2,
  VolumeX,
} from 'lucide-react';

export const Home: React.FC = () => {
  const { setActiveTab, currentLang } = useAppStore();

  const isTa = currentLang === 'ta';

  // Video Animation State from workspace folder
  const [activeScene, setActiveScene] = useState<'scene1' | 'scene2' | 'scene3' | 'vector'>('scene1');
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const nextMuted = !isMuted;
    videoRef.current.muted = nextMuted;
    setIsMuted(nextMuted);
  };

  return (
    <div className="space-y-16 py-6 max-w-5xl mx-auto select-none">
      {/* ========================================================
          HERO SECTION
         ======================================================== */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pt-4">
        {/* Left Hero Content */}
        <div className="lg:col-span-7 space-y-6">
          <Badge variant="vermilion">
            {isTa ? 'தூய நரம்பியல் தொழில்நுட்பம்' : 'Classical Epigraphy Meets Deep Learning'}
          </Badge>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-ink-primary font-serif-tamil tracking-tight leading-[1.15]">
            {isTa
              ? 'தமிழ் கையெழுத்தின் நரம்பியல் கலைக்கூடம்'
              : 'The Art & Epigraphy of Handwritten Tamil.'}
          </h1>

          <p className="text-base sm:text-lg text-ink-secondary leading-relaxed font-sans max-w-xl">
            {isTa
              ? 'உலாவியிலேயே உடனடியாக இயங்கும் ஆழ்கற்றல் கையெழுத்து அறிதல், தொடர் உருவாக்கம் மற்றும் பயிற்சி தளம்.'
              : 'Real-time deep learning recognition running client-side in under 50ms, neural stroke synthesis, and interactive calligraphy coaching.'}
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button
              variant="primary"
              size="lg"
              leftIcon={<PenTool className="w-5 h-5" />}
              rightIcon={<ArrowRight className="w-4 h-4" />}
              onClick={() => setActiveTab('recognize')}
            >
              {isTa ? 'எழுதத் தொடங்குங்கள்' : 'Start Writing'}
            </Button>
            <Button
              variant="secondary"
              size="lg"
              leftIcon={<BookOpen className="w-4 h-4" />}
              onClick={() => setActiveTab('coach')}
            >
              {isTa ? 'பயிற்சி செய்க' : 'Practice Coach'}
            </Button>
          </div>

          <div className="flex items-center gap-6 pt-3 text-xs text-ink-tertiary font-mono">
            <div className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-vermilion" />
              <span>&lt; 50ms Latency</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-sage" />
              <span>95.16% Test Accuracy</span>
            </div>
          </div>
        </div>

        {/* Right Hero: Active Studio Video Animation from Folder */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <Card padding="none" className="w-full relative overflow-hidden bg-paper-surface border-border-strong shadow-paper-lg">
            {/* Video Player Container */}
            <div className="relative aspect-video w-full bg-paper-canvas flex items-center justify-center overflow-hidden border-b border-border-subtle group">
              {activeScene !== 'vector' ? (
                <div className="relative w-full h-full">
                  <video
                    ref={videoRef}
                    key={activeScene}
                    src={`/videos/${activeScene}.mp4`}
                    autoPlay
                    loop
                    muted={isMuted}
                    playsInline
                    className="w-full h-full object-cover select-none"
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                  />

                  {/* Video Overlay Controls (Play/Pause & Sound) */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-3 z-10">
                    <button
                      type="button"
                      onClick={togglePlay}
                      className="px-2.5 py-1.5 rounded-lg bg-black/60 backdrop-blur-md text-white text-xs font-medium hover:bg-black/80 transition-all flex items-center gap-1.5"
                    >
                      {isPlaying ? (
                        <>
                          <Pause className="w-3.5 h-3.5 fill-white" />
                          <span>Pause</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 fill-white" />
                          <span>Play</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={toggleMute}
                      className="p-1.5 rounded-lg bg-black/60 backdrop-blur-md text-white hover:bg-black/80 transition-all"
                      title={isMuted ? 'Unmute video audio' : 'Mute video audio'}
                    >
                      {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              ) : (
                /* Animated Ink Drawing of Tamil Letter 'அ' */
                <div className="relative w-full h-full flex flex-col items-center justify-center p-6 bg-gradient-to-br from-paper-surface to-paper-muted">
                  <svg
                    viewBox="0 0 200 200"
                    className="w-40 h-40 filter drop-shadow-sm"
                    aria-label="Animated Tamil letter 'அ' drawing itself"
                  >
                    <circle cx="100" cy="100" r="90" fill="none" stroke="var(--border-subtle)" strokeWidth="1" strokeDasharray="3 3" />
                    <line x1="20" y1="100" x2="180" y2="100" stroke="var(--border-subtle)" strokeWidth="1" strokeDasharray="2 2" />

                    <motion.path
                      d="M 65 75 C 65 60, 95 60, 95 75 C 95 95, 60 100, 60 115 C 60 135, 95 135, 110 120 C 125 105, 135 75, 155 75 M 105 118 L 155 118 M 155 60 L 155 145"
                      fill="none"
                      stroke="var(--ink-primary)"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      initial={{ pathLength: 0, opacity: 0.2 }}
                      animate={{ pathLength: 1, opacity: 1 }}
                      transition={{
                        duration: 2.8,
                        repeat: Infinity,
                        repeatType: 'loop',
                        ease: 'easeInOut',
                        repeatDelay: 1.2,
                      }}
                    />
                    <motion.circle
                      cx="155"
                      cy="60"
                      r="4"
                      fill="var(--vermilion)"
                      initial={{ scale: 0 }}
                      animate={{ scale: [0, 1.4, 1] }}
                      transition={{ duration: 0.6, delay: 2.2, repeat: Infinity, repeatDelay: 3.4 }}
                    />
                  </svg>
                  <div className="mt-1 text-center">
                    <span className="font-mono text-[10px] text-ink-tertiary uppercase tracking-wider block">
                      Vector Scribe Simulation
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Scene Selector Strip (Scene 1, Scene 2, Scene 3, Vector) */}
            <div className="p-2.5 bg-paper-surface border-t border-border-subtle flex items-center justify-between gap-1 overflow-x-auto text-xs">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setActiveScene('scene1')}
                  className={`px-2.5 py-1 rounded-lg font-mono text-[11px] transition-all ${
                    activeScene === 'scene1'
                      ? 'bg-vermilion text-white font-bold shadow-paper-sm'
                      : 'bg-paper-muted text-ink-secondary hover:text-ink-primary'
                  }`}
                >
                  Scene 1
                </button>
                <button
                  type="button"
                  onClick={() => setActiveScene('scene2')}
                  className={`px-2.5 py-1 rounded-lg font-mono text-[11px] transition-all ${
                    activeScene === 'scene2'
                      ? 'bg-vermilion text-white font-bold shadow-paper-sm'
                      : 'bg-paper-muted text-ink-secondary hover:text-ink-primary'
                  }`}
                >
                  Scene 2
                </button>
                <button
                  type="button"
                  onClick={() => setActiveScene('scene3')}
                  className={`px-2.5 py-1 rounded-lg font-mono text-[11px] transition-all ${
                    activeScene === 'scene3'
                      ? 'bg-vermilion text-white font-bold shadow-paper-sm'
                      : 'bg-paper-muted text-ink-secondary hover:text-ink-primary'
                  }`}
                >
                  Scene 3
                </button>
                <button
                  type="button"
                  onClick={() => setActiveScene('vector')}
                  className={`px-2.5 py-1 rounded-lg font-mono text-[11px] transition-all ${
                    activeScene === 'vector'
                      ? 'bg-vermilion text-white font-bold shadow-paper-sm'
                      : 'bg-paper-muted text-ink-secondary hover:text-ink-primary'
                  }`}
                >
                  Vector
                </button>
              </div>

              <span className="font-mono text-[10px] text-sage font-semibold flex items-center gap-1 flex-shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-sage animate-ping" />
                Live Video
              </span>
            </div>
          </Card>
        </div>
      </section>

      {/* ========================================================
          THREE EDITORIAL FEATURE CARDS
         ======================================================== */}
      <section className="space-y-6">
        <div className="border-b border-border-subtle pb-3 flex items-center justify-between">
          <h2 className="text-xl font-bold font-serif-tamil text-ink-primary">
            {isTa ? 'முக்கிய நரம்பியல் பிரிவுகள்' : 'Core Neural Systems'}
          </h2>
          <span className="text-xs text-ink-tertiary font-mono">01 — 03</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Live Recognition */}
          <Card
            interactive
            onClick={() => setActiveTab('recognize')}
            className="flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-vermilion-subtle text-vermilion flex items-center justify-center">
                <PenTool className="w-5 h-5" />
              </div>
              <Badge variant="vermilion">Sub-50ms TF.js &amp; ONNX</Badge>
              <h3 className="text-lg font-bold font-serif-tamil text-ink-primary">
                {isTa ? 'நேரடி கையெழுத்து அறிதல்' : 'Live In-Browser Recognition'}
              </h3>
              <p className="text-xs text-ink-secondary leading-relaxed">
                {isTa
                  ? 'உலாவியில் விரல் அல்லது பேனாவால் எழுதும்போது உடனுக்குடன் 95.16% துல்லியத்துடன் கண்டறிதல்.'
                  : 'Draw on the ruled canvas with pressure-aware ink to receive instant predictions with calibrated confidence and grapheme segmentation.'}
              </p>
            </div>
            <div className="pt-3 border-t border-border-subtle flex items-center text-xs font-semibold text-vermilion">
              <span>{isTa ? 'தொடங்க' : 'Launch Studio'}</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </div>
          </Card>

          {/* Card 2: Handwriting Synthesis */}
          <Card
            interactive
            onClick={() => setActiveTab('synthesis')}
            className="flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-gold-subtle text-gold flex items-center justify-center">
                <Edit3 className="w-5 h-5" />
              </div>
              <Badge variant="gold">LSTM-MDN Synthesis</Badge>
              <h3 className="text-lg font-bold font-serif-tamil text-ink-primary">
                {isTa ? 'கையெழுத்து உருவாக்கம்' : 'Neural Handwriting Synthesis'}
              </h3>
              <p className="text-xs text-ink-secondary leading-relaxed">
                {isTa
                  ? 'தட்டச்சு செய்த சொற்களை இயல்பான தமிழ் கையெழுத்து அசைவுகளாகவும் SVG கோடுகளாகவும் மாற்றுதல்.'
                  : 'Convert typed Tamil text into realistic continuous cursive handwriting rendered with animated SVG pressure strokes.'}
              </p>
            </div>
            <div className="pt-3 border-t border-border-subtle flex items-center text-xs font-semibold text-gold">
              <span>{isTa ? 'எழுதுக' : 'Write Sentences'}</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </div>
          </Card>

          {/* Card 3: Calligraphic Practice Coach */}
          <Card
            interactive
            onClick={() => setActiveTab('coach')}
            className="flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-sage-subtle text-sage flex items-center justify-center">
                <BookOpen className="w-5 h-5" />
              </div>
              <Badge variant="sage">Siamese Stroke Evaluator</Badge>
              <h3 className="text-lg font-bold font-serif-tamil text-ink-primary">
                {isTa ? 'கையெழுத்துப் பயிற்சி ஆசான்' : 'Calligraphy Practice Coach'}
              </h3>
              <p className="text-xs text-ink-secondary leading-relaxed">
                {isTa
                  ? 'கட்டமைப்பு வழிகாட்டி மீது எழுதி வடிவம், வளைவுகள் மற்றும் விகிதங்களை மதிப்பிடும் ஆசான்.'
                  : 'Trace animated ghost strokes to master classical proportions, receiving instant scores on loop closure, curvature, and stability.'}
              </p>
            </div>
            <div className="pt-3 border-t border-border-subtle flex items-center text-xs font-semibold text-sage">
              <span>{isTa ? 'பயில்க' : 'Start Practice'}</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </div>
          </Card>
        </div>
      </section>

      {/* ========================================================
          HOW IT WORKS STRIP
         ======================================================== */}
      <section className="p-6 rounded-2xl bg-paper-surface border border-border-subtle space-y-6">
        <div className="text-center max-w-md mx-auto space-y-1">
          <span className="text-xs font-mono uppercase tracking-wider text-ink-tertiary">
            System Pipeline
          </span>
          <h3 className="text-xl font-bold font-serif-tamil text-ink-primary">
            {isTa ? 'செயல்முறை எவ்வாறு இயங்குகிறது?' : 'How Epigraphic AI Works'}
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2">
          <div className="text-center space-y-2">
            <div className="w-8 h-8 rounded-full bg-paper-muted border border-border-strong text-ink-primary font-mono font-bold text-xs flex items-center justify-center mx-auto">
              1
            </div>
            <h4 className="font-bold text-sm text-ink-primary">
              {isTa ? 'கோடுகளை வரைதல்' : 'Continuous Stroke Capture'}
            </h4>
            <p className="text-xs text-ink-secondary leading-relaxed">
              Pressure-sensitive coordinates are sampled at 60 FPS onto the ruled calligraphy surface.
            </p>
          </div>

          <div className="text-center space-y-2">
            <div className="w-8 h-8 rounded-full bg-paper-muted border border-border-strong text-ink-primary font-mono font-bold text-xs flex items-center justify-center mx-auto">
              2
            </div>
            <h4 className="font-bold text-sm text-ink-primary">
              {isTa ? 'நரம்பியல் குறியாக்கம்' : 'Neural Feature Extraction'}
            </h4>
            <p className="text-xs text-ink-secondary leading-relaxed">
              ResNet-SE &amp; CRNN extract stroke topology, loops, and temporal sequences in &lt;20ms.
            </p>
          </div>

          <div className="text-center space-y-2">
            <div className="w-8 h-8 rounded-full bg-paper-muted border border-border-strong text-ink-primary font-mono font-bold text-xs flex items-center justify-center mx-auto">
              3
            </div>
            <h4 className="font-bold text-sm text-ink-primary">
              {isTa ? 'யுனிகோட் வெளியீடு' : 'Calibrated Unicode Decode'}
            </h4>
            <p className="text-xs text-ink-secondary leading-relaxed">
              Tamil grapheme clusters are decoded with calibrated sequence confidence and speech synthesis.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
