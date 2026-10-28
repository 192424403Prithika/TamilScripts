import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { PenTool, Sparkles, Edit3, GraduationCap, LayoutDashboard } from 'lucide-react';

interface MobileTab {
  id: string;
  labelEn: string;
  labelTa: string;
  icon: React.ComponentType<{ className?: string }>;
}

const mobileTabs: MobileTab[] = [
  { id: 'recognize', labelEn: 'Recognize', labelTa: 'அறிதல்', icon: PenTool },
  { id: 'generate', labelEn: 'Generate', labelTa: 'உருவாக்கு', icon: Sparkles },
  { id: 'synthesis', labelEn: 'Write', labelTa: 'எழுது', icon: Edit3 },
  { id: 'coach', labelEn: 'Practice', labelTa: 'பயிற்சி', icon: GraduationCap },
  { id: 'dashboard', labelEn: 'Dashboard', labelTa: 'பலகை', icon: LayoutDashboard },
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
