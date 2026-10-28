import { create } from 'zustand';
import { Lang, translations } from '../i18n/translations';
import { PredictionItem, RecognitionResult } from '../types';

export type Theme = 'light' | 'dark';

interface AppState {
  currentLang: Lang;
  setLang: (lang: Lang) => void;
  t: typeof translations['en'];

  // Theme: light (warm paper #F7F1E5) vs dark (night ink #0F0E0D)
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;

  // Sidebar state
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;

  // Active predictions
  currentResult: RecognitionResult | null;
  setCurrentResult: (res: RecognitionResult | null) => void;

  // Real-time inference settings
  backendFallback: boolean;
  setBackendFallback: (enabled: boolean) => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;

  // Gamification & streak
  streakDays: number;
  incrementStreak: () => void;
  xp: number;
  addXP: (amount: number) => void;

  // Active page
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const getInitialTheme = (): Theme => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('tamilscript_theme') as Theme;
    if (saved === 'dark' || saved === 'light') return saved;
  }
  return 'light'; // Default is light ("warm paper")
};

export const useAppStore = create<AppState>((set, get) => {
  const initialTheme = getInitialTheme();
  if (typeof document !== 'undefined') {
    if (initialTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  return {
    currentLang: 'en',
    setLang: (lang: Lang) => set({ currentLang: lang, t: translations[lang] }),
    t: translations.en,

    theme: initialTheme,
    setTheme: (theme: Theme) => {
      if (typeof document !== 'undefined') {
        if (theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('tamilscript_theme', theme);
      }
      set({ theme });
    },
    toggleTheme: () => {
      const next = get().theme === 'light' ? 'dark' : 'light';
      get().setTheme(next);
    },

    sidebarCollapsed: false,
    setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
    toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

    currentResult: null,
    setCurrentResult: (res) => set({ currentResult: res }),

    backendFallback: false,
    setBackendFallback: (enabled) => set({ backendFallback: enabled }),
    soundEnabled: true,
    setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),

    streakDays: 3,
    incrementStreak: () => set((s) => ({ streakDays: s.streakDays + 1 })),
    xp: 450,
    addXP: (amount) => set((s) => ({ xp: s.xp + amount })),

    activeTab: 'home',
    setActiveTab: (tab) => set({ activeTab: tab })
  };
});
