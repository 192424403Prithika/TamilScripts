import React, { useState } from 'react';
import { Volume2, MessageSquare, Search, Sparkles, Sliders } from 'lucide-react';
import { speakTamil } from '../lib/speech';

interface Phrase {
  id: string;
  ta: string;
  say: string;
  en: string;
  category: 'greetings' | 'basics' | 'family' | 'travel' | 'shopping';
}

const phrasesData: Phrase[] = [
  // Greetings
  { id: 'p1', ta: 'வணக்கம்', say: 'Vanakkam', en: 'Hello / Greetings', category: 'greetings' },
  { id: 'p2', ta: 'நன்றி', say: 'Nandri', en: 'Thank you', category: 'greetings' },
  { id: 'p3', ta: 'மன்னிக்கவும்', say: 'Mannikkavum', en: 'Sorry / Excuse me', category: 'greetings' },
  { id: 'p4', ta: 'எப்படி இருக்கிறீர்கள்?', say: 'Eppadi irukkireergal?', en: 'How are you?', category: 'greetings' },
  { id: 'p5', ta: 'நான் நன்றாக இருக்கிறேன்', say: 'Naan nandraaga irukkiren', en: 'I am doing well', category: 'greetings' },
  { id: 'p6', ta: 'வரவேற்கிறோம்', say: 'Varaverkirom', en: 'Welcome', category: 'greetings' },
  { id: 'p7', ta: 'மீண்டும் சந்திப்போம்', say: 'Meendum sandhippom', en: 'See you again / Goodbye', category: 'greetings' },

  // Basics
  { id: 'p8', ta: 'உங்கள் பெயர் என்ன?', say: 'Ungal peyar enna?', en: 'What is your name?', category: 'basics' },
  { id: 'p9', ta: 'என் பெயர்...', say: 'En peyar...', en: 'My name is...', category: 'basics' },
  { id: 'p10', ta: 'எனக்கு தமிழ் கொஞ்சம் தெரியும்', say: 'Enakku Tamil konjam theriyum', en: 'I know a little Tamil', category: 'basics' },
  { id: 'p11', ta: 'ஆம் / இல்லை', say: 'Aam / Illai', en: 'Yes / No', category: 'basics' },
  { id: 'p12', ta: 'தயவுசெய்து', say: 'Thayavuseythu', en: 'Please', category: 'basics' },

  // Family & Daily Life
  { id: 'p13', ta: 'அம்மா / அப்பா', say: 'Amma / Appa', en: 'Mother / Father', category: 'family' },
  { id: 'p14', ta: 'சாப்பிட்டீர்களா?', say: 'Saappitteergala?', en: 'Have you eaten?', category: 'family' },
  { id: 'p15', ta: 'தண்ணீர் கொடுங்கள்', say: 'Thanneer kodungal', en: 'Please give water', category: 'family' },
  { id: 'p16', ta: 'ரொம்ப சுவையாக இருக்கிறது', say: 'Romba suvaiyaaga irukkirathu', en: 'It is very delicious', category: 'family' },

  // Travel & Help
  { id: 'p17', ta: 'பேருந்து நிலையம் எங்கே?', say: 'Perundhu nilayam engae?', en: 'Where is the bus station?', category: 'travel' },
  { id: 'p18', ta: 'எனக்கு உதவி வேண்டும்', say: 'Enakku udhavi vendum', en: 'I need help', category: 'travel' },
  { id: 'p19', ta: 'இங்கு வாருங்கள்', say: 'Ingu vaarungal', en: 'Please come here', category: 'travel' },
  { id: 'p20', ta: 'மணி என்ன?', say: 'Mani enna?', en: 'What is the time?', category: 'travel' },

  // Shopping & Numbers
  { id: 'p21', ta: 'இதன் விலை என்ன?', say: 'Idhan vilai enna?', en: 'How much does this cost?', category: 'shopping' },
  { id: 'p22', ta: 'ரொம்ப அதிகம்', say: 'Romba adhigam', en: 'Too expensive', category: 'shopping' },
  { id: 'p23', ta: 'ஒன்று, இரண்டு, மூன்று', say: 'Ondru, Irandu, Moondru', en: 'One, Two, Three', category: 'shopping' },
];

export const SpeakPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [slowAudio, setSlowAudio] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);

  const handleSpeak = (text: string, id: string) => {
    setPlayingId(id);
    speakTamil(text, slowAudio ? 0.65 : 0.85).finally(() => setPlayingId(null));
  };

  const filteredPhrases = phrasesData.filter((p) => {
    const matchCat = selectedCategory === 'all' || p.category === selectedCategory;
    const matchSearch =
      p.ta.toLowerCase().includes(search.toLowerCase()) ||
      p.say.toLowerCase().includes(search.toLowerCase()) ||
      p.en.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="space-y-8 py-6 max-w-5xl mx-auto px-4 select-none">
      {/* Title Header */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-vermilion/10 text-vermilion border border-vermilion/20 text-xs font-semibold">
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Conversational Spoken Tamil · எளிய பேச்சுத் தமிழ்</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-ink-primary font-serif-tamil tracking-tight">
          Speak Everyday Tamil
        </h1>
        <p className="text-sm text-ink-secondary">
          Essential phrases, everyday greetings, and practical sentences with instant native pronunciation via Web Speech API.
        </p>

        {/* Search & Slow Audio toggle */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-ink-tertiary absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Search phrases in Tamil or English..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-paper-surface border border-border-subtle focus:border-vermilion focus:outline-none text-sm text-ink-primary shadow-sm"
            />
          </div>

          <button
            onClick={() => setSlowAudio(!slowAudio)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border text-xs font-semibold transition-all ${
              slowAudio
                ? 'bg-vermilion text-white border-vermilion shadow-sm'
                : 'bg-paper-surface text-ink-secondary border-border-subtle hover:text-ink-primary'
            }`}
            title="Slow down speech rate for easy learning"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Slow Speed {slowAudio ? '(ON)' : ''}</span>
          </button>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {[
          { id: 'all', label: 'All Phrases' },
          { id: 'greetings', label: 'Greetings (வாழ்த்துக்கள்)' },
          { id: 'basics', label: 'Basics (அடிப்படை)' },
          { id: 'family', label: 'Family & Food (உணவு & குடும்பம்)' },
          { id: 'travel', label: 'Travel & Help (பயணம்)' },
          { id: 'shopping', label: 'Shopping & Numbers (எண்கள்)' },
        ].map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              selectedCategory === cat.id
                ? 'bg-vermilion text-white shadow-sm'
                : 'bg-paper-surface text-ink-secondary hover:text-ink-primary border border-border-subtle'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Phrase Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filteredPhrases.map((phrase) => (
          <div
            key={phrase.id}
            onClick={() => handleSpeak(phrase.ta, phrase.id)}
            className="p-4 rounded-2xl bg-paper-surface border border-border-subtle hover:border-vermilion/50 hover:shadow-md transition-all cursor-pointer flex items-center justify-between group"
          >
            <div className="space-y-1">
              <div className="text-xl font-bold font-serif-tamil text-ink-primary group-hover:text-vermilion transition-colors">
                {phrase.ta}
              </div>
              <p className="text-xs font-mono font-medium text-vermilion">{phrase.say}</p>
              <p className="text-xs text-ink-secondary">{phrase.en}</p>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleSpeak(phrase.ta, phrase.id);
              }}
              className="p-3 rounded-2xl bg-paper-muted hover:bg-vermilion hover:text-white text-ink-secondary transition-all group-hover:scale-105"
              aria-label={`Listen to ${phrase.ta}`}
            >
              <Volume2 className={`w-5 h-5 ${playingId === phrase.id ? 'animate-pulse text-vermilion' : ''}`} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
