import React from 'react';
import { motion } from 'framer-motion';

export interface SegmentedOption<T extends string> {
  value: T;
  label: React.ReactNode;
  icon?: React.ReactNode;
}

export interface SegmentedProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  size?: 'sm' | 'md';
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  className = '',
  size = 'md',
}: SegmentedProps<T>) {
  const sizeClasses = {
    sm: 'p-0.5 text-xs',
    md: 'p-1 text-sm',
  };

  const itemSizeClasses = {
    sm: 'px-2.5 py-1 gap-1',
    md: 'px-3.5 py-1.5 gap-1.5',
  };

  return (
    <div
      role="radiogroup"
      className={`inline-flex items-center rounded-xl bg-paper-muted border border-border-subtle ${sizeClasses[size]} ${className}`}
    >
      {options.map((option) => {
        const isSelected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onChange(option.value)}
            className={`relative flex items-center justify-center font-medium rounded-lg transition-colors duration-150 select-none z-10 ${
              itemSizeClasses[size]
            } ${
              isSelected ? 'text-ink-primary font-semibold' : 'text-ink-secondary hover:text-ink-primary'
            }`}
          >
            {isSelected && (
              <motion.div
                layoutId="segmented-active-indicator"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                className="absolute inset-0 rounded-lg bg-paper-surface border border-border-strong shadow-paper-sm -z-10"
              />
            )}
            {option.icon && <span className="flex-shrink-0 text-current">{option.icon}</span>}
            <span>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
