import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { Sun, Moon, Languages, Flame, User, Menu } from 'lucide-react';

export const Header: React.FC = () => {
  const { currentLang, setLang, theme, toggleTheme, streakDays, xp, setActiveTab, toggleSidebar } = useAppStore();

  return (
    <header className="h-16 bg-paper-surface border-b border-border-subtle px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20 select-none">
      {/* Mobile Menu trigger & Brand on small screen */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={toggleSidebar}
          className="md:hidden p-2 rounded-xl text-ink-secondary hover:text-ink-primary hover:bg-paper-muted transition-colors"
          aria-label="Toggle navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('home')}
          className="md:hidden flex items-center gap-2 text-left"
        >
          <div className="w-8 h-8 rounded-lg bg-vermilion text-white flex items-center justify-center font-serif-tamil font-bold text-lg">
            அ
          </div>
          <span className="font-bold text-sm text-ink-primary font-sans">
            TamilScript
          </span>
        </button>

        <span className="hidden md:inline-block text-xs font-serif-tamil text-ink-secondary italic">
          Classical Epigraphy &amp; Neural Calligraphy Studio
        </span>
      </div>

      {/* Right Controls: Streak, Language, Theme, Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Streak indicator */}
        <div
          className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-paper-muted border border-border-subtle text-xs font-mono font-medium text-ink-secondary"
          title={`${streakDays} days epigraphic calligraphy streak`}
        >
          <Flame className="w-3.5 h-3.5 text-vermilion fill-vermilion" />
          <span>{streakDays}d</span>
          <span className="text-ink-tertiary">•</span>
          <span className="text-gold font-bold">{xp} XP</span>
        </div>

        {/* Language Toggle (தமிழ் / EN) */}
        <button
          type="button"
          onClick={() => setLang(currentLang === 'en' ? 'ta' : 'en')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-paper-muted hover:bg-paper-muted/80 border border-border-subtle text-xs font-medium text-ink-primary transition-all active:scale-95"
          title="Switch language between Tamil and English"
        >
          <Languages className="w-3.5 h-3.5 text-ink-secondary" />
          <span className="font-serif-tamil font-semibold">
            {currentLang === 'en' ? 'தமிழ்' : 'English'}
          </span>
        </button>

        {/* Theme Toggle (Warm Paper / Night Ink) */}
        <button
          type="button"
          onClick={toggleTheme}
          className="p-2 rounded-xl bg-paper-muted hover:bg-paper-muted/80 border border-border-subtle text-ink-secondary hover:text-ink-primary transition-all active:scale-95"
          title={theme === 'light' ? 'Switch to Night Ink dark mode' : 'Switch to Warm Paper light mode'}
          aria-label="Toggle theme"
        >
          {theme === 'light' ? (
            <Moon className="w-4 h-4 text-ink-secondary" />
          ) : (
            <Sun className="w-4 h-4 text-gold" />
          )}
        </button>

        {/* Profile Avatar */}
        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          className="w-8 h-8 rounded-full bg-paper-muted border border-border-strong flex items-center justify-center text-ink-secondary hover:text-ink-primary hover:border-vermilion transition-colors"
          title="Profile & Settings"
          aria-label="Profile"
        >
          <User className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
