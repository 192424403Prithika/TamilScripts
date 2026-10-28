import React, { useState } from 'react';
import { RecognitionResult } from '../types';
import { useAppStore } from '../store/useAppStore';
import { Volume2, Sparkles, HelpCircle, AlertTriangle } from 'lucide-react';
import { speakTamilText } from '../lib/speech';

interface PredictionPanelProps {
  result: RecognitionResult | null;
  onExplainRequest?: () => void;
  gradcamOverlay?: string | null;
}

export const PredictionPanel: React.FC<PredictionPanelProps> = ({
  result,
  onExplainRequest,
  gradcamOverlay
}) => {
  const { t } = useAppStore();
  const [showGradCam, setShowGradCam] = useState(false);

  if (!result || !result.top_prediction) {
    return (
      <div className="glass-panel rounded-2xl p-6 flex flex-col items-center justify-center min-h-[360px] text-center border border-slate-800">
        <div className="w-16 h-16 rounded-full bg-slate-900 flex items-center justify-center text-slate-600 mb-3 border border-slate-800">
          <Sparkles className="w-8 h-8 text-orange-500/40 animate-pulse" />
        </div>
        <p className="text-slate-400 font-medium text-sm max-w-xs">
          {t.predictions.waitingForStrokes}
        </p>
      </div>
    );
  }

  const top = result.top_prediction;

  return (
    <div className="glass-panel rounded-2xl p-6 flex flex-col justify-between border border-slate-800 relative overflow-hidden shadow-xl">
      
      {/* Scribble warning alert */}
      {result.is_scribble && (
        <div className="mb-4 px-3 py-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-400" />
          <span>{t.canvas.scribbleWarning}</span>
        </div>
      )}

      {/* Main Top Prediction Banner */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-500/20 to-amber-500/10 border border-orange-500/30 flex items-center justify-center shadow-lg">
            <span className="font-tamil text-5xl font-bold text-white drop-shadow-md">
              {top.char}
            </span>
            {/* Audio Button */}
            <button
              onClick={() => speakTamilText(top.char)}
              className="absolute -bottom-2 -right-2 p-1.5 rounded-full bg-orange-500 text-white shadow-md hover:scale-110 transition-transform"
              title="Speak character"
            >
              <Volume2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-slate-100 font-sans">
                {top.transliteration}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                {(top.confidence * 100).toFixed(1)}%
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">{top.unicode}</p>
            <p className="text-xs text-orange-400/90 font-medium mt-1">{top.meaning}</p>
          </div>
        </div>

        {/* Explainability Grad-CAM Button */}
        {onExplainRequest && (
          <button
            onClick={() => {
              onExplainRequest();
              setShowGradCam(!showGradCam);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-medium text-slate-300 hover:text-orange-400 hover:border-orange-500/40 transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Explain</span>
          </button>
        )}
      </div>

      {/* Grad-CAM Heatmap Overlay if toggled */}
      {showGradCam && gradcamOverlay && (
        <div className="my-4 p-3 rounded-xl bg-slate-900/90 border border-orange-500/30 flex items-center gap-3">
          <img 
            src={gradcamOverlay} 
            alt="Grad-CAM Attention Heatmap" 
            className="w-14 h-14 rounded-lg border border-slate-700 object-cover" 
          />
          <div className="text-xs text-slate-300">
            <span className="font-semibold text-orange-400">Grad-CAM Attribution:</span>
            <p className="text-slate-400 text-[11px] mt-0.5">
              Highlighted regions indicate strokes and loop junctions with highest neural gradient activations.
            </p>
          </div>
        </div>
      )}

      {/* Top 5 Prediction Bars */}
      <div className="mt-6 space-y-2.5">
        <div className="flex justify-between text-xs text-slate-400 font-medium px-1">
          <span>Top Candidates</span>
          <span>Confidence</span>
        </div>

        {result.predictions.map((p, idx) => {
          const percentage = Math.round(p.confidence * 100);
          return (
            <div key={idx} className="group flex items-center gap-3 text-sm">
              <span className="w-7 font-tamil text-lg font-bold text-slate-200 text-center">
                {p.char}
              </span>
              <div className="flex-1">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300 font-medium font-sans">
                    {p.transliteration} <span className="text-slate-500 font-normal">({p.category})</span>
                  </span>
                  <span className="font-mono text-slate-400">{percentage}%</span>
                </div>
                {/* Bar */}
                <div className="w-full bg-slate-800/80 rounded-full h-2 overflow-hidden border border-slate-700/40">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      idx === 0 
                        ? 'bg-gradient-to-r from-orange-500 to-amber-500' 
                        : 'bg-slate-600'
                    }`}
                    style={{ width: `${Math.max(4, percentage)}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
