import React, { useState } from 'react';
import { Search, ChevronDown, HelpCircle, MessageCircle, Mail } from 'lucide-react';

interface FaqItem {
  id: string;
  category: 'general' | 'kids' | 'letters' | 'ai' | 'classes';
  q: string;
  a: string;
}

const faqList: FaqItem[] = [
  {
    id: 'f1',
    category: 'general',
    q: 'Can an absolute beginner with zero Tamil knowledge learn to speak?',
    a: 'Absolutely! Our Simple Spoken Tamil pathway starts from basic phonetic greetings (வணக்கம், நன்றி) and daily phrases. You do not need to memorize the script to start speaking. All vocabulary is provided in easy-to-read English transliteration alongside authentic audio pronunciation.',
  },
  {
    id: 'f2',
    category: 'general',
    q: 'How long does it take to learn conversational Tamil?',
    a: 'With consistent daily practice of 20 minutes using our phrasebook and letter games, most learners achieve basic conversational confidence within 30 to 45 days. Dedicated 1-on-1 tutoring accelerates this further.',
  },
  {
    id: 'f3',
    category: 'kids',
    q: 'What age group are the online kids classes designed for?',
    a: 'Our kids curriculum caters to children aged 4 to 14. For younger kids (ages 4-7), we focus on animated rhymes, storytelling, fruit/animal names, and drawing games. Older children transition into structured reading, speaking, and school board curriculum support.',
  },
  {
    id: 'f4',
    category: 'kids',
    q: 'My child only speaks English. Will they feel overwhelmed in class?',
    a: 'Not at all. All our teachers are bilingual in English and Tamil. We use a gentle immersion technique where English is used for explanations and Tamil is introduced progressively through interactive games and visual stories.',
  },
  {
    id: 'f5',
    category: 'letters',
    q: 'How are the 247 letters in the Tamil alphabet organized?',
    a: 'Tamil has 12 Vowels (உயிர்: அ to ஔ), 18 Consonants (மெய்: க் to ன்), 216 Vowel-Consonants (உயிர்மெய்: e.g. க, கா, கி, கீ...), and 1 Special Letter (ஆய்தம்: ஃ). 12 + 18 + 216 + 1 = 247 letters. Once you master the 7 vowel sign patterns, reading all 216 combinations becomes intuitive math.',
  },
  {
    id: 'f6',
    category: 'letters',
    q: 'How does the interactive audio pronunciation work on the alphabet chart?',
    a: 'Every letter card is hooked up to the browser-native Web Speech API with the `ta-IN` Tamil voice engine. Tapping any card plays the sound instantly with zero network buffering or audio file delay.',
  },
  {
    id: 'f7',
    category: 'ai',
    q: 'What is the TamilScript AI handwriting recognition engine?',
    a: 'It is a custom deep learning neural network (Squeeze-and-Excitation ResNet) trained on over 100,000 handwritten Tamil character strokes with 96.4% test accuracy. It executes client-side via ONNX Runtime / TensorFlow.js, guaranteeing sub-50ms real-time feedback on your canvas drawings.',
  },
  {
    id: 'f8',
    category: 'ai',
    q: 'Does the AI stroke scoring work on touchscreen devices and iPads?',
    a: 'Yes! The canvas is fully optimized for touch styluses (Apple Pencil, S-Pen), tablet screens, and mobile touchscreens with responsive palm rejection and pressure smoothing.',
  },
  {
    id: 'f9',
    category: 'classes',
    q: 'Are the live classes conducted 1-on-1 or in group batches?',
    a: 'We offer both personalized 1-on-1 private tutoring and small interactive group cohorts (3-5 students max). Flexible scheduling accommodates all global time zones (USA EST/PST, UK GMT, Singapore SGT, and Australia AEST).',
  },
  {
    id: 'f10',
    category: 'classes',
    q: 'How do I book a free demo session?',
    a: 'Simply visit our Contact & Book page or message us directly on WhatsApp (+91 90353 94805). Our academic coordinators will assign a mentor and schedule your complimentary 30-minute demo class at your preferred time.',
  },
];

export const FaqPage: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [openIdx, setOpenIdx] = useState<string | null>('f1');

  const filtered = faqList.filter((item) => {
    const matchCat = activeCategory === 'all' || item.category === activeCategory;
    const matchSearch =
      item.q.toLowerCase().includes(search.toLowerCase()) ||
      item.a.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="space-y-10 py-6 max-w-4xl mx-auto px-4 select-none">
      {/* Header */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-vermilion/10 text-vermilion border border-vermilion/20 text-xs font-semibold">
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Help &amp; Answers · அடிக்கடி கேட்கப்படும் கேள்விகள்</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-ink-primary font-serif-tamil tracking-tight">
          Frequently Asked Questions
        </h1>
        <p className="text-sm text-ink-secondary">
          Everything you need to know about learning Tamil, courses, live tutoring, and our AI handwriting tools.
        </p>

        {/* Search */}
        <div className="relative max-w-md mx-auto pt-2">
          <Search className="w-4 h-4 text-ink-tertiary absolute left-3.5 top-5" />
          <input
            type="text"
            placeholder="Search questions (e.g. 'kids', '247 letters', 'demo')..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-paper-surface border border-border-subtle focus:border-vermilion focus:outline-none text-sm text-ink-primary shadow-sm"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {[
          { id: 'all', label: 'All Questions' },
          { id: 'general', label: 'Beginners & Spoken' },
          { id: 'kids', label: 'Kids Classes' },
          { id: 'letters', label: '247 Letters & Sounds' },
          { id: 'ai', label: 'AI Writing Studio' },
          { id: 'classes', label: 'Live Classes & Demo' },
        ].map((c) => (
          <button
            key={c.id}
            onClick={() => setActiveCategory(c.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeCategory === c.id
                ? 'bg-vermilion text-white shadow-sm'
                : 'bg-paper-surface text-ink-secondary hover:text-ink-primary border border-border-subtle'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Accordion List */}
      <div className="space-y-3">
        {filtered.map((item) => {
          const isOpen = openIdx === item.id;
          return (
            <div
              key={item.id}
              className="rounded-2xl bg-paper-surface border border-border-subtle overflow-hidden transition-all shadow-sm"
            >
              <button
                onClick={() => setOpenIdx(isOpen ? null : item.id)}
                className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 font-semibold text-sm sm:text-base text-ink-primary hover:text-vermilion transition-colors"
              >
                <span>{item.q}</span>
                <ChevronDown
                  className={`w-4 h-4 text-ink-tertiary flex-shrink-0 transition-transform duration-200 ${
                    isOpen ? 'rotate-180 text-vermilion' : ''
                  }`}
                />
              </button>
              {isOpen && (
                <div className="px-5 pb-5 text-xs sm:text-sm text-ink-secondary leading-relaxed border-t border-border-subtle/50 pt-3">
                  {item.a}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Still Have Questions CTA */}
      <div className="p-8 rounded-3xl bg-paper-surface border border-border-subtle shadow-md text-center space-y-4">
        <h3 className="text-xl font-bold font-serif-tamil text-ink-primary">
          Still Have Questions?
        </h3>
        <p className="text-xs text-ink-secondary max-w-md mx-auto">
          Our team is available 24/7 on WhatsApp to answer your questions and help you pick the best learning path.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <a
            href="https://wa.me/919035394805?text=Hi%20TamilScript%20AI!%20I%20have%20a%20question%20about%20learning%20Tamil."
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-all"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Chat on WhatsApp (+91 90353 94805)</span>
          </a>
          <a
            href="mailto:support@tamilscript.ai"
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-paper-muted hover:bg-paper-muted/80 text-ink-primary text-xs font-semibold border border-border-subtle transition-all"
          >
            <Mail className="w-4 h-4 text-vermilion" />
            <span>support@tamilscript.ai</span>
          </a>
        </div>
      </div>
    </div>
  );
};
