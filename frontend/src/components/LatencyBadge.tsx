import React from 'react';
import { Zap } from 'lucide-react';

interface LatencyBadgeProps {
  latencyMs?: number;
  modality?: string;
}

export const LatencyBadge: React.FC<LatencyBadgeProps> = ({ latencyMs, modality }) => {
  const isOptimal = latencyMs !== undefined ? latencyMs <= 100 : true;

  return (
    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium glass-panel border border-orange-500/20 shadow-sm">
      <Zap className={`w-3.5 h-3.5 ${isOptimal ? 'text-emerald-400 fill-emerald-400/20' : 'text-amber-400'}`} />
      <span className="text-slate-300 font-mono">
        {latencyMs !== undefined ? `${latencyMs.toFixed(1)} ms` : '-- ms'}
      </span>
      {modality && (
        <span className="hidden sm:inline text-slate-500 text-[10px]">
          • {modality}
        </span>
      )}
    </div>
  );
};
