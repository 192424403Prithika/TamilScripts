import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAppStore } from './store/useAppStore';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { Home } from './pages/Home';
import { RecognizePage } from './pages/RecognizePage';
import { GeneratePage } from './pages/GeneratePage';
import { SynthesisPage } from './pages/SynthesisPage';
import { CoachPage } from './pages/CoachPage';
import { ScannerPage } from './pages/ScannerPage';
import { QuizPage } from './pages/QuizPage';
import { DashboardPage } from './pages/DashboardPage';
import { HistoryPage } from './pages/HistoryPage';
import { SettingsPage } from './pages/SettingsPage';
import { AboutPage } from './pages/AboutPage';
import { DesignSystemPage } from './pages/DesignSystemPage';

export const App: React.FC = () => {
  const { activeTab, currentLang } = useAppStore();

  const renderActivePage = () => {
    switch (activeTab) {
      case 'home':
        return <Home />;
      case 'recognize':
        return <RecognizePage />;
      case 'generate':
        return <GeneratePage />;
      case 'synthesis':
        return <SynthesisPage />;
      case 'coach':
        return <CoachPage />;
      case 'scanner':
        return <ScannerPage />;
      case 'quiz':
        return <QuizPage />;
      case 'dashboard':
        return <DashboardPage />;
      case 'history':
        return <HistoryPage />;
      case 'design':
        return <DesignSystemPage />;
      case 'settings':
        return <SettingsPage />;
      case 'about':
        return <AboutPage />;
      default:
        return <Home />;
    }
  };

  return (
    <div className="min-h-screen bg-paper-canvas text-ink-primary flex antialiased selection:bg-vermilion/20 selection:text-ink-primary font-sans">
      {/* Slim Desktop Sidebar */}
      <Sidebar />

      {/* Main Column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Minimalist Studio Header */}
        <Header />

        {/* Content Area with 200ms fade + 8px rise transition */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            >
              {renderActivePage()}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Editorial Studio Footer */}
        <footer className="border-t border-border-subtle bg-paper-surface py-5 text-center text-xs text-ink-tertiary">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="font-serif-tamil font-bold text-vermilion">தமிழ் எழுத்துக்களம்</span>
              <span className="text-ink-secondary">•</span>
              <span className="font-medium text-ink-secondary">TamilScript AI Studio</span>
            </div>
            <span className="font-serif-tamil text-ink-secondary italic">
              {currentLang === 'ta'
                ? 'செவ்விலக்கிய வரிவடிவங்களும் நவீன நரம்பியல் பார்வையும்'
                : 'Classical Epigraphy Meets Real-Time Neural Intelligence'}
            </span>
            <div className="font-mono text-[11px] text-ink-tertiary">
              Target &lt; 100 ms • Verified Deep Learning
            </div>
          </div>
        </footer>
      </div>

      {/* Mobile Touch Bottom Nav */}
      <BottomNav />
    </div>
  );
};

export default App;
