import React from 'react';
import { Card, Button, Badge } from '../components/ui';
import { useAppStore } from '../store/useAppStore';
import { Settings, Server, Volume2, Globe, Moon, Sun, ShieldCheck } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const {
    currentLang, setLang,
    theme, toggleTheme,
    backendFallback, setBackendFallback,
    soundEnabled, setSoundEnabled
  } = useAppStore();

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Studio Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border-subtle pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-serif-tamil font-bold text-ink-primary tracking-tight">
              {currentLang === 'ta' ? 'கள அமைப்புகள்' : 'Studio Preferences & Settings'}
            </h1>
            <Badge variant="gold">
              Preferences
            </Badge>
          </div>
          <p className="text-sm text-ink-secondary mt-1">
            {currentLang === 'ta'
              ? 'நரம்பியல் கணிப்பு முறைகள், மொழி மற்றும் தோற்ற விருப்பங்களை நிர்வகியுங்கள்.'
              : 'Configure neural runtime routing, audio speech synthesizers, theme modes, and i18n locales.'}
          </p>
        </div>
      </div>

      <Card className="p-6 space-y-6">
        {/* Theme Preference */}
        <div className="flex items-center justify-between py-3 border-b border-border-subtle">
          <div className="flex items-start gap-3">
            {theme === 'dark' ? (
              <Moon className="w-5 h-5 text-gold mt-0.5" />
            ) : (
              <Sun className="w-5 h-5 text-vermilion mt-0.5" />
            )}
            <div>
              <span className="text-sm font-semibold text-ink-primary block">
                {currentLang === 'ta' ? 'தோற்ற நிறம்' : 'Studio Theme Surface'}
              </span>
              <span className="text-xs text-ink-secondary">
                {theme === 'dark'
                  ? 'Night Ink (#0F0E0D) with softened vermilion accents.'
                  : 'Warm Palm-Leaf Paper (#F7F1E5) with deep ink typography.'}
              </span>
            </div>
          </div>
          <Button variant="secondary" size="sm" onClick={toggleTheme}>
            <span>{theme === 'dark' ? 'Switch to Warm Paper' : 'Switch to Night Ink'}</span>
          </Button>
        </div>

        {/* Backend Fallback Mode */}
        <div className="flex items-center justify-between py-3 border-b border-border-subtle">
          <div className="flex items-start gap-3">
            <Server className="w-5 h-5 text-vermilion mt-0.5" />
            <div>
              <span className="text-sm font-semibold text-ink-primary block">
                FastAPI Server Inference Route
              </span>
              <span className="text-xs text-ink-secondary">
                Route stroke tensors to the FastAPI backend instead of in-browser WebGL worker.
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setBackendFallback(!backendFallback)}
            className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
              backendFallback ? 'bg-vermilion' : 'bg-paper-muted border border-border-subtle'
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-paper-sm transform transition-transform ${
                backendFallback ? 'translate-x-6' : ''
              }`}
            />
          </button>
        </div>

        {/* Audio Pronunciation */}
        <div className="flex items-center justify-between py-3 border-b border-border-subtle">
          <div className="flex items-start gap-3">
            <Volume2 className="w-5 h-5 text-gold mt-0.5" />
            <div>
              <span className="text-sm font-semibold text-ink-primary block">
                Web Speech Tamil Pronunciation
              </span>
              <span className="text-xs text-ink-secondary">
                Automatically vocalize recognized Tamil phonemes aloud using native Web Speech synthesis.
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
              soundEnabled ? 'bg-vermilion' : 'bg-paper-muted border border-border-subtle'
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-paper-sm transform transition-transform ${
                soundEnabled ? 'translate-x-6' : ''
              }`}
            />
          </button>
        </div>

        {/* Locale Toggle */}
        <div className="flex items-center justify-between py-3">
          <div className="flex items-start gap-3">
            <Globe className="w-5 h-5 text-sage mt-0.5" />
            <div>
              <span className="text-sm font-semibold text-ink-primary block">
                Interface Language (தமிழ் / English)
              </span>
              <span className="text-xs text-ink-secondary">
                Current locale: {currentLang === 'ta' ? 'தமிழ் (Classical Tamil)' : 'English'}
              </span>
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setLang(currentLang === 'en' ? 'ta' : 'en')}
          >
            <span className="font-serif-tamil font-semibold">
              {currentLang === 'en' ? 'தமிழுக்கு மாறுக' : 'Switch to English'}
            </span>
          </Button>
        </div>
      </Card>

      {/* Scribe Verification Stamp */}
      <div className="p-4 rounded-2xl bg-paper-muted border border-border-subtle flex items-start gap-3 text-xs text-ink-secondary">
        <ShieldCheck className="w-4 h-4 text-sage flex-shrink-0 mt-0.5" />
        <span className="leading-relaxed">
          PWA offline caching enabled for Model 1 ONNX weights. All model weights and client states persist in local IndexedDB storage.
        </span>
      </div>
    </div>
  );
};

export default SettingsPage;
