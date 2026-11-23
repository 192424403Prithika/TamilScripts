import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';
import { Volume2, Search, Sparkles, PenTool, BookOpen, Layers, Check, ArrowRight } from 'lucide-react';
import { speakTamil } from '../lib/speech';

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

export const LettersChartPage: React.FC = () => {
  const { setActiveTab } = useAppStore();
  const [data, setData] = useState<AlphabetData | null>(null);
  const [activeTab, setActiveFilter] = useState<'all' | 'vowels' | 'consonants' | 'grid' | 'signs'>('all');
  const [consonantFamily, setConsonantFamily] = useState<'all' | 'hard' | 'soft' | 'middle'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [selectedLetter, setSelectedLetter] = useState<{ ta: string; say: string; word?: string; en?: string } | null>(null);

  useEffect(() => {
    fetch('/tamil_alphabet_data.json')
      .then((res) => res.json())
      .then((json: AlphabetData) => {
        setData(json);
        if (json.vowels?.[0]) {
          setSelectedLetter({
            ta: json.vowels[0].ta,
            say: json.vowels[0].say,
            word: json.vowels[0].word,
            en: json.vowels[0].en,
          });
        }
      })
      .catch((err) => console.error('Failed to load alphabet data:', err));
  }, []);

  const handlePlaySound = (text: string, id: string) => {
    setPlayingId(id);
    speakTamil(text).finally(() => setPlayingId(null));
  };

  const handlePracticeInStudio = (char: string) => {
    setActiveTab('recognize');
  };

  // Vowel signs guide
  const signGuides = [
    { title: 'No sign (Base)', vowel: 'அ (a)', example: 'க் + அ = க', note: 'The dot (pulli) goes away, leaving the base shape' },
    { title: 'Kaal sign after (ா)', vowel: 'ஆ (aa)', example: 'க் + ஆ = கா', note: 'Adds a vertical curve kaal after the consonant' },
    { title: 'Curl on top (ி / ீ)', vowel: 'இ (i) / ஈ (ii)', example: 'க் + இ = கி, க் + ஈ = கீ', note: 'Adds a top hook curl (short) or loop (long)' },
    { title: 'Shape below (ு / ூ)', vowel: 'உ (u) / ஊ (uu)', example: 'க் + உ = கு, க் + ஊ = கூ', note: 'Transforms or adds loops beneath the letter' },
    { title: 'Kombu before (ெ / ே)', vowel: 'எ (e) / ஏ (ee)', example: 'க் + எ = கெ, க் + ஏ = கே', note: 'Single kombu (ெ) or looped kombu (ே) placed in front' },
    { title: 'Double kombu (ை)', vowel: 'ஐ (ai)', example: 'க் + ஐ = கை', note: 'Twin kombu (ை) placed in front' },
    { title: 'Signs on both sides (ொ / ோ / ௌ)', vowel: 'ஒ / ஓ / ஔ', example: 'க் + ஒ = கொ, க் + ஔ = கௌ', note: 'Encloses the letter with front kombu and trailing sign' },
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
          Explore all 247 letters — 12 Vowels (உயிர்), 18 Consonants (மெய்), 216 Combinations (உயிர்மெய்), and 1 Special (ஆய்தம்). Tap any card to hear its pure native pronunciation.
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
      </div>

      {/* Main Filter Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-center gap-2 border-b border-border-subtle pb-4">
        {[
          { id: 'all', label: 'All 247 Letters' },
          { id: 'vowels', label: 'Vowels · உயிர் (12)' },
          { id: 'consonants', label: 'Consonants · மெய் (18)' },
          { id: 'grid', label: 'Combinations Grid (216)' },
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
            {data.vowels.map((v) => (
              <div
                key={v.id}
                onClick={() => {
                  setSelectedLetter({ ta: v.ta, say: v.say, word: v.word, en: v.en });
                  handlePlaySound(v.ta, v.id);
                }}
                className={`p-4 rounded-2xl bg-paper-surface border transition-all cursor-pointer group hover:shadow-md hover:border-vermilion/50 flex flex-col items-center justify-between min-h-[140px] relative overflow-hidden ${
                  selectedLetter?.ta === v.ta ? 'border-vermilion ring-2 ring-vermilion/20' : 'border-border-subtle'
                }`}
              >
                <div className="w-full flex items-center justify-between text-ink-tertiary text-xs">
                  <span className="font-mono">{v.say}</span>
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
            ))}
          </div>
        </section>
      )}

      {/* 2. AYUTHAM SPECIAL */}
      {(activeTab === 'all' || activeTab === 'vowels') && data.aaytham && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-3xl font-extrabold font-serif-tamil text-amber-600 bg-paper-surface px-4 py-2 rounded-xl shadow-sm border border-amber-500/30">
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
              .map((c) => (
                <div
                  key={c.id}
                  onClick={() => {
                    setSelectedLetter({ ta: c.mei, say: c.say, word: c.word, en: c.en });
                    handlePlaySound(c.mei, c.id);
                  }}
                  className={`p-4 rounded-2xl bg-paper-surface border transition-all cursor-pointer group hover:shadow-md hover:border-blue-500/50 flex flex-col items-center justify-between min-h-[140px] relative overflow-hidden ${
                    selectedLetter?.ta === c.mei ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-border-subtle'
                  }`}
                >
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
              ))}
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
                    {data.grid[rowIdx]?.map((cell) => (
                      <td
                        key={cell.id}
                        onClick={() => handlePlaySound(cell.ta, cell.id)}
                        className="p-1.5 cursor-pointer hover:bg-vermilion/10 hover:text-vermilion transition-colors group"
                        title={`${cell.ta} (${cell.say})`}
                      >
                        <div className="font-serif-tamil font-bold text-base text-ink-primary group-hover:scale-110 transition-transform">
                          {cell.ta}
                        </div>
                        <span className="text-[9px] text-ink-tertiary font-mono group-hover:text-vermilion">
                          {cell.say}
                        </span>
                      </td>
                    ))}
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

      {/* Interactive Floating Quick-Action Bar */}
      {selectedLetter && (
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-paper-surface border border-border-subtle shadow-xl rounded-2xl px-6 py-3 flex items-center gap-4 z-40 max-w-lg w-[90%]"
        >
          <div className="flex items-center gap-3">
            <span className="text-3xl font-extrabold font-serif-tamil text-vermilion">
              {selectedLetter.ta}
            </span>
            <div className="text-left">
              <p className="text-xs font-bold text-ink-primary">Sound: '{selectedLetter.say}'</p>
              {selectedLetter.word && (
                <p className="text-[11px] text-ink-secondary">
                  Example: {selectedLetter.word} ({selectedLetter.en})
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={() => handlePlaySound(selectedLetter.ta, 'floating')}
              className="p-2 rounded-xl bg-paper-muted hover:bg-paper-muted/80 text-ink-primary transition-colors"
              title="Hear sound"
            >
              <Volume2 className="w-4 h-4 text-vermilion" />
            </button>

            <button
              onClick={() => handlePracticeInStudio(selectedLetter.ta)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-vermilion hover:bg-vermilion-hover text-white text-xs font-semibold shadow-sm transition-all"
            >
              <PenTool className="w-3.5 h-3.5" />
              <span>Trace in AI</span>
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};
