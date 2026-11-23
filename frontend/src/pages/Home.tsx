import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';
import {
  PenTool,
  Sparkles,
  Volume2,
  ArrowRight,
  BookOpen,
  MessageSquare,
  Trophy,
  CheckCircle2,
  HelpCircle,
  MessageCircle,
  Mail,
  GraduationCap,
  Layers,
  ChevronDown,
} from 'lucide-react';
import { speakTamil } from '../lib/speech';

export const Home: React.FC = () => {
  const { setActiveTab } = useAppStore();
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const previewVowels = [
    { ta: 'அ', say: 'a', word: 'அணில்', emoji: '🐿️' },
    { ta: 'ஆ', say: 'aa', word: 'ஆடு', emoji: '🐐' },
    { ta: 'இ', say: 'i', word: 'இலை', emoji: '🍃' },
    { ta: 'ஈ', say: 'ii', word: 'ஈட்டி', emoji: '🗡️' },
    { ta: 'உ', say: 'u', word: 'உரல்', emoji: '🥣' },
    { ta: 'ஊ', say: 'uu', word: 'ஊஞ்சல்', emoji: '🪑' },
  ];

  const faqs = [
    {
      q: 'How many letters are in the Tamil alphabet chart?',
      a: 'The Tamil alphabet has 247 letters in total: 12 Vowels (உயிர் எழுத்துக்கள்), 18 Consonants (மெய் எழுத்துக்கள்), 216 Vowel-Consonant combinations (உயிர்மெய் எழுத்துக்கள்), and 1 Special letter (ஆய்த எழுத்து: ஃ).',
    },
    {
      q: 'How does the interactive audio pronunciation work?',
      a: 'Each letter and phrase card uses the browser-native Web Speech API configured with Tamil (ta-IN) speech synthesis. Simply tap any letter or phrase to hear its authentic native pronunciation without needing heavy audio downloads.',
    },
    {
      q: 'How does the TamilScript AI handwriting recognition work?',
      a: 'Our AI engine uses a custom Squeeze-and-Excitation ResNet trained on real handwritten datasets with 96.4% accuracy. It runs client-side in your browser using ONNX Runtime / TensorFlow.js with sub-50ms latency.',
    },
    {
      q: 'Is this platform free to use?',
      a: 'Yes! The complete 247 letters chart, sound pronunciations, interactive letter games, conversational phrasebook, and neural AI handwriting recognition are 100% free and open for all learners.',
    },
  ];

  return (
    <div className="space-y-20 py-6 max-w-6xl mx-auto px-4 select-none">
      {/* ========================================================
          1. HERO SECTION
         ======================================================== */}
      <section className="text-center space-y-6 pt-4 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-vermilion/10 text-vermilion border border-vermilion/20 text-xs font-semibold">
          <Sparkles className="w-4 h-4" />
          <span>Interactive 247 Letters Chart · Native Audio · Neural AI Studio</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold text-ink-primary font-serif-tamil tracking-tight leading-[1.15]">
          Tamil Alphabet Chart, Sounds &amp; AI Writing Studio
        </h1>

        <p className="text-base sm:text-xl text-ink-secondary leading-relaxed font-sans max-w-2xl mx-auto">
          Explore all 247 letters with instant speech audio, master secondary vowel signs, play interactive letter games, and practice writing with real-time deep learning feedback.
        </p>

        {/* Quick Badges */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
          {['12 Vowels (உயிர்)', '18 Consonants (மெய்)', '216 Syllables (உயிர்மெய்)', 'Web Speech (ta-IN)', '96.4% Neural AI'].map((b, i) => (
            <span key={i} className="px-3 py-1 rounded-full bg-paper-surface border border-border-subtle text-xs font-medium text-ink-secondary">
              {b}
            </span>
          ))}
        </div>

        {/* Action CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
          <button
            onClick={() => setActiveTab('chart')}
            className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-vermilion hover:bg-vermilion-hover text-white text-sm font-semibold shadow-lg shadow-vermilion/25 transition-all hover:scale-105 active:scale-95"
          >
            <BookOpen className="w-4 h-4" />
            <span>Explore 247 Letters Chart</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => setActiveTab('games')}
            className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-paper-surface hover:bg-paper-muted text-ink-primary border border-border-subtle text-sm font-semibold shadow-sm transition-all hover:scale-105 active:scale-95"
          >
            <Trophy className="w-4 h-4 text-gold" />
            <span>Play Letter Games</span>
          </button>

          <button
            onClick={() => setActiveTab('recognize')}
            className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-paper-surface hover:bg-paper-muted text-ink-primary border border-border-subtle text-sm font-semibold shadow-sm transition-all hover:scale-105 active:scale-95"
          >
            <PenTool className="w-4 h-4 text-vermilion" />
            <span>AI Handwriting Studio</span>
          </button>
        </div>
      </section>

      {/* ========================================================
          2. THE LETTER CHART PREVIEW SECTION
         ======================================================== */}
      <section className="space-y-6 p-6 sm:p-10 rounded-3xl bg-paper-surface border border-border-subtle shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-subtle pb-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-vermilion uppercase tracking-wider">
              <Layers className="w-3.5 h-3.5" />
              <span>The Letter Chart · தமிழ் நெடுங்கணக்கு</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold font-serif-tamil text-ink-primary">
              All 247 Tamil Letters with Sounds
            </h2>
            <p className="text-xs sm:text-sm text-ink-secondary">
              Tap any letter card to hear native pronunciation.
            </p>
          </div>

          <button
            onClick={() => setActiveTab('chart')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-vermilion/10 hover:bg-vermilion/20 text-vermilion text-xs font-bold transition-all"
          >
            <span>View Full 247 Grid</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Sample Letters preview */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {previewVowels.map((v, i) => (
            <div
              key={i}
              onClick={() => speakTamil(v.ta)}
              className="p-4 rounded-2xl bg-paper-muted border border-border-subtle hover:border-vermilion/50 hover:shadow-md transition-all cursor-pointer group text-center flex flex-col items-center justify-between min-h-[130px]"
            >
              <div className="w-full flex items-center justify-between text-ink-tertiary text-xs">
                <span className="font-mono">{v.say}</span>
                <Volume2 className="w-3.5 h-3.5 group-hover:text-vermilion" />
              </div>
              <div className="text-4xl font-extrabold font-serif-tamil text-ink-primary my-1 group-hover:scale-110 transition-transform">
                {v.ta}
              </div>
              <p className="text-xs font-semibold text-ink-secondary">{v.word} {v.emoji}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================
          3. HOW LETTERS JOIN (SIGN RULES)
         ======================================================== */}
      <section className="space-y-6">
        <div className="text-center space-y-2 max-w-xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-extrabold font-serif-tamil text-ink-primary">
            How Letters Join (எழுத்துக்கள் இணையும் முறை)
          </h2>
          <p className="text-xs sm:text-sm text-ink-secondary">
            When a pure consonant (மெய்) joins a vowel (உயிர்), it sheds its dot and takes a vowel sign to create an Uyirmei syllable.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { sign: 'No sign (Base)', vowel: 'அ (a)', math: 'க் + அ = க', desc: 'Pulli dot vanishes' },
            { sign: 'Kaal sign (ா)', vowel: 'ஆ (aa)', math: 'க் + ஆ = கா', desc: 'Adds vertical leg kaal' },
            { sign: 'Curl on top (ி)', vowel: 'இ (i)', math: 'க் + இ = கி', desc: 'Adds top hook curl' },
            { sign: 'Kombu in front (ெ)', vowel: 'எ (e)', math: 'க் + எ = கெ', desc: 'Adds front loop kombu' },
          ].map((item, idx) => (
            <div key={idx} className="p-4 rounded-2xl bg-paper-surface border border-border-subtle shadow-sm space-y-2">
              <span className="text-[11px] font-bold text-vermilion uppercase">{item.sign}</span>
              <div className="text-xl font-extrabold font-serif-tamil text-ink-primary">
                {item.math}
              </div>
              <p className="text-xs text-ink-tertiary">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================
          4. INTERACTIVE MODULES: SPEAK, GAMES, WRITE
         ======================================================== */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Module 1: Speak Everyday Tamil */}
        <div
          onClick={() => setActiveTab('speak')}
          className="p-6 rounded-3xl bg-paper-surface border border-border-subtle hover:border-vermilion/50 hover:shadow-lg transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold font-serif-tamil text-ink-primary group-hover:text-vermilion transition-colors">
              Speak Spoken Tamil
            </h3>
            <p className="text-xs text-ink-secondary leading-relaxed">
              Everyday greetings (வணக்கம்), essential travel phrases, family words, and conversational sentences with instant native audio playback.
            </p>
          </div>
          <div className="pt-4 flex items-center gap-1.5 text-xs font-bold text-vermilion">
            <span>Learn Phrases</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Module 2: Letter Games */}
        <div
          onClick={() => setActiveTab('games')}
          className="p-6 rounded-3xl bg-paper-surface border border-border-subtle hover:border-vermilion/50 hover:shadow-lg transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <Trophy className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold font-serif-tamil text-ink-primary group-hover:text-vermilion transition-colors">
              Letter Games &amp; Quizzes
            </h3>
            <p className="text-xs text-ink-secondary leading-relaxed">
              Listen to the sound and tap the matching letter, solve letter combination equations, maintain your streak, and earn XP.
            </p>
          </div>
          <div className="pt-4 flex items-center gap-1.5 text-xs font-bold text-vermilion">
            <span>Play Games</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Module 3: Trace & Write Canvas */}
        <div
          onClick={() => setActiveTab('coach')}
          className="p-6 rounded-3xl bg-paper-surface border border-border-subtle hover:border-vermilion/50 hover:shadow-lg transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <PenTool className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold font-serif-tamil text-ink-primary group-hover:text-vermilion transition-colors">
              ✏️ Trace &amp; Write Coach
            </h3>
            <p className="text-xs text-ink-secondary leading-relaxed">
              Guided stroke tracing with ghost lines, instant Siamese neural quality scoring, proportions feedback, and curve evaluation.
            </p>
          </div>
          <div className="pt-4 flex items-center gap-1.5 text-xs font-bold text-vermilion">
            <span>Practice Writing</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </section>

      {/* ========================================================
          5. TAMILSCRIPT AI STUDIO SUITE
         ======================================================== */}
      <section className="space-y-6 p-6 sm:p-10 rounded-3xl bg-paper-surface border border-border-subtle shadow-sm">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 text-xs font-bold text-vermilion uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Deep Learning Suite · நரம்பியல் ஆய்வகம்</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-serif-tamil text-ink-primary">
            TamilScript AI Deep Learning Suite
          </h2>
          <p className="text-xs sm:text-sm text-ink-secondary">
            Advanced neural networks powering real-time epigraphic inference, stroke generation, and document OCR.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              tab: 'recognize',
              title: 'Character Recognition',
              sub: '96.4% Acc · Sub-50ms SE-ResNet',
              desc: 'Draw any letter on canvas for instantaneous deep learning recognition and Grad-CAM saliency heatmaps.',
            },
            {
              tab: 'generate',
              title: 'Neural Glyph Generator',
              sub: 'Conditional VAE / Generator',
              desc: 'Synthesize novel calligraphic letter variations conditioned on latent seeds, pressure, and slant.',
            },
            {
              tab: 'synthesis',
              title: 'Text-to-Handwriting',
              sub: 'MDN Stroke Trajectories',
              desc: 'Type any Tamil text and watch realistic handwriting render with cubic Bezier curves in real time.',
            },
            {
              tab: 'scanner',
              title: 'Manuscript Page OCR',
              sub: 'Multi-line Neural Segmentation',
              desc: 'Upload palm-leaf scans or handwritten document photographs for automatic line segmentation and text extraction.',
            },
          ].map((feat, idx) => (
            <div
              key={idx}
              onClick={() => setActiveTab(feat.tab)}
              className="p-5 rounded-2xl bg-paper-muted border border-border-subtle hover:border-vermilion/50 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div className="space-y-2">
                <span className="text-[10px] font-mono font-bold text-vermilion">{feat.sub}</span>
                <h4 className="font-bold text-sm text-ink-primary group-hover:text-vermilion transition-colors font-serif-tamil">
                  {feat.title}
                </h4>
                <p className="text-xs text-ink-tertiary leading-relaxed">{feat.desc}</p>
              </div>
              <div className="pt-3 flex items-center gap-1 text-[11px] font-semibold text-vermilion">
                <span>Open Tool</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================
          6. COURSE CARDS
         ======================================================== */}
      <section className="space-y-6">
        <div className="text-center space-y-2 max-w-xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-extrabold font-serif-tamil text-ink-primary">
            Curated Learning Paths (பாடப்பிரிவுகள்)
          </h2>
          <p className="text-xs sm:text-sm text-ink-secondary">
            Structured modules designed for beginners, children, diaspora learners, and calligraphy enthusiasts.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              title: 'Simple Spoken Tamil',
              badge: 'Beginner',
              desc: 'Master daily spoken conversations, listening comprehension, polite expressions, and everyday sentence construction.',
              features: ['Native speech audio', '100+ daily phrases', 'Practical dialogues'],
            },
            {
              title: 'Tamil Reading & Writing',
              badge: 'Comprehensive',
              desc: 'Learn to read and write all 247 letters, master the 7 vowel sign rules, and compose words effortlessly.',
              features: ['Complete 247 chart', 'Interactive tracing', 'Syllable math equations'],
            },
            {
              title: 'Classical Epigraphy & AI',
              badge: 'Advanced',
              desc: 'Explore ancient Tamil Brahmi and Vatteluttu script traditions paired with modern neural handwriting models.',
              features: ['Palm-leaf OCR', 'Deep learning coaching', 'Calligraphy synthesis'],
            },
          ].map((course, idx) => (
            <div key={idx} className="p-6 rounded-3xl bg-paper-surface border border-border-subtle shadow-sm space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <span className="px-2.5 py-1 rounded-full bg-vermilion/10 text-vermilion text-[10px] font-bold uppercase">
                  {course.badge}
                </span>
                <h3 className="text-lg font-bold font-serif-tamil text-ink-primary">
                  {course.title}
                </h3>
                <p className="text-xs text-ink-secondary leading-relaxed">{course.desc}</p>
                <ul className="space-y-1.5 pt-2">
                  {course.features.map((f, fi) => (
                    <li key={fi} className="flex items-center gap-2 text-xs text-ink-tertiary">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => setActiveTab('chart')}
                className="w-full py-2.5 rounded-xl bg-paper-muted hover:bg-vermilion hover:text-white text-ink-primary text-xs font-semibold border border-border-subtle transition-all"
              >
                Start Learning
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================
          7. FAQ ACCORDION
         ======================================================== */}
      <section className="space-y-6 max-w-3xl mx-auto">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold font-serif-tamil text-ink-primary">
            Frequently Asked Questions
          </h2>
          <p className="text-xs sm:text-sm text-ink-secondary">
            Everything you need to know about learning Tamil and using TamilScript AI.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl bg-paper-surface border border-border-subtle overflow-hidden transition-all"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 font-semibold text-sm text-ink-primary hover:text-vermilion transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-ink-tertiary transition-transform duration-200 ${isOpen ? 'rotate-180 text-vermilion' : ''}`} />
                </button>
                {isOpen && (
                  <div className="px-5 pb-4 text-xs sm:text-sm text-ink-secondary leading-relaxed border-t border-border-subtle/50 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ========================================================
          8. CONTACT & REACH YOUR GOALS SECTION
         ======================================================== */}
      <section className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-paper-surface via-paper-surface to-vermilion/5 border border-border-subtle shadow-md text-center space-y-6">
        <div className="space-y-2 max-w-xl mx-auto">
          <h2 className="text-2xl sm:text-4xl font-extrabold font-serif-tamil text-ink-primary">
            Let’s Reach Your Goals Together
          </h2>
          <p className="text-xs sm:text-sm text-ink-secondary">
            Have questions about learning Tamil or need custom assistance? Reach out to us directly on WhatsApp or email.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <a
            href="https://wa.me/919035394805?text=Hello%20TamilScript%20AI%20Team!%20I%20would%20like%20to%20learn%20Tamil."
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold shadow-md transition-all hover:scale-105 active:scale-95"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Chat on WhatsApp (+91 90353 94805)</span>
          </a>

          <a
            href="mailto:support@tamilscript.ai"
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-paper-surface hover:bg-paper-muted text-ink-primary border border-border-subtle text-xs sm:text-sm font-semibold shadow-sm transition-all hover:scale-105 active:scale-95"
          >
            <Mail className="w-4 h-4 text-vermilion" />
            <span>support@tamilscript.ai</span>
          </a>
        </div>
      </section>

      {/* ========================================================
          9. FOOTER
         ======================================================== */}
      <footer className="border-t border-border-subtle pt-10 pb-6 text-xs text-ink-tertiary space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-ink-primary font-bold text-sm">
              <div className="w-6 h-6 rounded-lg bg-vermilion text-white flex items-center justify-center font-serif-tamil text-sm">
                அ
              </div>
              <span>TamilScript AI</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Classical Tamil Epigraphy Meets Real-Time Neural Intelligence. Master reading, speaking, and writing with interactive deep learning.
            </p>
          </div>

          <div className="space-y-2">
            <span className="font-bold text-ink-secondary uppercase text-[10px] tracking-wider">Learning Modules</span>
            <ul className="space-y-1">
              <li><button onClick={() => setActiveTab('chart')} className="hover:text-vermilion">247 Alphabet Chart</button></li>
              <li><button onClick={() => setActiveTab('speak')} className="hover:text-vermilion">Spoken Phrases</button></li>
              <li><button onClick={() => setActiveTab('games')} className="hover:text-vermilion">Letter Games</button></li>
              <li><button onClick={() => setActiveTab('coach')} className="hover:text-vermilion">Writing Coach</button></li>
            </ul>
          </div>

          <div className="space-y-2">
            <span className="font-bold text-ink-secondary uppercase text-[10px] tracking-wider">AI Studio</span>
            <ul className="space-y-1">
              <li><button onClick={() => setActiveTab('recognize')} className="hover:text-vermilion">Character Recognition</button></li>
              <li><button onClick={() => setActiveTab('generate')} className="hover:text-vermilion">Glyph Generator</button></li>
              <li><button onClick={() => setActiveTab('synthesis')} className="hover:text-vermilion">Handwriting Synthesis</button></li>
              <li><button onClick={() => setActiveTab('scanner')} className="hover:text-vermilion">Manuscript Scanner</button></li>
            </ul>
          </div>

          <div className="space-y-2">
            <span className="font-bold text-ink-secondary uppercase text-[10px] tracking-wider">Contact &amp; Support</span>
            <p className="text-[11px]">Bangalore, Karnataka, India</p>
            <p className="text-[11px]">WhatsApp: +91 90353 94805</p>
            <p className="text-[11px]">Email: support@tamilscript.ai</p>
          </div>
        </div>

        <div className="border-t border-border-subtle/50 pt-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px]">
          <span>© 2026 TamilScript AI. All rights reserved.</span>
          <span>Designed with pure deep learning and accessible client-side speech synthesis.</span>
        </div>
      </footer>
    </div>
  );
};
