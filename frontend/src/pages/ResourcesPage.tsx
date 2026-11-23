import React, { useState } from 'react';
import { Search, Volume2, BookOpen, Layers, Sparkles, Filter, ChevronRight } from 'lucide-react';
import { speakTamil } from '../lib/speech';

interface VerbItem {
  id: string;
  root: string;
  say: string;
  en: string;
  past: string;
  present: string;
  future: string;
}

interface VocabItem {
  id: string;
  ta: string;
  say: string;
  en: string;
  category: string;
}

const verbsData: VerbItem[] = [
  { id: 'v1', root: 'பேசு', say: 'Pesu', en: 'Speak', past: 'பேசினேன் (pesinen)', present: 'பேசுகிறேன் (pesugiren)', future: 'பேசுவேன் (pesuven)' },
  { id: 'v2', root: 'எழுது', say: 'Ezhuthu', en: 'Write', past: 'எழுதினேன் (ezhuthinen)', present: 'எழுதுகிறேன் (ezhuthugiren)', future: 'எழுதுவேன் (ezhuthuven)' },
  { id: 'v3', root: 'படி', say: 'Padi', en: 'Read / Study', past: 'படித்தேன் (padithen)', present: 'படிக்கிறேன் (padikkiren)', future: 'படிப்பேன் (padippen)' },
  { id: 'v4', root: 'சாப்பிடு', say: 'Saappidu', en: 'Eat', past: 'சாப்பிட்டேன் (saappitten)', present: 'சாப்பிடுகிறேன் (saappidugiren)', future: 'சாப்பிடுவேன் (saappiduven)' },
  { id: 'v5', root: 'குடி', say: 'Kudi', en: 'Drink', past: 'குடித்தேன் (kudithen)', present: 'குடிக்கிறேன் (kudikkiren)', future: 'குடிப்பேன் (kudippen)' },
  { id: 'v6', root: 'வா', say: 'Vaa', en: 'Come', past: 'வந்தேன் (vanthen)', present: 'வருகிறேன் (varugiren)', future: 'வருவேன் (varuven)' },
  { id: 'v7', root: 'போ', say: 'Poo', en: 'Go', past: 'போனேன் (ponen)', present: 'போகிறேன் (pogiren)', future: 'போவேன் (poven)' },
  { id: 'v8', root: 'பார்', say: 'Paar', en: 'See / Look', past: 'பார்த்தேன் (paarthen)', present: 'பார்க்கிறேன் (paarkkiren)', future: 'பார்ப்பேன் (paarppen)' },
  { id: 'v9', root: 'செய்', say: 'Sey', en: 'Do / Make', past: 'செய்தேன் (seythen)', present: 'செய்கிறேன் (seygiren)', future: 'செய்வேன் (seyven)' },
  { id: 'v10', root: 'கேள்', say: 'Kael', en: 'Listen / Ask', past: 'கேட்டேன் (ketten)', present: 'கேட்கிறேன் (ketkiren)', future: 'கேட்பேன் (ketpen)' },
  { id: 'v11', root: 'கொடு', say: 'Kodu', en: 'Give', past: 'கொடுத்தேன் (koduthen)', present: 'கொடுக்கிறேன் (kodukkiren)', future: 'கொடுப்பேன் (koduppen)' },
  { id: 'v12', root: 'வாங்கு', say: 'Vaangu', en: 'Buy / Receive', past: 'வாங்கினேன் (vaanginen)', present: 'வாங்குகிறேன் (vaangugiren)', future: 'வாங்குவேன் (vaanguven)' },
  { id: 'v13', root: 'நில்', say: 'Nil', en: 'Stand', past: 'நின்றேன் (nindren)', present: 'நிற்கிறேன் (nirkiren)', future: 'நிற்பேன் (nirpen)' },
  { id: 'v14', root: 'உட்காரு', say: 'Utkaaru', en: 'Sit', past: 'உட்கார்ந்தேன் (utkaarnthen)', present: 'உட்காருகிறேன் (utkaarugiren)', future: 'உட்காருவேன் (utkaaruven)' },
  { id: 'v15', root: 'தூங்கு', say: 'Thoongu', en: 'Sleep', past: 'தூங்கினேன் (thoonginen)', present: 'தூங்குகிறேன் (thoongugiren)', future: 'தூங்குவேன் (thoonguven)' },
];

const vocabData: VocabItem[] = [
  // Animals
  { id: 'w1', ta: 'நாய்', say: 'Naai', en: 'Dog', category: 'animals' },
  { id: 'w2', ta: 'பூனை', say: 'Poonai', en: 'Cat', category: 'animals' },
  { id: 'w3', ta: 'யானை', say: 'Yaanai', en: 'Elephant', category: 'animals' },
  { id: 'w4', ta: 'சிங்கம்', say: 'Singam', en: 'Lion', category: 'animals' },
  { id: 'w5', ta: 'புலி', say: 'Puli', en: 'Tiger', category: 'animals' },
  { id: 'w6', ta: 'குதிரை', say: 'Kudhirai', en: 'Horse', category: 'animals' },
  { id: 'w7', ta: 'பசு', say: 'Pasu', en: 'Cow', category: 'animals' },
  { id: 'w8', ta: 'கிளி', say: 'Kili', en: 'Parrot', category: 'animals' },

  // Family
  { id: 'w9', ta: 'அம்மா', say: 'Amma', en: 'Mother', category: 'family' },
  { id: 'w10', ta: 'அப்பா', say: 'Appa', en: 'Father', category: 'family' },
  { id: 'w11', ta: 'அண்ணன்', say: 'Annan', en: 'Elder Brother', category: 'family' },
  { id: 'w12', ta: 'தம்பி', say: 'Thambi', en: 'Younger Brother', category: 'family' },
  { id: 'w13', ta: 'அக்கா', say: 'Akka', en: 'Elder Sister', category: 'family' },
  { id: 'w14', ta: 'தங்கை', say: 'Thangai', en: 'Younger Sister', category: 'family' },
  { id: 'w15', ta: 'தாத்தா', say: 'Thaatha', en: 'Grandfather', category: 'family' },
  { id: 'w16', ta: 'பாட்டி', say: 'Paatti', en: 'Grandmother', category: 'family' },

  // Food & Nature
  { id: 'w17', ta: 'சோறு / சாதம்', say: 'Soru / Saadham', en: 'Cooked Rice', category: 'food' },
  { id: 'w18', ta: 'தண்ணீர்', say: 'Thanneer', en: 'Water', category: 'food' },
  { id: 'w19', ta: 'பால்', say: 'Paal', en: 'Milk', category: 'food' },
  { id: 'w20', ta: 'பழம்', say: 'Pazham', en: 'Fruit', category: 'food' },
  { id: 'w21', ta: 'மரம்', say: 'Maram', en: 'Tree', category: 'nature' },
  { id: 'w22', ta: 'சூரியன்', say: 'Sooriyan', en: 'Sun', category: 'nature' },
  { id: 'w23', ta: 'நிலா', say: 'Nila', en: 'Moon', category: 'nature' },
  { id: 'w24', ta: 'மழை', say: 'Mazhai', en: 'Rain', category: 'nature' },
];

export const ResourcesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'verbs' | 'vocab' | 'grammar'>('verbs');
  const [search, setSearch] = useState('');
  const [vocabCat, setVocabCat] = useState('all');

  const filteredVerbs = verbsData.filter(
    (v) =>
      v.root.toLowerCase().includes(search.toLowerCase()) ||
      v.say.toLowerCase().includes(search.toLowerCase()) ||
      v.en.toLowerCase().includes(search.toLowerCase())
  );

  const filteredVocab = vocabData.filter((w) => {
    const matchCat = vocabCat === 'all' || w.category === vocabCat;
    const matchSearch =
      w.ta.toLowerCase().includes(search.toLowerCase()) ||
      w.say.toLowerCase().includes(search.toLowerCase()) ||
      w.en.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="space-y-8 py-6 max-w-6xl mx-auto px-4 select-none">
      {/* Header */}
      <div className="text-center space-y-3 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-vermilion/10 text-vermilion border border-vermilion/20 text-xs font-semibold">
          <BookOpen className="w-3.5 h-3.5" />
          <span>Tamil Learning Resources · கற்றல் கருவூலம்</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-ink-primary font-serif-tamil tracking-tight">
          Verbs, Vocabulary &amp; Grammar
        </h1>
        <p className="text-sm sm:text-base text-ink-secondary">
          Explore essential verb conjugations across past, present, and future tenses, essential vocabulary lists, and core grammatical rules.
        </p>

        {/* Search */}
        <div className="relative max-w-md mx-auto pt-2">
          <Search className="w-4 h-4 text-ink-tertiary absolute left-3.5 top-5" />
          <input
            type="text"
            placeholder="Search words, verbs or English meaning..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-paper-surface border border-border-subtle focus:border-vermilion focus:outline-none text-sm text-ink-primary shadow-sm"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-center gap-2 border-b border-border-subtle pb-4">
        {[
          { id: 'verbs', label: '100 Important Verbs (வினைச்சொற்கள்)' },
          { id: 'vocab', label: '1500 Vocabulary Words (சொற்களஞ்சியம்)' },
          { id: 'grammar', label: 'Essential Grammar (இலக்கணம்)' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === tab.id
                ? 'bg-vermilion text-white shadow-md'
                : 'bg-paper-surface text-ink-secondary hover:text-ink-primary border border-border-subtle'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: VERBS CONJUGATION */}
      {activeTab === 'verbs' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold font-serif-tamil text-ink-primary">
              Tamil Verbs with 3 Tenses (முக்கால வினைகள்)
            </h2>
            <span className="text-xs text-ink-tertiary">Showing {filteredVerbs.length} verbs</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredVerbs.map((verb) => (
              <div
                key={verb.id}
                className="p-5 rounded-2xl bg-paper-surface border border-border-subtle shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between border-b border-border-subtle pb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-extrabold font-serif-tamil text-vermilion">
                      {verb.root}
                    </span>
                    <div>
                      <span className="text-xs font-mono font-bold text-ink-primary">'{verb.say}'</span>
                      <p className="text-xs text-ink-secondary">Meaning: {verb.en}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => speakTamil(verb.root)}
                    className="p-2 rounded-xl bg-paper-muted hover:bg-paper-muted/80 text-vermilion"
                    title={`Pronounce ${verb.root}`}
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2 text-[11px] pt-1">
                  <div className="p-2 rounded-xl bg-paper-muted border border-border-subtle">
                    <span className="text-[10px] text-ink-tertiary block font-bold">Past (இறந்த காலம்)</span>
                    <span className="font-serif-tamil font-semibold text-ink-primary">{verb.past}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-paper-muted border border-border-subtle">
                    <span className="text-[10px] text-ink-tertiary block font-bold">Present (நிகழ் காலம்)</span>
                    <span className="font-serif-tamil font-semibold text-ink-primary">{verb.present}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-paper-muted border border-border-subtle">
                    <span className="text-[10px] text-ink-tertiary block font-bold">Future (எதிர் காலம்)</span>
                    <span className="font-serif-tamil font-semibold text-ink-primary">{verb.future}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: VOCABULARY LIST */}
      {activeTab === 'vocab' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-bold font-serif-tamil text-ink-primary">
              Essential Tamil Vocabulary List
            </h2>

            {/* Category Filter */}
            <div className="flex items-center gap-1.5 bg-paper-surface p-1 rounded-xl border border-border-subtle text-xs">
              {[
                { id: 'all', label: 'All' },
                { id: 'animals', label: 'Animals (விலங்குகள்)' },
                { id: 'family', label: 'Family (குடும்பம்)' },
                { id: 'food', label: 'Food & Drink (உணவு)' },
                { id: 'nature', label: 'Nature (இயற்கை)' },
              ].map((c) => (
                <button
                  key={c.id}
                  onClick={() => setVocabCat(c.id)}
                  className={`px-3 py-1 rounded-lg transition-colors font-medium ${
                    vocabCat === c.id ? 'bg-vermilion text-white' : 'text-ink-secondary hover:text-ink-primary'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {filteredVocab.map((w) => (
              <div
                key={w.id}
                onClick={() => speakTamil(w.ta)}
                className="p-4 rounded-2xl bg-paper-surface border border-border-subtle hover:border-vermilion/50 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between min-h-[110px]"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-ink-tertiary">{w.category}</span>
                  <Volume2 className="w-3.5 h-3.5 text-ink-tertiary group-hover:text-vermilion" />
                </div>
                <div className="text-2xl font-bold font-serif-tamil text-ink-primary group-hover:text-vermilion transition-colors my-1">
                  {w.ta}
                </div>
                <div>
                  <p className="text-xs font-mono font-medium text-vermilion">{w.say}</p>
                  <p className="text-[11px] text-ink-secondary">{w.en}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: GRAMMAR ESSENTIALS */}
      {activeTab === 'grammar' && (
        <div className="space-y-6">
          <div className="text-center space-y-2 max-w-xl mx-auto">
            <h2 className="text-2xl font-extrabold font-serif-tamil text-ink-primary">
              Core Tamil Grammar Pillars (அடிப்படை இலக்கணம்)
            </h2>
            <p className="text-xs sm:text-sm text-ink-secondary">
              Master the foundational grammar rules that unlock fluent sentence formation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Grammar 1: Pronouns */}
            <div className="p-6 rounded-3xl bg-paper-surface border border-border-subtle shadow-sm space-y-3">
              <span className="px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-500 text-[10px] font-bold uppercase">
                Pronouns (பதிலிடு பெயர்கள்)
              </span>
              <h3 className="font-bold text-base text-ink-primary font-serif-tamil">
                Personal Pronouns
              </h3>
              <ul className="space-y-1.5 text-xs text-ink-secondary">
                <li className="flex justify-between border-b border-border-subtle/50 pb-1"><span>நான் (Naan)</span><span className="text-ink-tertiary">I</span></li>
                <li className="flex justify-between border-b border-border-subtle/50 pb-1"><span>நீ (Nee)</span><span className="text-ink-tertiary">You (Informal)</span></li>
                <li className="flex justify-between border-b border-border-subtle/50 pb-1"><span>நீங்கள் (Neengal)</span><span className="text-ink-tertiary">You (Respectful / Plural)</span></li>
                <li className="flex justify-between border-b border-border-subtle/50 pb-1"><span>அவன் / அவள் (Avan / Aval)</span><span className="text-ink-tertiary">He / She</span></li>
                <li className="flex justify-between border-b border-border-subtle/50 pb-1"><span>நாம் / நாங்கள் (Naam / Naangal)</span><span className="text-ink-tertiary">We (Inclusive / Exclusive)</span></li>
                <li className="flex justify-between"><span>அவர்கள் (Avargal)</span><span className="text-ink-tertiary">They</span></li>
              </ul>
            </div>

            {/* Grammar 2: Noun Cases */}
            <div className="p-6 rounded-3xl bg-paper-surface border border-border-subtle shadow-sm space-y-3">
              <span className="px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-600 text-[10px] font-bold uppercase">
                Noun Cases (வேற்றுமை உருபுகள்)
              </span>
              <h3 className="font-bold text-base text-ink-primary font-serif-tamil">
                The 8 Tamil Cases
              </h3>
              <ul className="space-y-1.5 text-xs text-ink-secondary">
                <li className="flex justify-between border-b border-border-subtle/50 pb-1"><span>1st: எழுவாய் (Subject)</span><span className="text-ink-tertiary">Zero marker</span></li>
                <li className="flex justify-between border-b border-border-subtle/50 pb-1"><span>2nd: ஐ (Accusative)</span><span className="text-ink-tertiary">அவனைப் பார் (See him)</span></li>
                <li className="flex justify-between border-b border-border-subtle/50 pb-1"><span>3rd: ஆல் / ஓடு (Instrumental)</span><span className="text-ink-tertiary">பேனாவால் (With pen)</span></li>
                <li className="flex justify-between border-b border-border-subtle/50 pb-1"><span>4th: கு (Dative)</span><span className="text-ink-tertiary">எனக்கு (To me)</span></li>
                <li className="flex justify-between border-b border-border-subtle/50 pb-1"><span>5th: இல் / இன் (Ablative)</span><span className="text-ink-tertiary">ஊரிலிருந்து (From town)</span></li>
                <li className="flex justify-between border-b border-border-subtle/50 pb-1"><span>6th: அது (Genitive)</span><span className="text-ink-tertiary">என் புத்தகம் (My book)</span></li>
                <li className="flex justify-between"><span>7th: கண் / இல் (Locative)</span><span className="text-ink-tertiary">வீட்டில் (In house)</span></li>
              </ul>
            </div>

            {/* Grammar 3: Sandhi Rules */}
            <div className="p-6 rounded-3xl bg-paper-surface border border-border-subtle shadow-sm space-y-3">
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-bold uppercase">
                Sandhi (புணர்ச்சி விதிகள்)
              </span>
              <h3 className="font-bold text-base text-ink-primary font-serif-tamil">
                Vallinam Doubling (க், ச், த், ப்)
              </h3>
              <p className="text-xs text-ink-secondary leading-relaxed">
                In Tamil, hard consonants (க், ச், த், ப்) double after words ending in certain vowel markers or case endings:
              </p>
              <div className="p-3 rounded-xl bg-paper-muted border border-border-subtle font-mono text-xs text-ink-primary space-y-1">
                <div>பள்ளி + கூடம் = பள்ளிக்கூடம்</div>
                <div>திரை + படம் = திரைப்படம்</div>
                <div>அங்கு + போனான் = அங்குப் போனான்</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
