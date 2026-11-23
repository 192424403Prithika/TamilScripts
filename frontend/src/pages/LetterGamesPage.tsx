import React, { useState, useEffect } from 'react';
import { Volume2, Trophy, Flame, RotateCcw, Sparkles, CheckCircle2, XCircle } from 'lucide-react';
import { speakTamil } from '../lib/speech';

interface LetterQuestion {
  target: string;
  targetSay: string;
  options: string[];
  type: 'sound' | 'equation';
  equationPrompt?: string;
}

const letterPool = [
  { ta: 'அ', say: 'a' },
  { ta: 'ஆ', say: 'aa' },
  { ta: 'இ', say: 'i' },
  { ta: 'ஈ', say: 'ii' },
  { ta: 'உ', say: 'u' },
  { ta: 'ஊ', say: 'uu' },
  { ta: 'எ', say: 'e' },
  { ta: 'ஏ', say: 'ee' },
  { ta: 'ஐ', say: 'ai' },
  { ta: 'ஒ', say: 'o' },
  { ta: 'ஓ', say: 'oo' },
  { ta: 'ஔ', say: 'au' },
  { ta: 'க', say: 'ka' },
  { ta: 'சா', say: 'saa' },
  { ta: 'டி', say: 'di' },
  { ta: 'தீ', say: 'thee' },
  { ta: 'பு', say: 'pu' },
  { ta: 'மே', say: 'mee' },
  { ta: 'மை', say: 'mai' },
  { ta: 'கொ', say: 'ko' },
  { ta: 'போ', say: 'poo' },
  { ta: 'லௌ', say: 'lau' },
];

const mathEquations = [
  { prompt: 'க் + அ = ?', target: 'க', targetSay: 'ka', options: ['க', 'கா', 'கி', 'கு'] },
  { prompt: 'ச் + ஆ = ?', target: 'சா', targetSay: 'saa', options: ['ச', 'சா', 'சி', 'சு'] },
  { prompt: 'ட் + இ = ?', target: 'டி', targetSay: 'di', options: ['ட', 'டா', 'டி', 'டீ'] },
  { prompt: 'த் + ஈ = ?', target: 'தீ', targetSay: 'thee', options: ['த', 'தா', 'தி', 'தீ'] },
  { prompt: 'ப் + உ = ?', target: 'பு', targetSay: 'pu', options: ['ப', 'பா', 'பி', 'பு'] },
  { prompt: 'ம் + ஏ = ?', target: 'மே', targetSay: 'mee', options: ['ம', 'மா', 'மெ', 'மே'] },
  { prompt: 'க் + ஐ = ?', target: 'கை', targetSay: 'kai', options: ['க', 'கி', 'கை', 'கோ'] },
];

export const LetterGamesPage: React.FC = () => {
  const [gameMode, setGameMode] = useState<'sound' | 'equation'>('sound');
  const [streak, setStreak] = useState<number>(0);
  const [bestStreak, setBestStreak] = useState<number>(() => {
    return parseInt(localStorage.getItem('tamil_game_best_streak') || '0', 10);
  });
  const [currentQ, setCurrentQ] = useState<LetterQuestion | null>(null);
  const [answeredState, setAnsweredState] = useState<{ chosen: string; correct: boolean } | null>(null);

  const generateSoundQuestion = () => {
    const targetIdx = Math.floor(Math.random() * letterPool.length);
    const target = letterPool[targetIdx];

    const wrongOptions = letterPool
      .filter((_, idx) => idx !== targetIdx)
      .sort(() => 0.5 - Math.random())
      .slice(0, 3)
      .map((item) => item.ta);

    const options = [target.ta, ...wrongOptions].sort(() => 0.5 - Math.random());

    setCurrentQ({
      target: target.ta,
      targetSay: target.say,
      options,
      type: 'sound',
    });
    setAnsweredState(null);

    // Speak target sound
    setTimeout(() => {
      speakTamil(target.ta);
    }, 200);
  };

  const generateEquationQuestion = () => {
    const eq = mathEquations[Math.floor(Math.random() * mathEquations.length)];
    setCurrentQ({
      target: eq.target,
      targetSay: eq.targetSay,
      options: [...eq.options].sort(() => 0.5 - Math.random()),
      type: 'equation',
      equationPrompt: eq.prompt,
    });
    setAnsweredState(null);
  };

  const nextQuestion = () => {
    if (gameMode === 'sound') {
      generateSoundQuestion();
    } else {
      generateEquationQuestion();
    }
  };

  useEffect(() => {
    nextQuestion();
  }, [gameMode]);

  const handleSelectOption = (opt: string) => {
    if (answeredState || !currentQ) return;

    const isCorrect = opt === currentQ.target;
    setAnsweredState({ chosen: opt, correct: isCorrect });

    if (isCorrect) {
      const nextStreak = streak + 1;
      setStreak(nextStreak);
      if (nextStreak > bestStreak) {
        setBestStreak(nextStreak);
        localStorage.setItem('tamil_game_best_streak', nextStreak.toString());
      }
      speakTamil(opt);
    } else {
      setStreak(0);
    }
  };

  return (
    <div className="space-y-8 py-6 max-w-3xl mx-auto px-4 select-none">
      {/* Title Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Interactive Letter Games · எழுத்து விளையாட்டுகள்</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-ink-primary font-serif-tamil tracking-tight">
          Play &amp; Master Tamil Letters
        </h1>
        <p className="text-sm text-ink-secondary">
          Train your ear and visual memory with sound matching and letter equations.
        </p>

        {/* Streaks & Score */}
        <div className="flex items-center justify-center gap-4 pt-2">
          <div className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-paper-surface border border-border-subtle shadow-sm text-xs font-bold text-ink-primary">
            <Flame className="w-4 h-4 text-vermilion fill-vermilion" />
            <span>Streak: {streak}</span>
          </div>

          <div className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-paper-surface border border-border-subtle shadow-sm text-xs font-bold text-ink-primary">
            <Trophy className="w-4 h-4 text-gold fill-gold" />
            <span>Best Streak: {bestStreak}</span>
          </div>
        </div>
      </div>

      {/* Mode Switcher */}
      <div className="flex items-center justify-center gap-2">
        <button
          onClick={() => setGameMode('sound')}
          className={`px-4 py-2 rounded-2xl text-xs font-semibold transition-all ${
            gameMode === 'sound'
              ? 'bg-vermilion text-white shadow-sm'
              : 'bg-paper-surface text-ink-secondary hover:text-ink-primary border border-border-subtle'
          }`}
        >
          🎧 Listen &amp; Pick Letter
        </button>

        <button
          onClick={() => setGameMode('equation')}
          className={`px-4 py-2 rounded-2xl text-xs font-semibold transition-all ${
            gameMode === 'equation'
              ? 'bg-vermilion text-white shadow-sm'
              : 'bg-paper-surface text-ink-secondary hover:text-ink-primary border border-border-subtle'
          }`}
        >
          🧩 Letter Math (Mei + Uyir)
        </button>
      </div>

      {/* Game Card */}
      {currentQ && (
        <div className="p-6 sm:p-8 rounded-3xl bg-paper-surface border border-border-subtle shadow-md space-y-6 text-center">
          {currentQ.type === 'sound' ? (
            <div className="space-y-3">
              <span className="text-xs font-semibold text-ink-tertiary uppercase tracking-wider">
                Listen carefully and choose the matching letter
              </span>
              <div>
                <button
                  onClick={() => speakTamil(currentQ.target)}
                  className="w-20 h-20 mx-auto rounded-3xl bg-vermilion/10 hover:bg-vermilion/20 text-vermilion border border-vermilion/30 flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-sm"
                  aria-label="Replay sound"
                >
                  <Volume2 className="w-9 h-9" />
                </button>
              </div>
              <p className="text-xs text-ink-secondary font-mono">Sound: '{currentQ.targetSay}'</p>
            </div>
          ) : (
            <div className="space-y-3">
              <span className="text-xs font-semibold text-ink-tertiary uppercase tracking-wider">
                Combine the Mei and Uyir to find the Uyirmei letter
              </span>
              <div className="p-4 rounded-2xl bg-paper-muted border border-border-subtle max-w-sm mx-auto">
                <span className="text-2xl sm:text-3xl font-extrabold font-serif-tamil text-vermilion">
                  {currentQ.equationPrompt}
                </span>
              </div>
            </div>
          )}

          {/* Options Grid */}
          <div className="grid grid-cols-2 gap-3 max-w-md mx-auto pt-2">
            {currentQ.options.map((opt) => {
              const isSelected = answeredState?.chosen === opt;
              const isCorrectTarget = opt === currentQ.target;

              let btnStyle = 'bg-paper-muted border-border-subtle hover:border-vermilion hover:bg-paper-muted/80 text-ink-primary';
              if (answeredState) {
                if (isCorrectTarget) {
                  btnStyle = 'bg-emerald-500 text-white border-emerald-600 shadow-md';
                } else if (isSelected && !answeredState.correct) {
                  btnStyle = 'bg-red-500 text-white border-red-600 shadow-md';
                }
              }

              return (
                <button
                  key={opt}
                  onClick={() => handleSelectOption(opt)}
                  disabled={Boolean(answeredState)}
                  className={`p-6 rounded-2xl border text-3xl sm:text-4xl font-extrabold font-serif-tamil transition-all ${btnStyle}`}
                >
                  {opt}
                </button>
              );
            })}
          </div>

          {/* Next Button after answering */}
          {answeredState && (
            <div className="pt-4 flex flex-col items-center gap-3">
              <div className="flex items-center gap-2 text-sm font-bold">
                {answeredState.correct ? (
                  <span className="text-emerald-600 flex items-center gap-1.5">
                    <CheckCircle2 className="w-5 h-5" />
                    Correct! Fantastic job! (+10 XP)
                  </span>
                ) : (
                  <span className="text-red-500 flex items-center gap-1.5">
                    <XCircle className="w-5 h-5" />
                    The right letter was '{currentQ.target}' ({currentQ.targetSay})
                  </span>
                )}
              </div>

              <button
                onClick={nextQuestion}
                className="px-6 py-2.5 rounded-2xl bg-vermilion hover:bg-vermilion-hover text-white text-sm font-semibold shadow-md transition-all active:scale-95"
              >
                Next Letter →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
