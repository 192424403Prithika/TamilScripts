import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { 
  Flame, 
  Sparkles, 
  Edit3, 
  Feather, 
  Scan, 
  HelpCircle, 
  BarChart3, 
  History, 
  Settings, 
  Info,
  Globe
} from 'lucide-react';
import { LatencyBadge } from './LatencyBadge';

export const Navbar: React.FC = () => {
  const { currentLang, setLang, t, activeTab, setActiveTab, currentResult, streakDays } = useAppStore();

  const navItems = [
    { id: 'home', label: t.nav.home, icon: Sparkles },
    { id: 'recognize', label: t.nav.recognize, icon: Edit3 },
    { id: 'generate', label: t.nav.generate, icon: Feather },
    { id: 'synthesis', label: t.nav.synthesis, icon: Feather },
    { id: 'coach', label: t.nav.coach, icon: HelpCircle },
    { id: 'scanner', label: t.nav.scanner, icon: Scan },
    { id: 'quiz', label: t.nav.quiz, icon: Flame },
    { id: 'dashboard', label: t.nav.dashboard, icon: BarChart3 },
    { id: 'history', label: t.nav.history, icon: History },
    { id: 'settings', label: t.nav.settings, icon: Settings },
    { id: 'about', label: t.nav.about, icon: Info },
  ];

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <div 
            onClick={() => setActiveTab('home')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-lg shadow-orange-500/20 group-hover:scale-105 transition-transform">
              <span className="font-tamil font-bold text-xl text-white">த</span>
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-orange-100 to-orange-400 bg-clip-text text-transparent">
                TamilScript AI
              </span>
              <span className="hidden md:block text-[10px] text-orange-400/80 font-tamil font-medium">
                தமிழ் நரம்பியல் ஆய்வகம்
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navItems.slice(0, 7).map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Controls: Streak, Latency, Lang Switch */}
          <div className="flex items-center gap-3">
            <LatencyBadge 
              latencyMs={currentResult?.latency_ms} 
              modality={currentResult?.modality} 
            />

            {/* Streak Badge */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">
              <Flame className="w-3.5 h-3.5 fill-amber-400" />
              <span>{streakDays} {currentLang === 'ta' ? 'நாள்' : 'days'}</span>
            </div>

            {/* Language Switch */}
            <button
              onClick={() => setLang(currentLang === 'en' ? 'ta' : 'en')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-900/60 text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors"
              title="Toggle Language / மொழி மாற்றுக"
            >
              <Globe className="w-3.5 h-3.5 text-orange-400" />
              <span>{currentLang === 'en' ? 'தமிழ்' : 'EN'}</span>
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Horizontal Sub-menu */}
      <div className="lg:hidden flex overflow-x-auto py-2 px-4 gap-2 border-t border-slate-800/60 no-scrollbar">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium ${
                isActive
                  ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40'
                  : 'text-slate-400 bg-slate-900/40'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
