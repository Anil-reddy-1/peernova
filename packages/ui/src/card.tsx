import React from 'react';
import { cn } from './utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  glass?: boolean;
}

const paddingClasses: Record<NonNullable<CardProps['padding']>, string> = {
  none: 'p-0',
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-8',
};

export const Card = ({
    ref,
      padding = 'md',
      hover = false,
      glass = false,
      className,
      children,
      ...props
    }: CardProps & { ref?: React.Ref<HTMLDivElement> }) => {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-xl border',
          glass
            ? 'border-white/20 bg-white/10 backdrop-blur-lg dark:border-white/10 dark:bg-white/5'
            : 'border-surface-200 bg-white dark:border-surface-700 dark:bg-surface-800',
          paddingClasses[padding],
          hover &&
            'transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg dark:hover:shadow-surface-900/50',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }


Card.displayName = 'Card';
