import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'muted' | 'outline' | 'surface';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  interactive?: boolean;
}

export const Card: React.FC<CardProps> = ({
  variant = 'default',
  padding = 'md',
  interactive = false,
  className = '',
  children,
  ...props
}) => {
  const paddingClasses = {
    none: 'p-0',
    sm: 'p-3 sm:p-4',
    md: 'p-5 sm:p-6',
    lg: 'p-6 sm:p-8',
  };

  const variantClasses = {
    default: 'bg-paper-card border border-border-subtle shadow-paper-sm',
    surface: 'bg-paper-surface border border-border-subtle shadow-paper-sm',
    muted: 'bg-paper-muted border border-border-subtle',
    outline: 'bg-transparent border border-border-strong',
  };

  return (
    <div
      className={`rounded-2xl transition-all duration-180 ${variantClasses[variant]} ${
        paddingClasses[padding]
      } ${
        interactive
          ? 'cursor-pointer hover:border-border-strong hover:shadow-paper active:scale-[0.99]'
          : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
