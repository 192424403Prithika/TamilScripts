import React from 'react';

interface TamilKeyboardProps {
  onKeyClick?: (char: string) => void;
  onCharSelect?: (char: string) => void;
  onBackspace?: () => void;
}

export const TamilKeyboard: React.FC<TamilKeyboardProps> = ({
  onKeyClick,
  onCharSelect,
  onBackspace,
}) => {
  const vowels = ["அ", "ஆ", "இ", "ஈ", "உ", "ஊ", "எ", "ஏ", "ஐ", "ஒ", "ஓ", "ஔ", "ஃ"];
  const consonants = ["க", "ங", "ச", "ஞ", "ட", "ண", "த", "ந", "ப", "ம", "ய", "ர", "ல", "வ", "ழ", "ள", "ற", "ன"];
  const pulliAndDiacritics = ["்", "ா", "ி", "ீ", "ு", "ூ", "ெ", "ே", "ை", "ொ", "ோ", "ௌ"];

  const handleKey = (char: string) => {
    if (onKeyClick) onKeyClick(char);
    if (onCharSelect) onCharSelect(char);
  };

  return (
    <div className="w-full bg-paper-surface rounded-2xl p-4 border border-border-subtle space-y-3 shadow-paper-sm">
      {/* Vowels Row */}
      <div className="flex flex-wrap gap-1.5 items-center justify-center">
        <span className="text-[10px] text-ink-tertiary uppercase tracking-wider font-semibold w-full text-center sm:w-auto sm:mr-2">
          Uyir (உயிர்)
        </span>
        {vowels.map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => handleKey(v)}
            className="w-8 h-8 rounded-lg bg-paper-canvas border border-border-subtle font-serif-tamil text-sm font-semibold text-ink-primary hover:bg-vermilion hover:text-white hover:border-vermilion active:scale-95 transition-all shadow-paper-sm"
          >
            {v}
          </button>
        ))}
      </div>

      {/* Consonants Row */}
      <div className="flex flex-wrap gap-1.5 items-center justify-center">
        <span className="text-[10px] text-ink-tertiary uppercase tracking-wider font-semibold w-full text-center sm:w-auto sm:mr-2">
          Mei (மெய்)
        </span>
        {consonants.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => handleKey(c)}
            className="w-8 h-8 rounded-lg bg-paper-canvas border border-border-subtle font-serif-tamil text-sm font-semibold text-ink-primary hover:bg-vermilion hover:text-white hover:border-vermilion active:scale-95 transition-all shadow-paper-sm"
          >
            {c}
          </button>
        ))}
      </div>

      {/* Diacritics and Action Keys */}
      <div className="flex flex-wrap gap-1.5 items-center justify-center pt-1 border-t border-border-subtle">
        <span className="text-[10px] text-ink-tertiary uppercase tracking-wider font-semibold w-full text-center sm:w-auto sm:mr-2">
          Signs (குறிகள்)
        </span>
        {pulliAndDiacritics.map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => handleKey(d)}
            className="w-8 h-8 rounded-lg bg-paper-canvas border border-border-subtle font-serif-tamil text-sm font-bold text-gold hover:bg-gold hover:text-white active:scale-95 transition-all shadow-paper-sm"
          >
            {d}
          </button>
        ))}

        {/* Space and Backspace */}
        <button
          type="button"
          onClick={() => handleKey(" ")}
          className="px-3 h-8 rounded-lg bg-paper-muted border border-border-subtle text-xs font-semibold text-ink-secondary hover:text-ink-primary active:scale-95 transition-all shadow-paper-sm"
        >
          Space
        </button>
        {onBackspace && (
          <button
            type="button"
            onClick={onBackspace}
            className="px-3 h-8 rounded-lg bg-vermilion/10 border border-vermilion/30 text-xs font-semibold text-vermilion hover:bg-vermilion hover:text-white active:scale-95 transition-all shadow-paper-sm"
          >
            ⌫
          </button>
        )}
      </div>
    </div>
  );
};

export default TamilKeyboard;
