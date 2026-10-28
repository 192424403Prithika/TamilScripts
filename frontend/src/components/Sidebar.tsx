import React from 'react';
import { useAppStore } from '../store/useAppStore';
import {
  PenTool,
  Sparkles,
  Edit3,
  GraduationCap,
  ScanLine,
  BookOpen,
  LayoutDashboard,
  History,
  Settings,
  Palette,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface NavItem {
  id: string;
  labelEn: string;
  labelTa: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { id: 'recognize', labelEn: 'Recognize', labelTa: 'அறிதல்', icon: PenTool },
  { id: 'generate', labelEn: 'Generate', labelTa: 'உருவாக்கம்', icon: Sparkles },
  { id: 'synthesis', labelEn: 'Write', labelTa: 'எழுதுதல்', icon: Edit3 },
  { id: 'coach', labelEn: 'Practice', labelTa: 'பயிற்சி', icon: GraduationCap },
  { id: 'scanner', labelEn: 'Scan', labelTa: 'ஸ்கேன்', icon: ScanLine },
  { id: 'quiz', labelEn: 'Learn', labelTa: 'கற்றல்', icon: BookOpen },
  { id: 'dashboard', labelEn: 'Dashboard', labelTa: 'டாஷ்போர்டு', icon: LayoutDashboard },
  { id: 'history', labelEn: 'History', labelTa: 'வரலாறு', icon: History },
  { id: 'design', labelEn: 'Design', labelTa: 'வடிவமைப்பு', icon: Palette },
  { id: 'settings', labelEn: 'Settings', labelTa: 'அமைப்புகள்', icon: Settings },
];

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, currentLang, sidebarCollapsed, toggleSidebar } = useAppStore();

  return (
    <aside
      className={`hidden md:flex flex-col flex-shrink-0 bg-paper-surface border-r border-border-subtle transition-all duration-200 z-30 select-none ${
        sidebarCollapsed ? 'w-20' : 'w-60'
      }`}
    >
      {/* Brand Seal Header in Sidebar */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-border-subtle">
        <button
          type="button"
          onClick={() => setActiveTab('home')}
          className="flex items-center gap-3 text-left focus:outline-none group overflow-hidden"
        >
          {/* Vermilion Scribe Seal */}
          <div className="w-9 h-9 rounded-xl bg-vermilion text-white flex items-center justify-center font-serif-tamil font-bold text-xl shadow-paper-sm flex-shrink-0 group-hover:bg-vermilion-hover transition-colors">
            அ
          </div>
          {!sidebarCollapsed && (
            <div className="flex flex-col truncate">
              <span className="font-bold text-sm text-ink-primary font-sans leading-none tracking-tight">
                TamilScript AI
              </span>
              <span className="text-[11px] text-ink-tertiary font-serif-tamil mt-1">
                கையெழுத்துக்கூடம்
              </span>
            </div>
          )}
        </button>

        <button
          type="button"
          onClick={toggleSidebar}
          className="p-1 rounded-lg text-ink-tertiary hover:text-ink-primary hover:bg-paper-muted transition-colors"
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto no-scrollbar">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const label = currentLang === 'ta' ? item.labelTa : item.labelEn;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center rounded-xl transition-all duration-150 text-sm font-medium ${
                sidebarCollapsed ? 'justify-center px-0 py-3' : 'px-3.5 py-2.5 gap-3'
              } ${
                isActive
                  ? 'bg-paper-muted text-vermilion font-semibold border border-border-strong shadow-paper-sm'
                  : 'text-ink-secondary hover:text-ink-primary hover:bg-paper-muted/60'
              }`}
              title={sidebarCollapsed ? label : undefined}
            >
              <Icon
                className={`w-5 h-5 flex-shrink-0 transition-colors ${
                  isActive ? 'text-vermilion' : 'text-ink-secondary'
                }`}
              />
              {!sidebarCollapsed && (
                <span className="truncate tracking-tight">{label}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Epigraphic Scribe Tagline footer */}
      {!sidebarCollapsed && (
        <div className="p-4 border-t border-border-subtle bg-paper-card/40 m-3 rounded-xl text-center">
          <p className="text-[11px] font-serif-tamil text-ink-secondary leading-relaxed">
            "எண்ணென்ப ஏனை எழுத்தென்ப இவ்விரண்டும் கண்ணென்ப"
          </p>
          <span className="text-[10px] text-ink-tertiary font-mono uppercase mt-1 block">
            Pure Deep Learning
          </span>
        </div>
      )}
    </aside>
  );
};
