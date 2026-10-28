import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Card, Button, Badge } from '../components/ui';
import { Flame, Award, CheckCircle2, XCircle, ArrowRight, Trophy, BookOpen } from 'lucide-react';
import { LeaderboardEntry } from '../types';

export const QuizPage: React.FC = () => {
  const { xp, addXP, streakDays, currentLang } = useAppStore();

  const quizQuestions = [
    {
      targetChar: "அ",
      transliteration: "a",
      options: ["Short 'a' as in 'cup' (அகரம்)", "Long 'aa' as in 'father' (ஆகாரம்)", "Velar stop 'ka' (ககரம்)", "Labial stop 'pa' (பகரம்)"],
      correct: 0
    },
    {
      targetChar: "க",
      transliteration: "ka",
      options: ["Nasal 'ma' (மகரம்)", "Velar stop 'ka' (ககரம்)", "Short vowel 'i' (இகரம்)", "Ayutham ஃ (ஆய்த எழுத்து)"],
      correct: 1
    },
    {
      targetChar: "ழ",
      transliteration: "zha",
      options: ["Retroflex 'La' (ளகரம்)", "Special retroflex 'zha' (சிறப்பு ழகரம்)", "Alveolar 'Ra' (றகரம்)", "Dental 'na' (நகரம்)"],
      correct: 1
    },
    {
      targetChar: "ஔ",
      transliteration: "au",
      options: ["Diphthong 'au' as in 'cow' (ஔகாரம்)", "Long 'oo' as in 'boot' (ஊகாரம்)", "Short 'e' (எகரம்)", "Long 'ee' (ஏகாரம்)"],
      correct: 0
    }
  ];

  const [currentQIdx, setCurrentQIdx] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  const q = quizQuestions[currentQIdx];

  useEffect(() => {
    fetch('/api/leaderboard')
      .then((res) => res.json())
      .then((data) => setLeaderboard(data))
      .catch((err) => console.warn("Leaderboard error:", err));
  }, []);

  const handleSelect = (idx: number) => {
    if (isAnswered) return;
    setSelectedOpt(idx);
    setIsAnswered(true);

    if (idx === q.correct) {
      setScore((s) => s + 1);
      addXP(50);
    }
  };

  const handleNext = () => {
    setIsAnswered(false);
    setSelectedOpt(null);
    setCurrentQIdx((prev) => (prev + 1) % quizQuestions.length);
  };

  return (
    <div className="space-y-6">
      {/* Studio Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border-subtle pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-serif-tamil font-bold text-ink-primary tracking-tight">
              {currentLang === 'ta' ? 'தமிழ் வரிவடிவ வினாடி வினா' : 'Script Literacy & Quiz'}
            </h1>
            <Badge variant="sage">
              Interactive Scribe
            </Badge>
          </div>
          <p className="text-sm text-ink-secondary mt-1">
            {currentLang === 'ta'
              ? 'தமிழ் எழுத்துக்களின் ஒலிப்பு முறை மற்றும் வடிவ வேறுபாடுகளை அடையாளம் காணுங்கள்.'
              : 'Test your recognition of classical glyph shapes, phonetics, and grammatical classifications.'}
          </p>
        </div>

        {/* Stats */}
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
        {/* Left: Active Question Stage (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          <Card className="p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-ink-secondary">
                Question {currentQIdx + 1} of {quizQuestions.length}
              </span>
              <span className="text-xs font-mono font-medium text-gold">
                Score: {score} Correct
              </span>
            </div>

            {/* Target Glyph Showcase */}
            <div className="flex flex-col items-center justify-center py-6 bg-paper-canvas rounded-2xl border border-border-subtle canvas-ruled shadow-inner">
              <span className="font-serif-tamil text-7xl font-bold text-ink-primary mb-2">
                {q.targetChar}
              </span>
              <span className="text-sm font-bold text-ink-secondary font-mono">
                Transliteration: /{q.transliteration}/
              </span>
              <p className="text-xs text-ink-tertiary mt-1">
                Which linguistic description matches this classical glyph?
              </p>
            </div>

            {/* Multiple Choice Options */}
            <div className="space-y-2.5 pt-2">
              {q.options.map((opt, idx) => {
                let btnStyle = 'border-border-subtle bg-paper-surface hover:bg-paper-muted text-ink-primary';
                if (isAnswered) {
                  if (idx === q.correct) {
                    btnStyle = 'border-sage bg-sage/10 text-sage font-semibold';
                  } else if (idx === selectedOpt) {
                    btnStyle = 'border-vermilion bg-vermilion/10 text-vermilion line-through';
                  } else {
                    btnStyle = 'border-border-subtle bg-paper-muted opacity-50 text-ink-tertiary';
                  }
                }

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelect(idx)}
                    disabled={isAnswered}
                    className={`w-full p-4 rounded-xl border text-left text-sm transition-all flex items-center justify-between ${btnStyle}`}
                  >
                    <span>{opt}</span>
                    {isAnswered && idx === q.correct && (
                      <CheckCircle2 className="w-4 h-4 text-sage flex-shrink-0" />
                    )}
                    {isAnswered && idx === selectedOpt && idx !== q.correct && (
                      <XCircle className="w-4 h-4 text-vermilion flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Next Question CTA */}
            {isAnswered && (
              <div className="pt-2">
                <Button
                  variant="primary"
                  className="w-full"
                  onClick={handleNext}
                >
                  <span>Next Glyph Question</span>
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </div>
            )}
          </Card>
        </div>

        {/* Right: Scribe Leaderboard (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-gold" />
                <span className="text-xs font-semibold uppercase tracking-wider text-ink-secondary">
                  Epigraphic Scribe Hall of Fame
                </span>
              </div>
            </div>

            <div className="divide-y divide-border-subtle">
              {leaderboard.length > 0 ? (
                leaderboard.slice(0, 7).map((entry, idx) => (
                  <div key={idx} className="py-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <span className={`w-5 text-center font-mono font-bold ${
                        idx === 0 ? 'text-gold' : idx === 1 ? 'text-ink-secondary' : idx === 2 ? 'text-vermilion' : 'text-ink-tertiary'
                      }`}>
                        #{idx + 1}
                      </span>
                      <div>
                        <span className="font-semibold text-ink-primary block font-sans">
                          {entry.username}
                        </span>
                        <span className="text-[11px] text-ink-tertiary font-mono">
                          {entry.streak_days}d streak
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-mono font-bold text-ink-primary">
                        {entry.total_xp}
                      </span>
                      <span className="text-[10px] text-gold font-mono ml-1">XP</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-ink-tertiary text-xs">
                  Loading scribe rankings...
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default QuizPage;
