import React, { useEffect, useState } from 'react';
import { Card, Badge } from '../components/ui';
import { useAppStore } from '../store/useAppStore';
import { History, Calendar, Feather, Zap } from 'lucide-react';

export const HistoryPage: React.FC = () => {
  const { currentLang } = useAppStore();
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetch('/api/history')
      .then((res) => res.json())
      .then((data) => {
        setHistoryItems(data);
        setLoading(false);
      })
      .catch((err) => {
        console.warn("History fetch error:", err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-6">
      {/* Studio Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border-subtle pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-serif-tamil font-bold text-ink-primary tracking-tight">
              {currentLang === 'ta' ? 'எழுத்து சுவடு வரலாறு' : 'Scribe Chronicle & History'}
            </h1>
            <Badge variant="gold">
              SQLite Logged
            </Badge>
          </div>
          <p className="text-sm text-ink-secondary mt-1">
            {currentLang === 'ta'
              ? 'நீங்கள் வரைந்த எழுத்துக்களின் வரலாறு, உறுதித்தன்மை மற்றும் உண்மை நேர அளவீடுகள்.'
              : 'Historical log of handwritten strokes recognized, confidence ratings, and recorded inference latencies.'}
          </p>
        </div>
      </div>

      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-border-subtle pb-3">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-vermilion" />
            <span className="text-xs font-semibold uppercase tracking-wider text-ink-secondary">
              Chronological Recognition Log
            </span>
          </div>
          {historyItems.length > 0 && (
            <span className="text-xs font-mono text-ink-tertiary">
              {historyItems.length} entries recorded
            </span>
          )}
        </div>

        {historyItems.length > 0 ? (
          <div className="divide-y divide-border-subtle">
            {historyItems.map((item, idx) => (
              <div key={idx} className="py-4 flex items-center justify-between hover:bg-paper-muted/50 px-2 rounded-xl transition-colors">
                <div className="flex items-center gap-4">
                  {/* Vermilion Character Stamp */}
                  <div className="w-12 h-12 rounded-xl bg-paper-canvas border border-border-subtle flex items-center justify-center font-serif-tamil text-2xl font-bold text-ink-primary shadow-paper-sm">
                    {item.predicted_char}
                  </div>
                  <div>
                    <span className="text-base font-bold text-ink-primary font-sans">
                      {item.transliteration}
                    </span>
                    <span className="text-xs text-ink-tertiary ml-2 font-mono">
                      [{item.input_type}]
                    </span>
                    <div className="flex items-center gap-1.5 text-xs text-ink-secondary mt-0.5 font-mono">
                      <Calendar className="w-3.5 h-3.5 text-ink-tertiary" />
                      <span>{new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <span className="text-ink-tertiary">&bull;</span>
                      <span>{new Date(item.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right space-y-1">
                  <Badge variant={item.confidence >= 0.8 ? 'sage' : 'gold'}>
                    {(item.confidence * 100).toFixed(1)}%
                  </Badge>
                  <div className="text-[11px] font-mono text-ink-tertiary flex items-center justify-end gap-1">
                    <Zap className="w-3 h-3 text-vermilion" />
                    <span>{item.latency_ms.toFixed(1)} ms</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-16 text-center text-ink-tertiary space-y-3">
            <Feather className="w-9 h-9 mx-auto opacity-30 text-vermilion" />
            <p className="text-xs leading-relaxed max-w-xs mx-auto">
              No character strokes logged yet. Draw a character on the Recognize canvas to start your scribe history.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default HistoryPage;
