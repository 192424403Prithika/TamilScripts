import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

export interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'sage' | 'vermilion' | 'outline';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses =
    'inline-flex items-center justify-center font-medium rounded-xl transition-colors duration-150 select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-vermilion focus-visible:ring-offset-2 disabled:opacity-40 disabled:pointer-events-none disabled:cursor-not-allowed';

  const sizeClasses = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2 gap-2',
    lg: 'text-base px-5 py-2.5 gap-2.5',
    icon: 'p-2 text-sm aspect-square'
  };

  const variantClasses = {
    primary:
      'bg-vermilion text-white hover:bg-vermilion-hover shadow-paper-sm active:bg-vermilion-hover',
    secondary:
      'bg-paper-surface border border-border-strong text-ink-primary hover:bg-paper-muted hover:border-ink-primary',
    outline:
      'bg-transparent border border-border-subtle text-ink-primary hover:bg-paper-muted hover:border-border-strong',
    ghost:
      'bg-transparent text-ink-secondary hover:text-ink-primary hover:bg-paper-muted',
    sage:
      'bg-sage text-white hover:opacity-95 shadow-paper-sm',
    vermilion:
      'bg-vermilion-subtle text-vermilion hover:bg-vermilion hover:text-white border border-vermilion/20',
  };

  return (
    <motion.button
      whileTap={{ scale: disabled || isLoading ? 1 : 0.98 }}
      transition={{ duration: 0.1 }}
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v8H4z"
          />
        </svg>
      ) : (
        leftIcon && <span className="flex-shrink-0">{leftIcon}</span>
      )}
      {children}
      {!isLoading && rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
    </motion.button>
  );
};
