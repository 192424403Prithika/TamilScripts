import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { Home as HomeIcon, Grid, MessageSquare, Trophy, PenTool } from 'lucide-react';

interface MobileTab {
  id: string;
  labelEn: string;
  labelTa: string;
  icon: React.ComponentType<{ className?: string }>;
}

const mobileTabs: MobileTab[] = [
  { id: 'home', labelEn: 'Home', labelTa: 'முகப்பு', icon: HomeIcon },
  { id: 'chart', labelEn: '247 Chart', labelTa: 'எழுத்துக்கள்', icon: Grid },
  { id: 'speak', labelEn: 'Speak', labelTa: 'பேசு', icon: MessageSquare },
  { id: 'games', labelEn: 'Games', labelTa: 'விளையாட்டு', icon: Trophy },
  { id: 'recognize', labelEn: 'AI Studio', labelTa: 'ஆய்வகம்', icon: PenTool },
];

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab, currentLang } = useAppStore();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-paper-surface/95 backdrop-blur-md border-t border-border-subtle flex items-center justify-around px-2 z-40 select-none">
      {mobileTabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        const label = currentLang === 'ta' ? tab.labelTa : tab.labelEn;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center justify-center flex-1 py-1.5 transition-colors ${
              isActive ? 'text-vermilion font-semibold' : 'text-ink-secondary hover:text-ink-primary'
            }`}
          >
            <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'text-vermilion' : 'text-ink-secondary'}`} />
            <span className="text-[10px] tracking-tight truncate">{label}</span>
          </button>
        );
      })}
    </nav>
  );
};
