import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';
import {
  Volume2,
  Search,
  Sparkles,
  PenTool,
  BookOpen,
  Layers,
  Check,
  ArrowRight,
  ArrowLeft,
  X,
  Play,
  Calculator,
  Star,
  CheckCircle2,
} from 'lucide-react';
import { speakTamil } from '../lib/speech';
import { LetterTracingCanvas } from '../components/LetterTracingCanvas';

interface Vowel {
  id: string;
  ta: string;
  say: string;
  length?: string;
  word?: string;
  wordSay?: string;
  en?: string;
  emoji?: string;
  sound?: string | null;
}

interface Consonant {
  id: string;
  mei: string;
  ta: string;
  say: string;
  family: 'hard' | 'soft' | 'middle';
  word?: string;
  wordSay?: string;
  en?: string;
  emoji?: string;
}

interface Uyirmei {
  id: string;
  ta: string;
  say: string;
  c: number;
  v: number;
}

interface AlphabetData {
  vowels: Vowel[];
  aaytham: Vowel;
  consonants: Consonant[];
  grid: Uyirmei[][];
  grantha?: Vowel[];
}

interface SelectedLetterItem {
  ta: string;
  say: string;
  category: string;
  family?: string;
  word?: string;
  wordSay?: string;
  en?: string;
  emoji?: string;
  index?: number;
}

export const LettersChartPage: React.FC = () => {
  const { setActiveTab } = useAppStore();
  const [data, setData] = useState<AlphabetData | null>(null);
  const [activeTab, setActiveFilter] = useState<'all' | 'vowels' | 'consonants' | 'grid' | 'builder' | 'signs'>('all');
  const [consonantFamily, setConsonantFamily] = useState<'all' | 'hard' | 'soft' | 'middle'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [playingId, setPlayingId] = useState<string | null>(null);

  // Selected letter for Modal & Quick Action
  const [modalLetter, setModalLetter] = useState<SelectedLetterItem | null>(null);
  const [tracingLetter, setTracingLetter] = useState<SelectedLetterItem | null>(null);

  // Persistent tracked letters from localStorage
  const [tracedLetters, setTracedLetters] = useState<string[]>([]);

  // Interactive Syllable Combiner State
  const [builderConsonantIdx, setBuilderConsonantIdx] = useState<number>(0);
  const [builderVowelIdx, setBuilderVowelIdx] = useState<number>(0);

  useEffect(() => {
    fetch('/tamil_alphabet_data.json')
      .then((res) => res.json())
      .then((json: AlphabetData) => {
        setData(json);
      })
      .catch((err) => console.error('Failed to load alphabet data:', err));

    try {
      const stored = JSON.parse(localStorage.getItem('ilt-letters-traced') || '[]');
      if (Array.isArray(stored)) {
        setTracedLetters(stored);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handlePlaySound = (text: string, id: string) => {
    setPlayingId(id);
    speakTamil(text).finally(() => setPlayingId(null));
  };

  const handleLetterTraced = (char: string) => {
    setTracedLetters((prev) => (prev.includes(char) ? prev : [...prev, char]));
  };

  // Flattened letters list for Next / Prev navigation
  const allFlattenedLetters = useMemo<SelectedLetterItem[]>(() => {
    if (!data) return [];
    const list: SelectedLetterItem[] = [];

    // Vowels
    data.vowels.forEach((v) =>
      list.push({
        ta: v.ta,
        say: v.say,
        category: 'உயிர் (Vowel)',
        word: v.word,
        wordSay: v.wordSay,
        en: v.en,
        emoji: v.emoji,
      })
    );

    // Ayutham
    if (data.aaytham) {
      list.push({
        ta: data.aaytham.ta,
        say: data.aaytham.say,
        category: 'ஆய்தம் (Special)',
        word: data.aaytham.word,
        wordSay: data.aaytham.wordSay,
        en: data.aaytham.en,
        emoji: data.aaytham.emoji,
      });
    }

    // Consonants
    data.consonants.forEach((c) =>
      list.push({
        ta: c.mei,
        say: c.say,
        category: `மெய் (Consonant) · ${c.family === 'hard' ? 'வல்லினம்' : c.family === 'soft' ? 'மெல்லினம்' : 'இடையினம்'}`,
        family: c.family,
        word: c.word,
        wordSay: c.wordSay,
        en: c.en,
        emoji: c.emoji,
      })
    );

    // Combinations Grid
    data.consonants.forEach((c, rIdx) => {
      data.grid[rIdx]?.forEach((cell, cIdx) => {
        const v = data.vowels[cIdx];
        list.push({
          ta: cell.ta,
          say: cell.say,
          category: `உயிர்மெய் (${c.mei} + ${v?.ta})`,
          word: `${cell.ta}...`,
          en: `Compound syllable ${cell.say}`,
        });
      });
    });

    return list;
  }, [data]);

  // Navigate Modal Next / Previous
  const handleNextModalLetter = () => {
    if (!modalLetter || allFlattenedLetters.length === 0) return;
    const currentIdx = allFlattenedLetters.findIndex((l) => l.ta === modalLetter.ta);
    const nextIdx = (currentIdx + 1) % allFlattenedLetters.length;
    setModalLetter(allFlattenedLetters[nextIdx]);
    handlePlaySound(allFlattenedLetters[nextIdx].ta, 'modal-nav');
  };

  const handlePrevModalLetter = () => {
    if (!modalLetter || allFlattenedLetters.length === 0) return;
    const currentIdx = allFlattenedLetters.findIndex((l) => l.ta === modalLetter.ta);
    const prevIdx = (currentIdx - 1 + allFlattenedLetters.length) % allFlattenedLetters.length;
    setModalLetter(allFlattenedLetters[prevIdx]);
    handlePlaySound(allFlattenedLetters[prevIdx].ta, 'modal-nav');
  };

  // Sign markers and rules
  const signGuides = [
    { title: 'No sign (அகரம்)', vowel: 'அ (a)', example: 'க் + அ = க', note: 'The pulli (dot) is removed, revealing the pure base consonant.' },
    { title: 'Kaal sign after (துணைக்கால் ா)', vowel: 'ஆ (aa)', example: 'க் + ஆ = கா', note: 'Appends the vertical curve kaal (ா) to the right.' },
    { title: 'Top curl (மேல் விலங்கு ி)', vowel: 'இ (i)', example: 'க் + இ = கி', note: 'Adds a rightward curl over the head of the letter.' },
    { title: 'Top looped curl (மேல் விலங்கு சுழி ீ)', vowel: 'ஈ (ii)', example: 'க் + ஈ = கீ', note: 'Adds a closed loop curl over the head of the letter.' },
    { title: 'Bottom curve / loop (கீழ் விலங்கு ு)', vowel: 'உ (u)', example: 'க் + உ = கு', note: 'Adds a curve, loop, or tail descending from the bottom.' },
    { title: 'Bottom double loop (கீழ் விலங்கு சுழி ூ)', vowel: 'ஊ (uu)', example: 'க் + ஊ = கூ', note: 'Adds a double-looped flourish or secondary stroke beneath.' },
    { title: 'Single kombu before (ஒற்றைக் கொம்பு ெ)', vowel: 'எ (e)', example: 'க் + எ = கெ', note: 'Placed strictly before the consonant.' },
    { title: 'Double kombu before (இரட்டைக் கொம்பு ே)', vowel: 'ஏ (ee)', example: 'க் + ஏ = கே', note: 'Placed strictly before the consonant with a loop.' },
    { title: 'Twin kombu (இணைக்கொம்பு ை)', vowel: 'ஐ (ai)', example: 'க் + ஐ = கை', note: 'A curly twin marker placed directly in front of the consonant.' },
    { title: 'Surrounding kombu + kaal (ஒட்டைக் கொம்பு & கால் ொ)', vowel: 'ஒ (o)', example: 'க் + ஒ = கொ', note: 'The consonant sits between front kombu (ெ) and trailing kaal (ா).' },
    { title: 'Surrounding looped kombu + kaal (இரட்டைக் கொம்பு & கால் ோ)', vowel: 'ஓ (oo)', example: 'க் + ஓ = கோ', note: 'The consonant sits between looped kombu (ே) and trailing kaal (ா).' },
    { title: 'Kombu + Kombu-la (கொம்பு & கொம்புள ௌ)', vowel: 'ஔ (au)', example: 'க் + ஔ = கௌ', note: 'The consonant sits between front kombu (ெ) and trailing la (ள).' },
  ];

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-vermilion border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-ink-secondary">Loading 247 Tamil Alphabets Chart...</p>
        </div>
      </div>
    );
  }

  // Builder calculation
  const currentBuilderConsonant = data.consonants[builderConsonantIdx];
  const currentBuilderVowel = data.vowels[builderVowelIdx];
  const currentBuilderResult = data.grid[builderConsonantIdx]?.[builderVowelIdx];
  const currentBuilderSign = signGuides[builderVowelIdx];

  return (
    <div className="space-y-10 py-6 max-w-6xl mx-auto px-4 select-none">
      {/* Title & Overview Banner */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-vermilion/10 text-vermilion border border-vermilion/20 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Complete 247 Letters Chart · தமிழ் நெடுங்கணக்கு</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-ink-primary font-serif-tamil tracking-tight">
          Tamil Alphabet Chart
        </h1>
        <p className="text-sm sm:text-base text-ink-secondary">
          Explore all 247 letters — 12 Vowels (உயிர்), 18 Consonants (மெய்), 216 Combinations (உயிர்மெய்), and 1 Special (ஆய்தம்). Tap any card to hear its sound or open the interactive letter explorer and tracing canvas!
        </p>

        {/* Search Bar */}
        <div className="relative max-w-md mx-auto pt-2">
          <Search className="w-4 h-4 text-ink-tertiary absolute left-3.5 top-5" />
          <input
            type="text"
            placeholder="Search letter or sound (e.g. 'a', 'ka', 'க்', 'அ')..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-paper-surface border border-border-subtle focus:border-vermilion focus:outline-none text-sm text-ink-primary shadow-sm"
          />
        </div>

        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2 text-xs text-ink-secondary pt-1">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span>
            You have traced and mastered <strong>{tracedLetters.length}</strong> of 247 letters
          </span>
        </div>
      </div>

      {/* Main Filter Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-center gap-2 border-b border-border-subtle pb-4">
        {[
          { id: 'all', label: 'All 247 Letters' },
          { id: 'vowels', label: 'Vowels · உயிர் (12)' },
          { id: 'consonants', label: 'Consonants · மெய் (18)' },
          { id: 'grid', label: 'Combinations Grid (216)' },
          { id: 'builder', label: '⚡ Syllable Builder' },
          { id: 'signs', label: 'How Letters Join' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id as any)}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === tab.id
                ? 'bg-vermilion text-white shadow-md shadow-vermilion/20 scale-105'
                : 'bg-paper-surface text-ink-secondary hover:text-ink-primary hover:bg-paper-muted border border-border-subtle'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* INTERACTIVE SYLLABLE BUILDER (NEW) */}
      {(activeTab === 'all' || activeTab === 'builder') && (
        <section className="p-6 rounded-3xl bg-gradient-to-br from-paper-surface via-paper-muted to-paper-surface border border-border-subtle shadow-md space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border-subtle pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-vermilion/10 text-vermilion">
                <Calculator className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold font-serif-tamil text-ink-primary">
                  Interactive Syllable Builder (உயிர்மெய் கால்குலேட்டர்)
                </h2>
                <p className="text-xs text-ink-secondary">
                  Choose any consonant and vowel to witness how they combine into a syllable with its vowel sign
                </p>
              </div>
            </div>

            <button
              onClick={() => handlePlaySound(`${currentBuilderConsonant.mei} கூட்டல் ${currentBuilderVowel.ta} சமம் ${currentBuilderResult?.ta}`, 'builder-math')}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-vermilion hover:bg-vermilion-hover text-white text-xs font-semibold shadow-sm transition-all"
            >
              <Volume2 className="w-4 h-4" />
              <span>Hear Formula</span>
            </button>
          </div>

          {/* Equation Display Box */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 py-6 bg-paper-surface rounded-2xl border border-border-subtle shadow-inner">
            <div className="flex flex-col items-center">
              <span className="text-xs text-ink-tertiary mb-1 font-mono">Consonant</span>
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-blue-500/10 border-2 border-blue-500/30 flex items-center justify-center text-3xl sm:text-4xl font-extrabold font-serif-tamil text-blue-600 shadow-sm">
                {currentBuilderConsonant.mei}
              </div>
              <span className="text-xs text-ink-secondary mt-1 font-mono">{currentBuilderConsonant.say}</span>
            </div>

            <span className="text-2xl sm:text-3xl font-extrabold text-ink-tertiary">+</span>

            <div className="flex flex-col items-center">
              <span className="text-xs text-ink-tertiary mb-1 font-mono">Vowel</span>
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-orange-500/10 border-2 border-orange-500/30 flex items-center justify-center text-3xl sm:text-4xl font-extrabold font-serif-tamil text-orange-600 shadow-sm">
                {currentBuilderVowel.ta}
              </div>
              <span className="text-xs text-ink-secondary mt-1 font-mono">{currentBuilderVowel.say}</span>
            </div>

            <span className="text-2xl sm:text-3xl font-extrabold text-ink-tertiary">=</span>

            <div className="flex flex-col items-center">
              <span className="text-xs text-ink-tertiary mb-1 font-mono">Combined Syllable</span>
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-vermilion text-white border-2 border-vermilion flex items-center justify-center text-4xl sm:text-5xl font-extrabold font-serif-tamil shadow-lg shadow-vermilion/30 animate-pulse">
                {currentBuilderResult?.ta}
              </div>
              <span className="text-xs text-ink-primary font-bold mt-1 font-mono">{currentBuilderResult?.say}</span>
            </div>
          </div>

          {/* Rule Note */}
          {currentBuilderSign && (
            <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-center">
              <span className="text-xs font-bold text-purple-700">{currentBuilderSign.title}: </span>
              <span className="text-xs text-ink-secondary">{currentBuilderSign.note}</span>
            </div>
          )}

          {/* Consonants Slider */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-ink-primary flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              1. Select Consonant (மெய்):
            </span>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
              {data.consonants.map((c, idx) => (
                <button
                  key={c.id}
                  onClick={() => {
                    setBuilderConsonantIdx(idx);
                    handlePlaySound(c.mei, `builder-c-${c.id}`);
                  }}
                  className={`px-3 py-2 rounded-xl font-serif-tamil text-base font-bold transition-all shrink-0 ${
                    builderConsonantIdx === idx
                      ? 'bg-blue-600 text-white shadow-md scale-105'
                      : 'bg-paper-surface hover:bg-paper-muted border border-border-subtle text-ink-primary'
                  }`}
                >
                  {c.mei}
                </button>
              ))}
            </div>
          </div>

          {/* Vowels Slider */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-ink-primary flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
              2. Select Vowel (உயிர்):
            </span>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
              {data.vowels.map((v, idx) => (
                <button
                  key={v.id}
                  onClick={() => {
                    setBuilderVowelIdx(idx);
                    handlePlaySound(v.ta, `builder-v-${v.id}`);
                  }}
                  className={`px-3 py-2 rounded-xl font-serif-tamil text-base font-bold transition-all shrink-0 ${
                    builderVowelIdx === idx
                      ? 'bg-orange-600 text-white shadow-md scale-105'
                      : 'bg-paper-surface hover:bg-paper-muted border border-border-subtle text-ink-primary'
                  }`}
                >
                  {v.ta}
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 1. VOWELS SECTION */}
      {(activeTab === 'all' || activeTab === 'vowels') && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-bold font-serif-tamil text-ink-primary flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-orange-500" />
              உயிர் எழுத்துக்கள் (12 Vowels)
            </h2>
            <span className="text-xs text-ink-tertiary font-mono">12 Letters · குறில் &amp; நெடில்</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {data.vowels.map((v) => {
              const isTraced = tracedLetters.includes(v.ta);
              return (
                <div
                  key={v.id}
                  onClick={() => {
                    setModalLetter({
                      ta: v.ta,
                      say: v.say,
                      category: 'உயிர் (Vowel)',
                      word: v.word,
                      wordSay: v.wordSay,
                      en: v.en,
                      emoji: v.emoji,
                    });
                    handlePlaySound(v.ta, v.id);
                  }}
                  className={`p-4 rounded-2xl bg-paper-surface border transition-all cursor-pointer group hover:shadow-md hover:border-vermilion/50 flex flex-col items-center justify-between min-h-[140px] relative overflow-hidden ${
                    modalLetter?.ta === v.ta ? 'border-vermilion ring-2 ring-vermilion/20' : 'border-border-subtle'
                  }`}
                >
                  {isTraced && (
                    <div className="absolute top-2 left-2 text-emerald-500" title="Traced and mastered">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}

                  <div className="w-full flex items-center justify-end text-ink-tertiary text-xs">
                    <span className="font-mono text-[11px] mr-auto pl-4">{v.say}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlaySound(v.ta, v.id);
                      }}
                      className="p-1 rounded-full hover:bg-paper-muted text-ink-secondary group-hover:text-vermilion"
                      aria-label={`Listen to ${v.ta}`}
                    >
                      <Volume2 className={`w-3.5 h-3.5 ${playingId === v.id ? 'animate-pulse text-vermilion' : ''}`} />
                    </button>
                  </div>

                  <div className="text-4xl font-extrabold font-serif-tamil text-ink-primary my-1 group-hover:scale-110 transition-transform">
                    {v.ta}
                  </div>

                  <div className="text-center">
                    <p className="text-xs font-semibold text-ink-secondary">{v.word} {v.emoji}</p>
                    <p className="text-[10px] text-ink-tertiary">{v.en}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 2. AYUTHAM SPECIAL */}
      {(activeTab === 'all' || activeTab === 'vowels') && data.aaytham && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              onClick={() => {
                setModalLetter({
                  ta: data.aaytham.ta,
                  say: data.aaytham.say,
                  category: 'ஆய்தம் (Special Letter)',
                  word: data.aaytham.word,
                  wordSay: data.aaytham.wordSay,
                  en: data.aaytham.en,
                  emoji: data.aaytham.emoji,
                });
                handlePlaySound(data.aaytham.ta, 'aaytham');
              }}
              className="text-3xl font-extrabold font-serif-tamil text-amber-600 bg-paper-surface px-4 py-2 rounded-xl shadow-sm border border-amber-500/30 cursor-pointer hover:scale-105 transition-transform"
            >
              {data.aaytham.ta}
            </div>
            <div>
              <h3 className="font-bold text-sm text-ink-primary">ஆய்த எழுத்து (Aaytha Ezhuthu)</h3>
              <p className="text-xs text-ink-secondary">Special letter · Pronounced as 'akku' / 'aq'. Example: {data.aaytham.word} ({data.aaytham.en})</p>
            </div>
          </div>
          <button
            onClick={() => handlePlaySound(data.aaytham.ta, 'aaytham')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-paper-surface border border-border-subtle hover:border-amber-500 text-xs font-semibold text-ink-primary shadow-sm"
          >
            <Volume2 className="w-3.5 h-3.5 text-amber-500" />
            <span>Listen</span>
          </button>
        </div>
      )}

      {/* 3. CONSONANTS SECTION */}
      {(activeTab === 'all' || activeTab === 'consonants') && (
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold font-serif-tamil text-ink-primary flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-500" />
                மெய் எழுத்துக்கள் (18 Consonants)
              </h2>
              <p className="text-xs text-ink-tertiary">Grouped into 3 phonetic families</p>
            </div>

            {/* Consonant sub-filter */}
            <div className="flex items-center gap-1.5 bg-paper-surface p-1 rounded-xl border border-border-subtle text-xs">
              {[
                { id: 'all', label: 'All 18' },
                { id: 'hard', label: 'வல்லினம் (Hard)' },
                { id: 'soft', label: 'மெல்லினம் (Soft)' },
                { id: 'middle', label: 'இடையினம் (Medial)' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setConsonantFamily(f.id as any)}
                  className={`px-2.5 py-1 rounded-lg transition-colors font-medium ${
                    consonantFamily === f.id ? 'bg-vermilion text-white' : 'text-ink-secondary hover:text-ink-primary'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {data.consonants
              .filter((c) => consonantFamily === 'all' || c.family === consonantFamily)
              .map((c) => {
                const isTraced = tracedLetters.includes(c.mei);
                return (
                  <div
                    key={c.id}
                    onClick={() => {
                      setModalLetter({
                        ta: c.mei,
                        say: c.say,
                        category: `மெய் · ${c.family === 'hard' ? 'வல்லினம்' : c.family === 'soft' ? 'மெல்லினம்' : 'இடையினம்'}`,
                        family: c.family,
                        word: c.word,
                        wordSay: c.wordSay,
                        en: c.en,
                        emoji: c.emoji,
                      });
                      handlePlaySound(c.mei, c.id);
                    }}
                    className={`p-4 rounded-2xl bg-paper-surface border transition-all cursor-pointer group hover:shadow-md hover:border-blue-500/50 flex flex-col items-center justify-between min-h-[140px] relative overflow-hidden ${
                      modalLetter?.ta === c.mei ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-border-subtle'
                    }`}
                  >
                    {isTraced && (
                      <div className="absolute top-2 left-2 text-emerald-500" title="Traced and mastered">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}

                    <div className="w-full flex items-center justify-between text-ink-tertiary text-xs">
                      <span className="font-mono">{c.say}</span>
                      <span className="text-[10px] uppercase font-bold text-blue-500/80">{c.family}</span>
                    </div>

                    <div className="text-4xl font-extrabold font-serif-tamil text-ink-primary my-1 group-hover:scale-110 transition-transform">
                      {c.mei}
                    </div>

                    <div className="text-center">
                      <p className="text-xs font-semibold text-ink-secondary">{c.word} {c.emoji}</p>
                      <p className="text-[10px] text-ink-tertiary">{c.en}</p>
                    </div>
                  </div>
                );
              })}
          </div>
        </section>
      )}

      {/* 4. COMBINATIONS GRID (216 UYIRMEI LETTERS) */}
      {(activeTab === 'all' || activeTab === 'grid') && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold font-serif-tamil text-ink-primary flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500" />
                உயிர்மெய் அட்டவணை (216 Combinations Grid)
              </h2>
              <p className="text-xs text-ink-tertiary">18 Consonants × 12 Vowels = 216 Syllables</p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-border-subtle bg-paper-surface shadow-sm">
            <table className="w-full text-center border-collapse text-xs">
              <thead>
                <tr className="bg-paper-muted border-b border-border-subtle">
                  <th className="p-2.5 font-bold text-ink-secondary border-r border-border-subtle sticky left-0 bg-paper-muted z-10">
                    Mei \ Uyir
                  </th>
                  {data.vowels.map((v) => (
                    <th key={v.id} className="p-2 font-serif-tamil font-bold text-sm text-ink-primary">
                      <div>{v.ta}</div>
                      <span className="text-[10px] text-ink-tertiary font-mono">{v.say}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.consonants.map((c, rowIdx) => (
                  <tr key={c.id} className="border-b border-border-subtle hover:bg-paper-muted/50 transition-colors">
                    <td className="p-2 font-serif-tamil font-bold text-sm text-ink-primary border-r border-border-subtle sticky left-0 bg-paper-surface z-10">
                      <div>{c.mei}</div>
                      <span className="text-[10px] text-ink-tertiary font-mono">{c.say}</span>
                    </td>
                    {data.grid[rowIdx]?.map((cell, colIdx) => {
                      const v = data.vowels[colIdx];
                      const isTraced = tracedLetters.includes(cell.ta);
                      return (
                        <td
                          key={cell.id}
                          onClick={() => {
                            setModalLetter({
                              ta: cell.ta,
                              say: cell.say,
                              category: `உயிர்மெய் (${c.mei} + ${v?.ta})`,
                              word: `${cell.ta}...`,
                              en: `Combined syllable ${cell.say}`,
                            });
                            handlePlaySound(cell.ta, cell.id);
                          }}
                          className="p-1.5 cursor-pointer hover:bg-vermilion/10 hover:text-vermilion transition-colors group relative"
                          title={`${cell.ta} (${cell.say})`}
                        >
                          {isTraced && (
                            <span className="absolute top-0.5 right-0.5 text-[8px] text-emerald-500 font-bold">✓</span>
                          )}
                          <div className="font-serif-tamil font-bold text-base text-ink-primary group-hover:scale-110 transition-transform">
                            {cell.ta}
                          </div>
                          <span className="text-[9px] text-ink-tertiary font-mono group-hover:text-vermilion">
                            {cell.say}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* 5. HOW LETTERS JOIN (SIGN VISUALIZER) */}
      {(activeTab === 'all' || activeTab === 'signs') && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold font-serif-tamil text-ink-primary flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-purple-500" />
                How Letters Join (எழுத்துக்கள் இணையும் முறை)
              </h2>
              <p className="text-xs text-ink-tertiary">Vowel signs (துணைக்குறிகள்) and rules of Tamil syllabic script</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {signGuides.map((guide, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-paper-surface border border-border-subtle shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-ink-primary">{guide.title}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 font-mono font-medium">
                    {guide.vowel}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-paper-muted font-serif-tamil text-lg font-bold text-vermilion text-center border border-border-subtle">
                  {guide.example}
                </div>
                <p className="text-xs text-ink-secondary leading-relaxed">{guide.note}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* INTERACTIVE LETTER CARD MODAL (From ilearntamil reference) */}
      <AnimatePresence>
        {modalLetter && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-paper-surface rounded-3xl border border-border-subtle shadow-2xl p-6 max-w-md w-full relative space-y-6"
            >
              {/* Modal Top Bar */}
              <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                <span className="px-3 py-1 rounded-full bg-vermilion/10 text-vermilion text-xs font-bold font-mono">
                  {modalLetter.category}
                </span>

                <button
                  onClick={() => setModalLetter(null)}
                  className="p-1.5 rounded-xl hover:bg-paper-muted text-ink-tertiary hover:text-ink-primary transition-colors"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Huge Letter Display */}
              <div className="text-center space-y-2">
                <div className="text-7xl font-extrabold font-serif-tamil text-ink-primary hover:text-vermilion transition-colors">
                  {modalLetter.ta}
                </div>
                <p className="text-sm font-bold text-ink-secondary font-mono">
                  Pronunciation: <span className="text-vermilion">'{modalLetter.say}'</span>
                </p>
              </div>

              {/* Example Word */}
              {modalLetter.word && (
                <div className="p-4 rounded-2xl bg-paper-muted/60 border border-border-subtle text-center space-y-1">
                  <span className="text-[11px] font-bold text-ink-tertiary uppercase tracking-wider">Example Word</span>
                  <div className="text-xl font-bold font-serif-tamil text-ink-primary">
                    {modalLetter.word} {modalLetter.emoji || ''}
                  </div>
                  {modalLetter.en && <p className="text-xs text-ink-secondary">{modalLetter.en}</p>}
                </div>
              )}

              {/* Audio Listen Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handlePlaySound(modalLetter.ta, 'modal-sound-letter')}
                  className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-paper-muted hover:bg-paper-muted/80 text-ink-primary font-semibold text-xs border border-border-subtle shadow-sm transition-all"
                >
                  <Volume2 className="w-4 h-4 text-vermilion" />
                  <span>Hear Letter</span>
                </button>

                {modalLetter.word && (
                  <button
                    onClick={() => handlePlaySound(modalLetter.word!, 'modal-sound-word')}
                    className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-paper-muted hover:bg-paper-muted/80 text-ink-primary font-semibold text-xs border border-border-subtle shadow-sm transition-all"
                  >
                    <Volume2 className="w-4 h-4 text-blue-500" />
                    <span>Hear Word</span>
                  </button>
                )}
              </div>

              {/* Trace This Letter CTA */}
              <button
                onClick={() => {
                  setTracingLetter(modalLetter);
                  setModalLetter(null);
                }}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-vermilion hover:bg-vermilion-hover text-white font-bold text-sm shadow-md shadow-vermilion/20 transition-all"
              >
                <PenTool className="w-4 h-4" />
                <span>✏️ Trace this letter</span>
              </button>

              {/* Prev / Next Letter Navigation */}
              <div className="flex items-center justify-between pt-2 border-t border-border-subtle text-xs text-ink-secondary">
                <button
                  onClick={handlePrevModalLetter}
                  className="flex items-center gap-1.5 hover:text-vermilion transition-colors font-medium"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </button>

                <button
                  onClick={handleNextModalLetter}
                  className="flex items-center gap-1.5 hover:text-vermilion transition-colors font-medium"
                >
                  <span>Next</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DEDICATED TRACING CANVAS MODAL */}
      <AnimatePresence>
        {tracingLetter && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md"
            >
              <LetterTracingCanvas
                letter={tracingLetter.ta}
                transliteration={tracingLetter.say}
                category={tracingLetter.category}
                onClose={() => setTracingLetter(null)}
                onTraced={handleLetterTraced}
                onNext={() => {
                  const currentIdx = allFlattenedLetters.findIndex((l) => l.ta === tracingLetter.ta);
                  const nextIdx = (currentIdx + 1) % allFlattenedLetters.length;
                  setTracingLetter(allFlattenedLetters[nextIdx]);
                }}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
