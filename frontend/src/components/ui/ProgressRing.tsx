import React from 'react';
import { motion } from 'framer-motion';

export interface ProgressRingProps {
  value: number; // 0.0 to 1.0 or 0 to 100
  size?: number;
  strokeWidth?: number;
  label?: string;
  showPercent?: boolean;
  colorClass?: string;
  color?: string;
  className?: string;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  value,
  size = 72,
  strokeWidth = 6,
  label,
  showPercent = true,
  colorClass,
  color,
  className = '',
}) => {
  // Normalize value to 0-100
  const normalizedValue = Math.min(100, Math.max(0, value <= 1 ? value * 100 : value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (normalizedValue / 100) * circumference;

  // Color scheme based on confidence or custom prop
  const getColor = () => {
    if (color) return color;
    if (normalizedValue >= 75) return 'var(--sage)';
    if (normalizedValue >= 50) return 'var(--gold)';
    return 'var(--vermilion)';
  };

  const ringColor = getColor();

  return (
    <div className={`relative inline-flex flex-col items-center justify-center ${className}`}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Track circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="var(--border-subtle)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Animated Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colorClass ? 'currentColor' : ringColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          strokeLinecap="round"
          fill="none"
          className={colorClass || ''}
        />
      </svg>
      {showPercent && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-sm font-bold font-mono text-ink-primary leading-none">
            {Math.round(normalizedValue)}%
          </span>
          {label && (
            <span className="text-[10px] text-ink-tertiary uppercase tracking-wider mt-0.5 font-sans">
              {label}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
