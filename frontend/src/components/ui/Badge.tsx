import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'sage' | 'vermilion' | 'gold' | 'outline' | 'subtle';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  size = 'md',
  className = '',
  children,
  ...props
}) => {
  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 gap-1 font-medium',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-semibold',
  };

  const variantClasses = {
    default: 'bg-paper-muted text-ink-secondary border border-border-subtle',
    sage: 'bg-sage/10 text-sage border border-sage/25',
    vermilion: 'bg-vermilion-subtle text-vermilion border border-vermilion/20',
    gold: 'bg-gold-subtle text-gold border border-gold/25',
    outline: 'bg-transparent text-ink-primary border border-border-strong',
    subtle: 'bg-paper-surface text-ink-secondary border border-border-subtle',
  };

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full font-mono tracking-wide ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};
